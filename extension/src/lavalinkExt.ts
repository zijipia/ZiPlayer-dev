import axios, { AxiosInstance } from "axios";
import WebSocket from "ws";
import { BaseExtension, Player, PlayerManager, Track, SearchResult } from "ziplayer";
import type {
	ExtensionContext,
	ExtensionPlayRequest,
	ExtensionPlayResponse,
	ExtensionAfterPlayPayload,
	ExtensionSearchRequest,
} from "ziplayer";
import type { Client } from "discord.js";

type LavalinkLoadType = "track" | "playlist" | "search" | "empty" | "error";

interface LavalinkRawTrack {
	encoded: string;
	info: {
		identifier: string;
		isSeekable?: boolean;
		author?: string;
		length?: number;
		isStream?: boolean;
		position?: number;
		title: string;
		uri?: string | null;
		artworkUrl?: string | null;
		sourceName?: string;
	};
	pluginInfo?: Record<string, any>;
	userData?: Record<string, any>;
}

interface LavalinkPlaylistData {
	info: {
		name: string;
		selectedTrack: number;
		url?: string | null;
		artworkUrl?: string | null;
	};
	pluginInfo?: Record<string, any>;
	tracks: LavalinkRawTrack[];
}

interface LavalinkLoadResponse {
	loadType: LavalinkLoadType;
	data: LavalinkRawTrack[] | LavalinkPlaylistData | { message?: string; severity?: string; cause?: string } | null;
}

interface LavalinkStats {
	players: number;
	playingPlayers: number;
	uptime: number;
	cpu?: {
		cores: number;
		systemLoad: number;
		lavalinkLoad: number;
	};
	memory?: {
		free: number;
		used: number;
		allocated: number;
		reservable: number;
	};
	frameStats?: {
		sent: number;
		nulled: number;
		deficit: number;
	};
}

// Lavalink v4 REST API interfaces

interface LavalinkPlayerInfo {
	guildId: string;
	track?: LavalinkRawTrack | null;
	volume: number;
	paused: boolean;
	voice: {
		token: string;
		endpoint: string;
		sessionId: string;
	};
	filters?: Record<string, any>;
	state?: {
		time: number;
		position: number;
		connected: boolean;
		ping: number;
	};
}

export interface LavalinkNodeOptions {
	identifier?: string;
	host: string;
	port?: number;
	password: string;
	secure?: boolean;
	sessionId?: string;
	url?: string;
}

export interface LavalinkExtOptions {
	nodes: LavalinkNodeOptions[];
	client?: Client;
	userId?: string;
	sendGatewayPayload?: (guildId: string, payload: any) => Promise<void> | void;
	searchPrefix?: string;
	nodeSort?: "players" | "cpu" | "memory" | "random";
	requestTimeoutMs?: number;
	clientName?: string;
	updateInterval?: number; // Interval for polling player state updates
	debug?: boolean;
}

interface InternalNode extends LavalinkNodeOptions {
	identifier: string;
	rest: AxiosInstance;
	ws?: WebSocket;
	connected: boolean;
	stats?: LavalinkStats;
	players: Set<string>;
	lastPing?: number;
	sessionId?: string;
	wsConnected: boolean;
	wsReconnectAttempts: number;
	maxReconnectAttempts: number;
}

type VoiceServerRawEvent = {
	token: string;
	endpoint: string | null;
	guild_id: string;
	[key: string]: any;
};

interface VoiceServerState {
	token: string;
	endpoint: string | null;
	guildId: string;
	rawEvent: VoiceServerRawEvent;
}

interface LavalinkPlayerState {
	node?: InternalNode;
	channelId?: string | null;
	voiceState?: { sessionId?: string | null; channelId?: string | null };
	voiceServer?: VoiceServerState;
	track?: Track | null;
	playing: boolean;
	paused: boolean;
	volume: number;
	skipNext: boolean;
	awaitingNode?: boolean;
	awaitingTrack?: boolean;
	voiceTimeout?: NodeJS.Timeout | null;
	lastPosition?: number;
	autoPlayChecked?: boolean;
	updateInterval?: NodeJS.Timeout;
}

interface VoiceWaiter {
	resolve: () => void;
	reject: (error: Error) => void;
	timer: NodeJS.Timeout;
}

const isTrack = (value: any): value is Track => value && typeof value === "object" && typeof value.title === "string";

const isUrl = (value: string): boolean => /^(https?:\/\/|wss?:\/\/)/i.test(value);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// WebSocket OP Types
interface LavalinkWebSocketMessage {
	op: string;
	[key: string]: any;
}

interface LavalinkReadyMessage extends LavalinkWebSocketMessage {
	op: "ready";
	resumed: boolean;
	sessionId: string;
}

interface LavalinkStatsMessage extends LavalinkWebSocketMessage {
	op: "stats";
	players: number;
	playingPlayers: number;
	uptime: number;
	memory?: {
		free: number;
		used: number;
		allocated: number;
		reservable: number;
	};
	cpu?: {
		cores: number;
		systemLoad: number;
		lavalinkLoad: number;
	};
	frameStats?: {
		sent: number;
		nulled: number;
		deficit: number;
	};
}

interface LavalinkPlayerUpdateMessage extends LavalinkWebSocketMessage {
	op: "playerUpdate";
	guildId: string;
	state: {
		time: number;
		position: number;
		connected: boolean;
		ping: number;
	};
}

interface LavalinkEventMessage extends LavalinkWebSocketMessage {
	op: "event";
	type: "TrackStartEvent" | "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";
	guildId: string;
	[key: string]: any;
}

export class lavalinkExt extends BaseExtension {
	name = "lavalinkExt";
	version = "1.0.0";
	player: Player | null = null;
	private manager?: PlayerManager;
	private client?: Client;
	private readonly options: LavalinkExtOptions;
	private readonly nodes: InternalNode[] = [];
	private userId?: string;
	private readonly playerStates = new WeakMap<Player, LavalinkPlayerState>();
	private readonly guildMap = new Map<string, Player>();
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
	private readonly voiceWaiters = new Map<string, VoiceWaiter>();
	private isReady = false;
	private updateTimer?: NodeJS.Timeout;

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
		this.client = opts.client;
		this.userId = opts.userId;
		for (const config of opts.nodes) {
			this.nodes.push(this.createNode(config));
		}
		if (this.client) {
			this.bindClient(this.client);
		}
		// this.startUpdateLoop();
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

	onDestroy(context: ExtensionContext): void {
		this.detachFromPlayer(context.player);
		this.stopUpdateLoop();
		this.closeAllWebSockets();
	}

	private closeAllWebSockets(): void {
		for (const node of this.nodes) {
			if (node.ws) {
				node.ws.close(1000, "Extension destroyed");
				node.ws = undefined;
				node.wsConnected = false;
			}
		}
	}

	private createNode(config: LavalinkNodeOptions): InternalNode {
		const secure = config.secure ?? true;
		const port = config.port ?? (secure ? 443 : 2333);
		const identifier = config.identifier ?? `${config.host}:${port}`;
		const protocol = secure ? "https" : "http";
		const wsProtocol = secure ? "wss" : "ws";
		const baseURL = `${protocol}://${config.host}:${port}`;
		const wsURL = `${wsProtocol}://${config.host}:${port}/v4/websocket`;
		const headers: Record<string, string> = {
			Authorization: config.password,
			"Client-Name": this.options.clientName ?? `ziplayer-extension/${this.version}`,
		};
		const rest = axios.create({
			baseURL,
			timeout: this.options.requestTimeoutMs,
			headers,
		});
		return {
			...config,
			identifier,
			port,
			secure,
			rest,
			connected: false,
			wsConnected: false,
			lastPing: undefined,
			players: new Set<string>(),
			wsReconnectAttempts: 0,
			maxReconnectAttempts: 5,
		};
	}

	private bindClient(client: Client): void {
		if (this.client && this.client !== client) return;
		this.client = client;
		if (!this.userId && client.user?.id) {
			this.userId = client.user.id;
		}
		client.on("raw", this.handleRawEvent);
		if (!client.listenerCount("ready")) {
			// client.once("ready", async () => {
			// 	if (!this.userId && client.user?.id) {
			// 		this.userId = client.user.id;
			// 	}
			// 	await this.initializeNodes().catch((error) => this.debug("Initialize nodes error", error));
			// });
		}
	}

	private async initializeNodes(): Promise<void> {
		console.log("Initializing nodes");
		console.log(this.isReady, this.userId, this.client?.user?.id);
		if (this.isReady) return;
		if (!this.userId && !this.client?.user?.id) return;
		if (!this.userId && this.client?.user?.id) {
			this.userId = this.client.user.id;
		}
		if (!this.userId) return;
		this.isReady = true;

		await Promise.all(
			this.nodes.map((node) =>
				this.testNodeConnection(node).catch((error) => this.debug(`Failed to test node ${node.identifier}`, error)),
			),
		);
	}

	private async testNodeConnection(node: InternalNode): Promise<void> {
		try {
			const response = await node.rest.get("/version");
			node.connected = true;
			this.debug(`Node ${node.identifier} connected successfully`);

			// Connect WebSocket to get sessionId
			await this.connectWebSocket(node);
		} catch (error) {
			node.connected = false;
			this.debug(`Node ${node.identifier} connection failed`, error);
		}
	}

	private async connectWebSocket(node: InternalNode): Promise<void> {
		if (!this.userId) {
			throw new Error("User ID is required for WebSocket connection");
		}

		const secure = node.secure ?? true;
		const port = node.port ?? (secure ? 443 : 2333);
		const wsProtocol = secure ? "wss" : "ws";
		const wsURL = `${wsProtocol}://${node.host}:${port}/v4/websocket`;

		const headers = {
			Authorization: node.password,
			"User-Id": this.userId,
			"Client-Name": this.options.clientName ?? `ziplayer-extension/${this.version}`,
			...(node.sessionId && { "Session-Id": node.sessionId }),
		};

		return new Promise((resolve, reject) => {
			const ws = new WebSocket(wsURL, { headers });
			node.ws = ws;

			ws.on("open", () => {
				this.debug(`WebSocket connected to ${node.identifier}`);
				node.wsConnected = true;
				node.wsReconnectAttempts = 0;
			});

			ws.on("message", (data: Buffer) => {
				try {
					const message = JSON.parse(data.toString()) as LavalinkWebSocketMessage;
					this.handleWebSocketMessage(node, message);
				} catch (error) {
					this.debug(`Failed to parse WebSocket message from ${node.identifier}`, error);
				}
			});

			ws.on("close", (code: number, reason: Buffer) => {
				this.debug(`WebSocket closed for ${node.identifier}: ${code} ${reason.toString()}`);
				node.wsConnected = false;
				node.ws = undefined;

				// Auto-reconnect if not manually closed
				if (code !== 1000 && node.wsReconnectAttempts < node.maxReconnectAttempts) {
					node.wsReconnectAttempts++;
					this.debug(
						`Attempting to reconnect WebSocket for ${node.identifier} (${node.wsReconnectAttempts}/${node.maxReconnectAttempts})`,
					);
					setTimeout(() => {
						this.connectWebSocket(node).catch((error) =>
							this.debug(`WebSocket reconnection failed for ${node.identifier}`, error),
						);
					}, 5000 * node.wsReconnectAttempts);
				}
			});

			ws.on("error", (error: Error) => {
				this.debug(`WebSocket error for ${node.identifier}`, error);
				node.wsConnected = false;
				reject(error);
			});

			// Resolve after ready event is received
			const originalHandleMessage = this.handleWebSocketMessage.bind(this);
			this.handleWebSocketMessage = (node: InternalNode, message: LavalinkWebSocketMessage) => {
				if (message.op === "ready") {
					resolve();
				}
				originalHandleMessage(node, message);
			};
		});
	}

	private handleWebSocketMessage(node: InternalNode, message: LavalinkWebSocketMessage): void {
		switch (message.op) {
			case "ready": {
				const readyMsg = message as LavalinkReadyMessage;
				node.sessionId = readyMsg.sessionId;
				this.debug(`Node ${node.identifier} session ready: ${readyMsg.sessionId} (resumed: ${readyMsg.resumed})`);
				break;
			}
			case "stats": {
				const statsMsg = message as LavalinkStatsMessage;
				node.stats = {
					players: statsMsg.players,
					playingPlayers: statsMsg.playingPlayers,
					uptime: statsMsg.uptime,
					memory: statsMsg.memory,
					cpu: statsMsg.cpu,
					frameStats: statsMsg.frameStats,
				};
				this.debug(`Node ${node.identifier} stats updated`, node.stats);
				break;
			}
			case "playerUpdate": {
				const playerUpdateMsg = message as LavalinkPlayerUpdateMessage;
				this.handlePlayerUpdate(node, playerUpdateMsg);
				break;
			}
			case "event": {
				const eventMsg = message as LavalinkEventMessage;
				this.handleLavalinkEvent(node, eventMsg);
				break;
			}
			default:
				this.debug(`Unknown WebSocket message type: ${message.op}`);
		}
	}

	private handlePlayerUpdate(node: InternalNode, message: LavalinkPlayerUpdateMessage): void {
		const player = this.guildMap.get(message.guildId);
		if (!player) return;

		const state = this.playerStates.get(player);
		if (!state) return;

		// Update player state with WebSocket data
		state.lastPosition = message.state.position;
		// You can add more state updates here based on the WebSocket data
	}

	private handleLavalinkEvent(node: InternalNode, message: LavalinkEventMessage): void {
		const player = this.guildMap.get(message.guildId);
		if (!player) return;

		const state = this.playerStates.get(player);
		if (!state) return;

		switch (message.type) {
			case "TrackStartEvent":
				// Handle track start
				break;
			case "TrackEndEvent":
				// Handle track end
				break;
			case "TrackExceptionEvent":
				// Handle track exception
				break;
			case "TrackStuckEvent":
				// Handle track stuck
				break;
			case "WebSocketClosedEvent":
				// Handle WebSocket closed
				break;
		}
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
		for (const [guildId, player] of this.guildMap) {
			const state = this.playerStates.get(player);
			if (!state?.node?.connected || !state?.node?.wsConnected) continue;

			try {
				await this.updatePlayerState(player, state);
			} catch (error) {
				this.debug(`Failed to update player ${guildId}`, error);
			}
		}
	}

	private async updatePlayerState(player: Player, state: LavalinkPlayerState): Promise<void> {
		if (!state.node || !state.node.wsConnected) return;
		const node = state.node;

		try {
			// Get player info from Lavalink
			const response = await node.rest.get(`/v4/sessions/${node.sessionId}/players/${player.guildId}`);
			const playerInfo = response.data as LavalinkPlayerInfo;

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
				const track = this.resolveTrackFromLavalink(player, playerInfo.track);
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

	private resolveTrackFromLavalink(player: Player, raw: LavalinkRawTrack): Track | null {
		if (!raw) return null;
		const current = player.queue.currentTrack;
		if (current && this.getEncoded(current) === raw.encoded) return current;
		const upcoming = player.queue.getTracks();
		for (const track of [current, ...upcoming]) {
			if (track && this.getEncoded(track) === raw.encoded) return track;
		}
		return {
			id: raw.info.identifier,
			title: raw.info.title,
			url: raw.info.uri ?? raw.info.identifier,
			duration: raw.info.length ?? 0,
			thumbnail: raw.info.artworkUrl ?? undefined,
			requestedBy: current?.requestedBy ?? "Unknown",
			source: raw.info.sourceName ?? "lavalink",
			metadata: {
				...(current?.metadata ?? {}),
				lavalink: {
					encoded: raw.encoded,
					info: raw.info,
					pluginInfo: raw.pluginInfo,
					node: current?.metadata?.lavalink?.node ?? null,
				},
			},
		};
	}

	private readonly handleRawEvent = (packet: any): void => {
		if (!packet || typeof packet !== "object") return;
		const t = packet.t as string | undefined;
		if (!t || (t !== "VOICE_STATE_UPDATE" && t !== "VOICE_SERVER_UPDATE")) return;

		const data: any = packet.d;
		const guildId: string | undefined = data?.guild_id ?? data?.guildId;
		if (!guildId) return;

		const player = this.manager?.get(guildId) ?? this.guildMap.get(guildId);
		if (!player) return;

		const state = this.playerStates.get(player);
		if (!state) return;

		if (t === "VOICE_SERVER_UPDATE") {
			const token: string | undefined = data?.token;
			if (!token) return;
			const endpoint: string | null = typeof data?.endpoint === "string" ? data.endpoint : null;
			const resolvedGuildId = String(data?.guild_id ?? data?.guildId ?? guildId);
			const rawEvent: VoiceServerRawEvent = {
				...(typeof data === "object" && data !== null ? data : {}),
				token,
				endpoint,
				guild_id: resolvedGuildId,
			};
			if ("guildId" in rawEvent) {
				delete rawEvent.guildId;
			}
			state.voiceServer = {
				token,
				endpoint,
				guildId: resolvedGuildId,
				rawEvent,
			};
			this.debug(`VOICE_SERVER_UPDATE for guild ${guildId}`);
		} else if (t === "VOICE_STATE_UPDATE") {
			const userId = data?.user_id ?? data?.userId;
			if (this.userId && userId !== this.userId) return;
			state.voiceState = {
				sessionId: data?.session_id ?? null,
				channelId: data?.channel_id ?? null,
			};
			state.channelId = data?.channel_id ?? null;
			this.debug(`VOICE_STATE_UPDATE for guild ${guildId} (channel ${state.channelId ?? "null"})`);
			if (!state.channelId) {
				state.playing = false;
				state.paused = false;
				state.track = null;
				state.awaitingTrack = false;
				this.destroyLavalinkPlayer(player).catch((error) =>
					this.debug(`Failed to destroy Lavalink player after disconnect for ${guildId}`, error),
				);
			}
		}

		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			this.voiceWaiters.get(guildId)?.resolve();
			this.voiceWaiters.delete(guildId);
			for (const node of this.nodes) {
				if (!node.connected) continue;
				this.sendVoiceUpdate(node, guildId, state).catch((error) =>
					this.debug(`Failed to send voiceUpdate for ${guildId} to ${node.identifier}`, error),
				);
			}
		}
	};

	private debug(message: string, ...optional: any[]): void {
		if (!this.options.debug) return;
		const formatted = `[lavalinkExt] ${message}`;
		if (this.manager?.listenerCount("debug")) {
			this.manager.emit("debug", formatted, ...optional);
		} else if (this.player?.listenerCount("debug")) {
			this.player.emit("debug", formatted, ...optional);
		}
	}

	private attachToPlayer(player: Player): void {
		if (!player) return;
		this.player = this.player ?? player;
		this.guildMap.set(player.guildId, player);

		if (!this.manager) {
			const maybeManager = (player as any).pluginManager?.manager ?? (player as any)?.manager;
			if (maybeManager) this.manager = maybeManager as PlayerManager;
		}

		if (!this.playerStates.has(player)) {
			this.playerStates.set(player, {
				playing: false,
				paused: false,
				volume: player.volume ?? 100,
				skipNext: false,
				awaitingNode: false,
				awaitingTrack: false,
				voiceTimeout: null,
				lastPosition: 0,
				autoPlayChecked: false,
			});
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

		const state = this.playerStates.get(player);
		if (state) {
			this.destroyLavalinkPlayer(player).catch((error) =>
				this.debug(`Failed to destroy Lavalink player during detach for ${player.guildId}`, error),
			);
		}
		if (state?.node) {
			state.node.players.delete(player.guildId);
		}
		if (player.guildId) {
			this.voiceWaiters.get(player.guildId)?.reject(new Error("Player detached"));
			this.voiceWaiters.delete(player.guildId);
		}
		this.playerStates.delete(player);
		this.guildMap.delete(player.guildId);
	}

	async beforePlay(context: ExtensionContext, payload: ExtensionPlayRequest): Promise<ExtensionPlayResponse> {
		const player = context.player;
		this.attachToPlayer(player);
		await this.initializeNodes();

		const requestedBy = payload.requestedBy ?? "Unknown";
		try {
			const { tracks, isPlaylist } = await this.resolvePlayRequest(player, payload.query, requestedBy);
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

			const state = this.playerStates.get(player);
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
			return await this.searchLavalink(payload.query, payload.requestedBy);
		} catch (error) {
			this.debug(`provideSearch error: ${(error as Error).message}`);
			return null;
		}
	}

	private async resolvePlayRequest(
		player: Player,
		query: string | Track,
		requestedBy: string,
	): Promise<{ tracks: Track[]; isPlaylist: boolean }> {
		if (typeof query === "string") {
			const result = await this.searchLavalink(query, requestedBy);
			const mapped = result.tracks.map((track) => ({
				...track,
				requestedBy,
			}));
			return { tracks: mapped, isPlaylist: !!result.playlist };
		}

		if (isTrack(query)) {
			const clone: Track = {
				...query,
				requestedBy: query.requestedBy ?? requestedBy,
				metadata: { ...(query.metadata ?? {}) },
			};
			await this.ensureTrackEncoded(player, clone, requestedBy);
			return { tracks: [clone], isPlaylist: false };
		}

		throw new Error("Invalid play request");
	}

	private getEncoded(track: Track | null | undefined): string | null {
		if (!track) return null;
		const encoded = (track as any)?.metadata?.lavalink?.encoded;
		return typeof encoded === "string" ? encoded : null;
	}

	private async ensureTrackEncoded(player: Player, track: Track, requestedBy: string): Promise<void> {
		if (this.getEncoded(track)) return;
		const node = this.selectNode();
		if (!node) throw new Error("No Lavalink nodes available");
		const identifier = track.url && isUrl(track.url) ? track.url : track.id || track.title;
		if (!identifier) throw new Error("Cannot resolve track identifier for Lavalink");
		const response = await this.loadTracks(node, identifier);
		const raws = Array.isArray(response.data) ? response.data : (response.data as LavalinkPlaylistData | undefined)?.tracks ?? [];
		const raw = raws[0];
		if (!raw) throw new Error("Track not found on Lavalink");
		const mapped = this.mapToTrack(raw, requestedBy);
		track.metadata = mapped.metadata;
	}

	private mapToTrack(raw: LavalinkRawTrack, requestedBy: string): Track {
		const track: Track = {
			id: raw.info.identifier,
			title: raw.info.title,
			url: raw.info.uri ?? raw.info.identifier,
			duration: raw.info.length ?? 0,
			thumbnail: raw.info.artworkUrl ?? undefined,
			requestedBy,
			source: raw.info.sourceName ?? "lavalink",
			metadata: {
				lavalink: {
					encoded: raw.encoded,
					info: raw.info,
					pluginInfo: raw.pluginInfo ?? {},
					node: null,
				},
			},
		};
		return track;
	}

	private async searchLavalink(query: string, requestedBy: string): Promise<SearchResult> {
		const node = this.selectNode();
		if (!node) throw new Error("No Lavalink nodes connected");
		const identifier = isUrl(query) ? query : `${this.options.searchPrefix ?? "ytsearch"}:${query}`;
		const response = await this.loadTracks(node, identifier);

		if (!response) throw new Error("Invalid response from Lavalink");
		switch (response.loadType) {
			case "error": {
				const data = response.data as { message?: string; severity?: string } | null;
				throw new Error(data?.message ?? "Lavalink error");
			}
			case "empty":
				throw new Error("No tracks found");
			case "playlist": {
				const playlist = response.data as LavalinkPlaylistData;
				const tracks = playlist.tracks.map((raw) => this.mapToTrack(raw, requestedBy));
				return {
					tracks,
					playlist: {
						name: playlist.info?.name ?? "Playlist",
						url: playlist.info?.url ?? identifier,
						thumbnail: playlist.info?.artworkUrl ?? undefined,
					},
				};
			}
			case "track": {
				const raw = Array.isArray(response.data) ? (response.data as LavalinkRawTrack[])[0] : null;
				if (!raw) throw new Error("No track data received");
				return { tracks: [this.mapToTrack(raw, requestedBy)] };
			}
			case "search":
			default: {
				const list = Array.isArray(response.data) ? (response.data as LavalinkRawTrack[]) : [];
				const tracks = list.map((raw) => this.mapToTrack(raw, requestedBy));
				return { tracks };
			}
		}
	}

	private selectNode(): InternalNode | null {
		const connected = this.nodes.filter((node) => node.connected && node.wsConnected && node.sessionId);
		if (connected.length === 0) return null;
		const sortBy = this.options.nodeSort ?? "players";
		switch (sortBy) {
			case "cpu":
				connected.sort((a, b) => {
					const aLoad = a.stats?.cpu?.systemLoad ?? Number.POSITIVE_INFINITY;
					const bLoad = b.stats?.cpu?.systemLoad ?? Number.POSITIVE_INFINITY;
					return aLoad - bLoad;
				});
				break;
			case "memory":
				connected.sort((a, b) => {
					const aMem = a.stats?.memory?.used ?? Number.POSITIVE_INFINITY;
					const bMem = b.stats?.memory?.used ?? Number.POSITIVE_INFINITY;
					return aMem - bMem;
				});
				break;
			case "random":
				return connected[Math.floor(Math.random() * connected.length)];
			case "players":
			default:
				connected.sort((a, b) => a.players.size - b.players.size);
		}
		return connected[0] ?? null;
	}

	private async ensureNodeForPlayer(player: Player): Promise<InternalNode> {
		let state = this.playerStates.get(player);
		if (!state) {
			this.attachToPlayer(player);
			state = this.playerStates.get(player);
		}
		if (!state) throw new Error("Missing player state");

		let node = state.node;
		if (!node || !node.connected || !node.wsConnected || !node.sessionId) {
			const picked = this.selectNode();
			if (!picked) throw new Error("No Lavalink nodes available");
			node = picked;
			state.node = node;
			node.players.add(player.guildId);
			this.debug(`Assigned node ${node.identifier} to guild ${player.guildId}`);
		}

		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			await this.sendVoiceUpdate(node, player.guildId, state);
		}

		return node;
	}

	private async loadTracks(node: InternalNode, identifier: string): Promise<LavalinkLoadResponse> {
		this.debug(`Loading tracks from node ${node.identifier} identifier=${identifier}`);
		const res = await node.rest.get<LavalinkLoadResponse>(`/v4/loadtracks`, { params: { identifier } }).catch((error) => {
			this.debug(`loadTracks request failed for ${node.identifier} id=${identifier}`, error);
			throw error;
		});
		this.debug(`loadTracks response for ${node.identifier} id=${identifier} loadType=${res.data?.loadType}`);
		return res.data;
	}

	private async waitForVoice(player: Player): Promise<void> {
		const state = this.playerStates.get(player);
		if (!state) return;
		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) return;
		const guildId = player.guildId;
		if (this.voiceWaiters.has(guildId)) {
			return new Promise((resolve, reject) => {
				const existing = this.voiceWaiters.get(guildId)!;
				const originalResolve = existing.resolve;
				const originalReject = existing.reject;
				existing.resolve = () => {
					originalResolve();
					resolve();
				};
				existing.reject = (error: Error) => {
					originalReject(error);
					reject(error);
				};
			});
		}

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.voiceWaiters.delete(guildId);
				reject(new Error("Voice connection timed out"));
			}, this.options.requestTimeoutMs ?? 15_000);
			this.voiceWaiters.set(guildId, {
				resolve: () => {
					clearTimeout(timer);
					this.voiceWaiters.delete(guildId);
					resolve();
				},
				reject: (error: Error) => {
					clearTimeout(timer);
					this.voiceWaiters.delete(guildId);
					reject(error);
				},
				timer,
			});
		});
	}

	private async connect(player: Player, channel: any): Promise<any> {
		const original = this.originalMethods.get(player)?.connect;
		const channelId: string | null = channel?.id ?? channel ?? null;
		if (!channelId) throw new Error("Invalid channel provided to connect");
		const guildId = player.guildId;
		const state = this.playerStates.get(player);
		if (state) {
			state.channelId = channelId;
		}

		if (this.options.sendGatewayPayload) {
			await this.options.sendGatewayPayload(guildId, {
				op: 4,
				d: {
					guild_id: guildId,
					channel_id: channelId,
					self_deaf: player.options.selfDeaf ?? true,
					self_mute: player.options.selfMute ?? false,
				},
			});
			await this.waitForVoice(player);
			return null;
		}

		if (!original) throw new Error("Player connect method missing");
		const connection = await original(channel);
		await this.waitForVoice(player).catch((error) => this.debug(`Voice wait failed: ${error.message}`));
		return connection;
	}

	private async startNextOnLavalink(player: Player, ignoreLoop = false): Promise<boolean> {
		const node = await this.ensureNodeForPlayer(player);
		const state = this.playerStates.get(player);
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
			await this.waitForVoice(player);
		} catch (error) {
			this.debug(`Voice readiness failed for ${player.guildId}`, error);
		}

		try {
			await this.ensureTrackEncoded(player, track, track.requestedBy ?? "Unknown");
			const encoded = this.getEncoded(track);
			if (!encoded) throw new Error("Track has no Lavalink payload");
			track.metadata = {
				...(track.metadata ?? {}),
				lavalink: {
					...((track.metadata ?? {}).lavalink ?? {}),
					encoded,
					node: node.identifier,
				},
			};
			state.node = node;
			node.players.add(player.guildId);
			state.track = track;
			state.playing = true;
			state.paused = false;
			player.isPlaying = true;
			player.isPaused = false;
			await this.updatePlayer(node, player.guildId, {
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

	private async updatePlayer(node: InternalNode, guildId: string, payload: Record<string, any>): Promise<void> {
		await node.rest.patch(`/v4/sessions/${node.sessionId}/players/${guildId}`, payload).catch((error) => {
			throw error;
		});
	}

	private async destroyLavalinkPlayer(player: Player): Promise<void> {
		const state = this.playerStates.get(player);
		if (!state?.node) return;
		try {
			await state.node.rest.delete(`/v4/sessions/${state.node.sessionId}/players/${player.guildId}`);
		} catch (error) {
			this.debug(`Failed to destroy Lavalink player for ${player.guildId}`, error);
		}
		state.node.players.delete(player.guildId);
		state.track = null;
		state.playing = false;
		state.paused = false;
	}

	private async sendVoiceUpdate(node: InternalNode, guildId: string, state: LavalinkPlayerState): Promise<void> {
		if (!state.voiceState?.sessionId || !state.voiceServer) return;

		const payload = {
			voice: {
				token: state.voiceServer.token,
				endpoint: state.voiceServer.endpoint,
				sessionId: state.voiceState.sessionId,
			},
		};
		await node.rest.patch(`/v4/sessions/${node.sessionId}/players/${guildId}`, payload);
	}

	private pause(player: Player): boolean {
		const state = this.playerStates.get(player);
		if (!state?.node || !state.playing || state.paused) return false;
		state.paused = true;
		player.isPaused = true;
		const track = state.track ?? player.queue.currentTrack ?? undefined;
		if (track) player.emit("playerPause", track);
		this.updatePlayer(state.node, player.guildId, { paused: true }).catch((error) => this.debug(`Pause failed`, error));
		return true;
	}

	private resume(player: Player): boolean {
		const state = this.playerStates.get(player);
		if (!state?.node || !state.paused) return false;
		state.paused = false;
		player.isPaused = false;
		const track = state.track ?? player.queue.currentTrack ?? undefined;
		if (track) player.emit("playerResume", track);
		this.updatePlayer(state.node, player.guildId, { paused: false }).catch((error) => this.debug(`Resume failed`, error));
		return true;
	}

	private stop(player: Player): boolean {
		const state = this.playerStates.get(player);
		if (!state?.node) return false;
		player.queue.clear();
		state.track = null;
		state.playing = false;
		state.paused = false;
		player.isPlaying = false;
		player.isPaused = false;
		player.emit("playerStop");
		this.updatePlayer(state.node, player.guildId, { track: null }).catch((error) => this.debug(`Stop failed`, error));
		return true;
	}

	private skip(player: Player): boolean {
		const state = this.playerStates.get(player);
		if (!state?.node) return false;
		state.skipNext = true;
		this.updatePlayer(state.node, player.guildId, { track: null }).catch((error) => this.debug(`Skip failed`, error));
		return true;
	}

	private setVolume(player: Player, volume: number): boolean {
		if (volume < 0 || volume > 200) return false;
		const state = this.playerStates.get(player);
		if (!state?.node) {
			const original = this.originalMethods.get(player)?.setVolume;
			return original ? original(volume) : false;
		}
		const old = player.volume ?? 100;
		player.volume = volume;
		state.volume = volume;
		player.emit("volumeChange", old, volume);
		this.updatePlayer(state.node, player.guildId, { volume }).catch((error) => this.debug(`Failed to set volume`, error));
		return true;
	}
}
