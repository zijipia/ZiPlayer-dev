import { BaseExtension, Player, PlayerManager, Track, SearchResult } from "ziplayer";
import type {
	ExtensionContext,
	ExtensionPlayRequest,
	ExtensionPlayResponse,
	ExtensionSearchRequest,
	ExtensionStreamRequest,
	StreamInfo,
} from "ziplayer";
import type { Client } from "discord.js";

// Import modules
import { NodeManager } from "./managers/NodeManager";
import { PlayerStateManager } from "./managers/PlayerStateManager";
import { TrackResolver } from "./resolvers/TrackResolver";
import { VoiceHandler } from "./handlers/VoiceHandler";
import { getEncoded, isTrack, createDebugLogger } from "./utils/helpers";
import type { LavalinkExtOptions, LavalinkPlayerState } from "./types/lavalink";

export class lavalinkExt extends BaseExtension {
	name = "lavalinkExt";
	version = "1.0.0";
	player: Player | null = null;

	// Core managers
	private nodeManager: NodeManager;
	private playerStateManager: PlayerStateManager;
	private trackResolver: TrackResolver;
	private voiceHandler: VoiceHandler;

	// Legacy properties for compatibility
	private manager?: PlayerManager;
	private client?: Client;
	private readonly options: LavalinkExtOptions;
	private userId?: string;
	private readonly originalMethods = new WeakMap<
		Player,
		{
			play: Player["play"];
			skip: Player["skip"];
			stop: Player["stop"];
			pause: Player["pause"];
			resume: Player["resume"];
			setVolume: Player["setVolume"];
			connect: Player["connect"];
		}
	>();
	private isReady = false;
	private updateTimer?: NodeJS.Timeout;
	private debug: (message: string, ...optional: any[]) => void;

	constructor(player: Player | null = null, opts: LavalinkExtOptions) {
		super();
		if (!opts || !Array.isArray(opts.nodes) || opts.nodes.length === 0) {
			throw new Error("lavalinkExt requires at least one Lavalink node configuration");
		}

		this.player = player;
		this.options = {
			searchPrefix: "scsearch",
			nodeSort: "players",
			requestTimeoutMs: 10_000,
			updateInterval: 5_000,
			...opts,
		};

		// Initialize debug logger
		this.debug = createDebugLogger(this.options.debug ?? false, "lavalinkExt");

		// Initialize managers
		this.nodeManager = new NodeManager(this.options);
		this.playerStateManager = new PlayerStateManager(this.options.debug ?? false);
		this.trackResolver = new TrackResolver(this.options.debug ?? false);
		this.voiceHandler = new VoiceHandler(this.options.debug ?? false);

		this.client = opts.client;
		this.userId = opts.userId;

		if (this.client) {
			this.bindClient(this.client);
		}
	}

	async active(alas: any): Promise<boolean> {
		if (alas?.manager && !this.manager) {
			this.manager = alas.manager as PlayerManager;
		}
		const providedClient = alas?.client as Client | undefined;
		if (providedClient && !this.client) {
			this.client = providedClient;
			this.bindClient(providedClient);
		}
		const player = (alas?.player as Player | undefined) || this.player;
		if (player) {
			this.attachToPlayer(player);
		}
		await this.initializeNodes();
		return true;
	}

	onRegister(context: ExtensionContext): void {
		this.attachToPlayer(context.player);
		this.startUpdateLoop();
	}

	async onDestroy(context: ExtensionContext): Promise<void> {
		this.debug(`Extension destroying for guild ${context.player.guildId}`);

		// Stop update loop first
		this.stopUpdateLoop();

		// Clean up all players gracefully before closing connections
		const allStates = this.playerStateManager.getAllStates();
		const cleanupPromises = Array.from(allStates.entries()).map(async ([player, state]: [Player, any]) => {
			if (state.node) {
				try {
					await this.destroyLavalinkPlayer(player);
				} catch (error) {
					this.debug(`Error cleaning up player for guild ${player.guildId}`, error);
				}
			}
		});

		// Wait for all cleanup to complete
		await Promise.allSettled(cleanupPromises);

		// Detach from current player
		this.detachFromPlayer(context.player);

		// Close all connections last
		this.nodeManager.closeAllConnections();
	}

	private bindClient(client: Client): void {
		if (this.client && this.client !== client) return;
		this.client = client;
		if (!this.userId && client.user?.id) {
			this.userId = client.user.id;
		}
		client.on("raw", (packet) =>
			this.voiceHandler.handleRawEvent(packet, this.userId!, this.playerStateManager, this.nodeManager),
		);
	}

	private async initializeNodes(): Promise<void> {
		this.debug("Initializing nodes");
		if (this.isReady) return;
		if (!this.userId && !this.client?.user?.id) return;
		if (!this.userId && this.client?.user?.id) {
			this.userId = this.client.user.id;
		}
		if (!this.userId) return;
		this.isReady = true;

		await this.nodeManager.initializeConnections(this.userId, this.options.clientName ?? `ziplayer-extension/${this.version}`);
	}

	private startUpdateLoop(): void {
		if (this.updateTimer) return;
		const interval = this.options.updateInterval ?? 5_000;
		this.updateTimer = setInterval(() => {
			this.updateAllPlayers().catch((error) => this.debug("Update loop error", error));
		}, interval);
	}

	private stopUpdateLoop(): void {
		if (this.updateTimer) {
			clearInterval(this.updateTimer);
			this.updateTimer = undefined;
		}
	}

	private async updateAllPlayers(): Promise<void> {
		for (const player of this.playerStateManager.getAllPlayers()) {
			const state = this.playerStateManager.getState(player);
			if (!state?.node?.connected || !state?.node?.wsConnected) continue;

			try {
				await this.updatePlayerState(player, state);
			} catch (error) {
				this.debug(`Failed to update player ${player.guildId}`, error);
			}
		}
	}

	private async updatePlayerState(player: Player, state: LavalinkPlayerState): Promise<void> {
		if (!state.node || !state.node.wsConnected) return;
		const node = state.node;

		try {
			// Get player info from Lavalink
			const playerInfo = await this.nodeManager.getPlayerInfo(node, player.guildId);

			if (!playerInfo) {
				// Player doesn't exist on Lavalink, clean up
				state.playing = false;
				state.paused = false;
				state.track = null;
				player.isPlaying = false;
				player.isPaused = false;
				return;
			}

			// Update position
			if (playerInfo.state) {
				state.lastPosition = playerInfo.state.position ?? 0;
			} else if (playerInfo.track && state.track) {
				state.lastPosition = playerInfo.track.info.position ?? 0;
			}

			// Check if track ended
			if (!playerInfo.track && state.track && state.playing) {
				const track = state.track;
				player.emit("trackEnd", track);
				state.track = null;
				state.playing = false;
				player.isPlaying = false;

				if (!state.skipNext) {
					this.startNextOnLavalink(player).catch((error) =>
						this.debug(`Failed to start next track for ${player.guildId}`, error),
					);
				}
				state.skipNext = false;
			}

			// Check if track started
			if (playerInfo.track && !state.track && !state.playing) {
				const track = this.trackResolver.resolveTrackFromLavalink(player, playerInfo.track);
				if (track) {
					state.track = track;
					state.playing = true;
					state.paused = false;
					player.isPlaying = true;
					player.isPaused = false;
					player.emit("trackStart", track);
				}
			}

			// Update pause state
			if (state.playing && playerInfo.paused !== state.paused) {
				state.paused = playerInfo.paused;
				player.isPaused = playerInfo.paused;
				if (state.track) {
					if (playerInfo.paused) {
						player.emit("playerPause", state.track);
					} else {
						player.emit("playerResume", state.track);
					}
				}
			}
		} catch (error) {
			// Player might not exist on this node, try to find another node
			if (error instanceof Error && error.message.includes("404")) {
				state.node.players.delete(player.guildId);
				state.node = undefined;
			}
			throw error;
		}
	}

	private attachToPlayer(player: Player): void {
		if (!player) return;
		this.player = this.player ?? player;

		// Use PlayerStateManager
		this.playerStateManager.attachPlayer(player);

		if (!this.manager) {
			const maybeManager = (player as any).pluginManager?.manager ?? (player as any)?.manager;
			if (maybeManager) this.manager = maybeManager as PlayerManager;
		}

		if (!this.originalMethods.has(player)) {
			this.originalMethods.set(player, {
				play: player.play.bind(player),
				skip: player.skip.bind(player),
				stop: player.stop.bind(player),
				pause: player.pause.bind(player),
				resume: player.resume.bind(player),
				setVolume: player.setVolume.bind(player),
				connect: player.connect.bind(player),
			});

			(player as any).skip = () => this.skip(player);
			(player as any).stop = () => this.stop(player);
			(player as any).pause = () => this.pause(player);
			(player as any).resume = () => this.resume(player);
			(player as any).setVolume = (volume: number) => this.setVolume(player, volume);
			(player as any).connect = async (channel: any) => this.connect(player, channel);
		}

		const onDestroy = () => {
			this.destroyLavalinkPlayer(player).catch((error) =>
				this.debug(`Failed to destroy Lavalink player for guild ${player.guildId}`, error),
			);
			this.detachFromPlayer(player);
		};
		player.once("playerDestroy", onDestroy);
	}

	private detachFromPlayer(player: Player): void {
		const original = this.originalMethods.get(player);
		if (original) {
			(player as any).skip = original.skip;
			(player as any).stop = original.stop;
			(player as any).pause = original.pause;
			(player as any).resume = original.resume;
			(player as any).setVolume = original.setVolume;
			(player as any).connect = original.connect;
			this.originalMethods.delete(player);
		}

		const state = this.playerStateManager.getState(player);
		if (state) {
			this.destroyLavalinkPlayer(player).catch((error) =>
				this.debug(`Failed to destroy Lavalink player during detach for ${player.guildId}`, error),
			);
		}

		// Use PlayerStateManager
		this.playerStateManager.detachPlayer(player);
	}

	async beforePlay(context: ExtensionContext, payload: ExtensionPlayRequest): Promise<ExtensionPlayResponse> {
		const player = context.player;
		this.attachToPlayer(player);
		await this.initializeNodes();

		const requestedBy = payload.requestedBy ?? "Unknown";
		try {
			const { tracks, isPlaylist } = await this.trackResolver.resolvePlayRequest(
				player,
				payload.query,
				requestedBy,
				this.nodeManager,
				this.options.searchPrefix,
			);
			if (tracks.length === 0) {
				return {
					handled: false,
					success: false,
					error: new Error("No tracks found"),
				};
			}

			if (isPlaylist) {
				player.queue.addMultiple(tracks);
				player.emit("queueAddList", tracks);
			} else {
				player.queue.add(tracks[0]);
				player.emit("queueAdd", tracks[0]);
			}

			const state = this.playerStateManager.getState(player);
			const shouldStart = !(state?.playing ?? false) && !(player.isPlaying ?? false);
			const success = shouldStart ? await this.startNextOnLavalink(player) : true;

			return {
				handled: true,
				success,
				isPlaylist,
			};
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.debug(`beforePlay error: ${err.message}`);
			return {
				handled: false,
				success: false,
				error: err,
			};
		}
	}

	async provideSearch(_context: ExtensionContext, payload: ExtensionSearchRequest): Promise<SearchResult | null> {
		try {
			return await this.trackResolver.searchLavalink(
				payload.query,
				payload.requestedBy,
				this.nodeManager,
				this.options.searchPrefix,
			);
		} catch (error) {
			this.debug(`provideSearch error: ${(error as Error).message}`);
			return null;
		}
	}

	async provideStream(_context: ExtensionContext, payload: ExtensionStreamRequest): Promise<StreamInfo | null> {
		try {
			const track = payload.track;
			const state = this.playerStateManager.getState(_context.player);

			if (!state?.node || !state.playing || !state.track) {
				return null;
			}

			const currentTrack = state.track;
			if (getEncoded(currentTrack) !== getEncoded(track)) {
				return null;
			}

			return {
				stream: null as any,
				type: "arbitrary",
				metadata: {
					lavalink: true,
					node: state.node.identifier,
					encoded: getEncoded(track),
				},
			};
		} catch (error) {
			this.debug(`provideStream error: ${(error as Error).message}`);
			return null;
		}
	}

	private async ensureNodeForPlayer(player: Player): Promise<any> {
		let state = this.playerStateManager.getState(player);
		if (!state) {
			this.attachToPlayer(player);
			state = this.playerStateManager.getState(player);
		}
		if (!state) throw new Error("Missing player state");

		let node = state.node;
		const needsNewNode = !node || !node.connected || !node.wsConnected || !node.sessionId;

		if (needsNewNode) {
			const picked = this.nodeManager.selectNode(this.options.nodeSort);
			if (!picked) throw new Error("No Lavalink nodes available");
			node = picked;
			this.playerStateManager.setPlayerNode(player, node);
			this.debug(`Assigned node ${node.identifier} to guild ${player.guildId}`);
		}

		// Only send voice update if we got a new node or if voice state is complete but not yet sent
		const shouldSendVoiceUpdate =
			needsNewNode &&
			state.voiceState?.sessionId &&
			state.voiceServer?.token &&
			state.voiceServer?.endpoint &&
			!state.voiceUpdateSent;

		if (shouldSendVoiceUpdate && node) {
			await this.voiceHandler.sendVoiceUpdate(node, player.guildId, state);
			state.voiceUpdateSent = true;
		}

		return node;
	}

	private async connect(player: Player, channel: any): Promise<any> {
		const original = this.originalMethods.get(player)?.connect;
		const channelId: string | null = channel?.id ?? channel ?? null;
		if (!channelId) throw new Error("Invalid channel provided to connect");
		const guildId = player.guildId;
		const state = this.playerStateManager.getState(player);
		if (state) {
			state.channelId = channelId;
		}

		if (this.options.sendGatewayPayload) {
			await this.voiceHandler.connect(player, channel, this.options.sendGatewayPayload);
			await this.playerStateManager.waitForVoice(player, this.options.requestTimeoutMs);
			return null;
		}

		if (!original) throw new Error("Player connect method missing");
		const connection = await original(channel);
		await this.playerStateManager
			.waitForVoice(player, this.options.requestTimeoutMs)
			.catch((error) => this.debug(`Voice wait failed: ${error.message}`));
		return connection;
	}

	private async startNextOnLavalink(player: Player, ignoreLoop = false): Promise<boolean> {
		const node = await this.ensureNodeForPlayer(player);
		const state = this.playerStateManager.getState(player);
		if (!state) throw new Error("Missing state for player");

		const track = player.queue.next(ignoreLoop || state.skipNext);
		state.skipNext = false;
		if (!track) {
			if (player.queue.autoPlay()) {
				const nextAuto = player.queue.willNextTrack();
				if (nextAuto) {
					player.queue.addMultiple([nextAuto]);
					return this.startNextOnLavalink(player, true);
				}
			}
			state.playing = false;
			state.paused = false;
			state.track = null;
			player.isPlaying = false;
			player.isPaused = false;
			player.emit("queueEnd");
			(player as any).scheduleLeave?.();
			return false;
		}

		(player as any).clearLeaveTimeout?.();
		await (player as any).generateWillNext?.();
		try {
			await this.playerStateManager.waitForVoice(player, this.options.requestTimeoutMs);
		} catch (error) {
			this.debug(`Voice readiness failed for ${player.guildId}`, error);
		}

		try {
			await this.trackResolver.ensureTrackEncoded(player, track, track.requestedBy ?? "Unknown", this.nodeManager);
			const encoded = getEncoded(track);
			if (!encoded) throw new Error("Track has no Lavalink payload");
			track.metadata = {
				...(track.metadata ?? {}),
				lavalink: {
					...((track.metadata ?? {}).lavalink ?? {}),
					encoded,
					node: node.identifier,
				},
			};
			this.playerStateManager.setPlayerNode(player, node);
			state.track = track;
			state.playing = true;
			state.paused = false;
			player.isPlaying = true;
			player.isPaused = false;
			await this.nodeManager.updatePlayer(node, player.guildId, {
				track: {
					encoded: encoded,
				},
				volume: player.volume ?? state.volume ?? 100,
			});
			return true;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.debug(`Failed to start track on Lavalink: ${err.message}`);
			player.emit("playerError", err, track);
			return this.startNextOnLavalink(player, true);
		}
	}

	private async destroyLavalinkPlayer(player: Player): Promise<void> {
		const state = this.playerStateManager.getState(player);
		if (!state?.node) return;

		try {
			// First try to stop the player gracefully
			await this.nodeManager.updatePlayer(state.node, player.guildId, {
				track: null,
				paused: false,
			});

			// Small delay to ensure the update is processed
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Then destroy the player
			await this.nodeManager.destroyPlayer(state.node, player.guildId);
		} catch (error) {
			this.debug(`Failed to destroy Lavalink player for ${player.guildId}`, error);
		} finally {
			// Always clean up local state
			state.track = null;
			state.playing = false;
			state.paused = false;
		}
	}

	private pause(player: Player): boolean {
		const state = this.playerStateManager.getState(player);
		if (!state?.node || !state.playing || state.paused) return false;
		state.paused = true;
		player.isPaused = true;
		const track = state.track ?? player.queue.currentTrack ?? undefined;
		if (track) player.emit("playerPause", track);
		this.nodeManager
			.updatePlayer(state.node, player.guildId, { paused: true })
			.catch((error) => this.debug(`Pause failed`, error));
		return true;
	}

	private resume(player: Player): boolean {
		const state = this.playerStateManager.getState(player);
		if (!state?.node || !state.paused) return false;
		state.paused = false;
		player.isPaused = false;
		const track = state.track ?? player.queue.currentTrack ?? undefined;
		if (track) player.emit("playerResume", track);
		this.nodeManager
			.updatePlayer(state.node, player.guildId, { paused: false })
			.catch((error) => this.debug(`Resume failed`, error));
		return true;
	}

	private stop(player: Player): boolean {
		const state = this.playerStateManager.getState(player);
		if (!state?.node) return false;

		// Clear local state first
		player.queue.clear();
		state.track = null;
		state.playing = false;
		state.paused = false;
		player.isPlaying = false;
		player.isPaused = false;
		player.emit("playerStop");

		// Destroy player on Lavalink first, then update (if needed)
		this.destroyLavalinkPlayer(player).catch((error) =>
			this.debug(`Failed to destroy Lavalink player during stop for ${player.guildId}`, error),
		);

		return true;
	}

	private skip(player: Player): boolean {
		const state = this.playerStateManager.getState(player);
		if (!state?.node) return false;
		state.skipNext = true;
		this.nodeManager.updatePlayer(state.node, player.guildId, { track: null }).catch((error) => this.debug(`Skip failed`, error));
		return true;
	}

	private setVolume(player: Player, volume: number): boolean {
		if (volume < 0 || volume > 200) return false;
		const state = this.playerStateManager.getState(player);
		if (!state?.node) {
			const original = this.originalMethods.get(player)?.setVolume;
			return original ? original(volume) : false;
		}
		const old = player.volume ?? 100;
		player.volume = volume;
		state.volume = volume;
		player.emit("volumeChange", old, volume);
		this.nodeManager
			.updatePlayer(state.node, player.guildId, { volume })
			.catch((error) => this.debug(`Failed to set volume`, error));
		return true;
	}
}
