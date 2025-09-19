import axios, { AxiosInstance } from "axios";
import WebSocket from "ws";
import { BaseExtension, Player, PlayerManager, Track, SearchResult, StreamInfo } from "ziplayer";
import { Readable } from "stream";
import type {
	ExtensionContext,
	ExtensionPlayRequest,
	ExtensionPlayResponse,
	ExtensionAfterPlayPayload,
	ExtensionSearchRequest,
	ExtensionStreamRequest,
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
}

interface LavalinkReadyPayload {
	op: "ready";
	sessionId: string;
	resumed: boolean;
}

interface LavalinkPlayerStatePayload {
	op: "playerUpdate";
	guildId: string;
	state: {
		time: number;
		position: number;
		connected: boolean;
		ping: number;
	};
}

type LavalinkEventPayload =
	| {
			op: "event";
			type: "TrackStartEvent";
			guildId: string;
			track: LavalinkRawTrack;
	  }
	| {
			op: "event";
			type: "TrackEndEvent";
			guildId: string;
			track: LavalinkRawTrack;
			reason: string;
	  }
	| {
			op: "event";
			type: "TrackExceptionEvent";
			guildId: string;
			track: LavalinkRawTrack;
			exception: { message: string; severity: string; cause?: string };
	  }
	| {
			op: "event";
			type: "TrackStuckEvent";
			guildId: string;
			track: LavalinkRawTrack;
			thresholdMs: number;
	  }
	| {
			op: "event";
			type: "WebSocketClosedEvent";
			guildId: string;
			code: number;
			reason: string;
			byRemote: boolean;
	  };

type LavalinkSocketMessage =
	| LavalinkReadyPayload
	| LavalinkPlayerStatePayload
	| LavalinkEventPayload
	| { op: "stats"; stats: LavalinkStats }
	| { op: string; [key: string]: any };

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
	shardCount?: number;
	resumeKey?: string;
	resumeTimeout?: number;
	searchPrefix?: string;
	nodeSort?: "players" | "cpu" | "memory" | "random";
	requestTimeoutMs?: number;
	reconnectDelayMs?: number;
	connectTimeoutMs?: number;
	clientName?: string;
}

interface InternalNode extends LavalinkNodeOptions {
	identifier: string;
	rest: AxiosInstance;
	ws?: WebSocket;
	connected: boolean;
	connecting: boolean;
	reconnectAttempts: number;
	stats?: LavalinkStats;
	sessionId?: string;
	players: Set<string>;
	resumed?: boolean;
	lastPing?: number;
	closing?: boolean;
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
}

interface VoiceWaiter {
	resolve: () => void;
	reject: (error: Error) => void;
	timer: NodeJS.Timeout;
}

const isTrack = (value: any): value is Track => value && typeof value === "object" && typeof value.title === "string";

const isUrl = (value: string): boolean => /^(https?:\/\/|wss?:\/\/)/i.test(value);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
	private wsReady = false;

	constructor(player: Player | null = null, opts: LavalinkExtOptions) {
		super();
		if (!opts || !Array.isArray(opts.nodes) || opts.nodes.length === 0) {
			throw new Error("lavalinkExt requires at least one Lavalink node configuration");
		}
		this.player = player;
		this.options = {
			searchPrefix: "ytsearch",
			nodeSort: "players",
			requestTimeoutMs: 10_000,
			reconnectDelayMs: 5_000,
			connectTimeoutMs: 15_000,
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
	}

	active(alas: any): boolean {
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
		this.maybeConnectNodes();
		return true;
	}

	onRegister(context: ExtensionContext): void {
		this.attachToPlayer(context.player);
	}

	onDestroy(context: ExtensionContext): void {
		this.detachFromPlayer(context.player);
	}

	private createNode(config: LavalinkNodeOptions): InternalNode {
		const secure = config.secure ?? true;
		const port = config.port ?? (secure ? 443 : 2333);
		const identifier = config.identifier ?? `${config.host}:${port}`;
		const protocol = secure ? "https" : "http";
		const baseURL = `${protocol}://${config.host}:${port}/v4`;
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
			connecting: false,
			reconnectAttempts: 0,
			// track when node was created for debug
			lastPing: undefined,
			players: new Set<string>(),
		};
	}

	private bindClient(client: Client): void {
		if (this.client && this.client !== client) return;
		this.client = client;
		if (!this.userId && client.user?.id) {
			this.userId = client.user.id;
		}

		// Add debug handler for all raw events to see what we're receiving
		client.on("raw", (packet: any) => {
			if (packet?.t === "VOICE_STATE_UPDATE" || packet?.t === "VOICE_SERVER_UPDATE") {
				this.debug(`Raw event received: ${packet.t}`, packet.d);
			}
			this.handleRawEvent(packet);
		});

		if (!client.listenerCount("ready")) {
			client.once("ready", () => {
				if (!this.userId && client.user?.id) {
					this.userId = client.user.id;
				}
				this.maybeConnectNodes();
			});
		}
	}

	private maybeConnectNodes(): void {
		if (!this.userId && !this.client?.user?.id) return;
		if (!this.userId && this.client?.user?.id) {
			this.userId = this.client.user.id;
		}
		if (!this.userId) return;

		if (!this.wsReady) {
			this.wsReady = true;
		}

		for (const node of this.nodes) {
			if (node.connected || node.connecting || node.closing) continue;
			this.connectNode(node).catch((error) => this.debug(`Failed to connect node ${node.identifier}`, error));
		}
	}

	private async connectNode(node: InternalNode): Promise<void> {
		if (node.connecting || node.connected || node.closing) return;
		node.connecting = true;
		const secure = node.secure ?? true;
		const port = node.port ?? (secure ? 443 : 2333);
		const protocol = secure ? "wss" : "ws";
		const url = `${protocol}://${node.host}:${port}/v4/websocket`;
		const headers: Record<string, string> = {
			Authorization: node.password,
			"Client-Name": this.options.clientName ?? `ziplayer-extension/${this.version}`,
		};
		if (this.userId) headers["User-Id"] = this.userId;
		if (node.sessionId) headers["Session-Id"] = node.sessionId;
		const ws = new WebSocket(url, { headers });
		node.ws = ws;

		ws.on("open", () => {
			node.connecting = false;
			node.connected = true;
			node.reconnectAttempts = 0;
			this.debug(`Node ${node.identifier} websocket connected`);
			// request stats shortly after connect to populate sorting info
			this.debug(`Requesting initial stats for node ${node.identifier}`);
			node.rest
				.get(`/stats`)
				.then((r) => {
					node.stats = (r.data as any) ?? node.stats;
					this.debug(`Node ${node.identifier} initial stats loaded`, node.stats);
				})
				.catch((err) => this.debug(`Failed to load initial stats for ${node.identifier}`, err));
		});

		ws.on("message", (data: WebSocket.RawData) => {
			this.debug(`Node ${node.identifier} WS message received: ${String(data).slice(0, 200)}`);
			try {
				const message = JSON.parse(String(data)) as LavalinkSocketMessage;
				this.handleWebSocketMessage(node, message);
			} catch (error) {
				this.debug(`Failed to parse WebSocket message from ${node.identifier}:`, error);
			}
		});

		ws.on("error", (error) => {
			this.debug(`Node ${node.identifier} websocket error`, error);
			// attempt to surface more info when WS errors happen
			try {
				this.debug(`Node ${node.identifier} ws readyState=${node.ws?.readyState}`);
			} catch (e) {
				/* ignore */
			}
		});

		ws.on("close", async () => {
			this.debug(`Node ${node.identifier} websocket closed`);
			this.debug(`Node ${node.identifier} closing state: closing=${node.closing} reconnectAttempts=${node.reconnectAttempts}`);
			node.connected = false;
			node.connecting = false;
			node.ws = undefined;
			if (node.closing) return;
			const attempt = (node.reconnectAttempts += 1);
			const delay = Math.min(30_000, attempt * (this.options.reconnectDelayMs ?? 5_000));
			await wait(delay);
			this.connectNode(node).catch((error) => this.debug(`Reconnect failed for node ${node.identifier}`, error));
		});
	}

	private handleWebSocketMessage(node: InternalNode, message: LavalinkSocketMessage): void {
		switch (message.op) {
			case "ready":
				this.handleNodeReady(node, message as LavalinkReadyPayload);
				break;
			case "stats":
				node.stats = (message as any).stats;
				break;
			case "playerUpdate":
				// Handle player state updates if needed
				break;
			case "event":
				// Handle track events if needed
				break;
			default:
				this.debug(`Unknown WebSocket message op: ${message.op}`);
		}
	}

	private handleNodeReady(node: InternalNode, payload: LavalinkReadyPayload): void {
		node.connected = true;
		node.connecting = false;
		this.debug(`Node ${node.identifier} ready payload(session=${payload.sessionId}) resumed=${payload.resumed}`);
		this.configureAfterReady(node, payload)
			.then(() => this.debug(`Node ${node.identifier} configured after ready`))
			.catch((error) => this.debug(`Failed to configure node ${node.identifier} after ready`, error));
		// update lastPing to note ready time
		node.lastPing = Date.now();
	}

	// Lavalink v4 doesn't support WebSocket player updates
	// Player state is managed through REST API calls

	private async forceReconnectVoice(player: Player, node: InternalNode): Promise<void> {
		const state = this.playerStates.get(player);
		if (!state || !state.voiceState?.sessionId || !state.voiceServer?.token || !state.voiceServer?.endpoint) {
			return;
		}

		this.debug(`Force reconnecting voice for ${player.guildId}`);

		// Send multiple voice updates with delays
		for (let i = 0; i < 3; i++) {
			await this.sendVoiceUpdate(node, player.guildId, state);
			await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)));
		}
	}

	private async ensurePlayerExists(node: InternalNode, guildId: string): Promise<void> {
		if (!node.sessionId) throw new Error("Node session not ready");

		try {
			// Try to get player info first
			await node.rest.get(`/sessions/${node.sessionId}/players/${guildId}`);
			this.debug(`Player already exists for guild ${guildId} on node ${node.identifier}`);
		} catch (error) {
			// Player doesn't exist, create it with proper voice state
			const player = this.manager?.get(guildId) ?? this.guildMap.get(guildId);
			const state = player ? this.playerStates.get(player) : null;

			if (!state || !state.voiceState?.sessionId || !state.voiceServer?.token || !state.voiceServer?.endpoint) {
				this.debug(`Cannot create player for guild ${guildId} - voice state not ready`);
				throw new Error("Voice state not ready for player creation");
			}

			this.debug(`Creating player for guild ${guildId} on node ${node.identifier}`);

			// Ensure endpoint has proper protocol
			let endpoint = state.voiceServer.endpoint;
			if (endpoint && !endpoint.startsWith("wss://") && !endpoint.startsWith("ws://")) {
				endpoint = `wss://${endpoint}`;
			}

			await node.rest.patch(`/sessions/${node.sessionId}/players/${guildId}`, {
				volume: 100,
				voice: {
					token: state.voiceServer.token,
					endpoint: endpoint,
					sessionId: state.voiceState.sessionId,
				},
			});
		}
	}

	private async waitForVoiceConnection(node: InternalNode, guildId: string, timeoutMs: number): Promise<void> {
		const startTime = Date.now();
		this.debug(`Waiting for voice connection for guild ${guildId}`);

		while (Date.now() - startTime < timeoutMs) {
			// Send voice update
			const player = this.manager?.get(guildId) ?? this.guildMap.get(guildId);
			if (player) {
				const state = this.playerStates.get(player);
				if (state && state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
					await this.sendVoiceUpdate(node, guildId, state);
				}
			}

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 200));
		}

		this.debug(`Voice connection wait completed for guild ${guildId}`);
	}

	// Lavalink v4 doesn't support WebSocket events
	// Track events are handled through polling or other mechanisms

	private resolveTrackFromEvent(player: Player, raw: LavalinkRawTrack): Track | null {
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

		// Debug all voice-related events
		if (t === "VOICE_STATE_UPDATE" || t === "VOICE_SERVER_UPDATE") {
			this.debug(`Received ${t} event:`, packet.d);
		}

		if (!t || (t !== "VOICE_STATE_UPDATE" && t !== "VOICE_SERVER_UPDATE")) return;

		const data: any = packet.d;
		const guildId: string | undefined = data?.guild_id ?? data?.guildId;
		if (!guildId) {
			this.debug(`No guildId found in ${t} event`);
			return;
		}

		const player = this.manager?.get(guildId) ?? this.guildMap.get(guildId);
		if (!player) {
			this.debug(`No player found for guild ${guildId} in ${t} event`);
			return;
		}

		const state = this.playerStates.get(player);
		if (!state) {
			this.debug(`No state found for player ${guildId} in ${t} event`);
			return;
		}

		if (t === "VOICE_SERVER_UPDATE") {
			const token: string | undefined = data?.token;
			if (!token) {
				this.debug(`No token found in VOICE_SERVER_UPDATE for guild ${guildId}`);
				return;
			}
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
			this.debug(`VOICE_SERVER_UPDATE for guild ${guildId} - token: ${token.substring(0, 10)}..., endpoint: ${endpoint}`);
		} else if (t === "VOICE_STATE_UPDATE") {
			const userId = data?.user_id ?? data?.userId;
			if (this.userId && userId !== this.userId) {
				this.debug(`VOICE_STATE_UPDATE for different user ${userId} (expected ${this.userId})`);
				return;
			}
			state.voiceState = {
				sessionId: data?.session_id ?? null,
				channelId: data?.channel_id ?? null,
			};
			state.channelId = data?.channel_id ?? null;
			this.debug(
				`VOICE_STATE_UPDATE for guild ${guildId} - sessionId: ${state.voiceState.sessionId}, channelId: ${state.channelId}`,
			);
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

		// Send voice update when both voice state and server are available
		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			this.debug(`Voice state complete for guild ${guildId} - sending voice updates immediately`);
			this.voiceWaiters.get(guildId)?.resolve();
			this.voiceWaiters.delete(guildId);

			// Send voice update immediately to all connected nodes
			for (const node of this.nodes) {
				if (!node.connected || !node.ws || node.ws.readyState !== WebSocket.OPEN || !node.sessionId) continue;
				// Send voice update directly without creating player first
				this.sendVoiceUpdate(node, guildId, state).catch((error) =>
					this.debug(`Failed to send voiceUpdate for ${guildId} to ${node.identifier}`, error),
				);
			}

			// Also send to the player's assigned node if different
			const playerNode = state.node;
			if (
				playerNode &&
				playerNode.connected &&
				playerNode.ws &&
				playerNode.ws.readyState === WebSocket.OPEN &&
				playerNode.sessionId
			) {
				this.sendVoiceUpdate(playerNode, guildId, state).catch((error) =>
					this.debug(`Failed to send voiceUpdate for ${guildId} to assigned node ${playerNode.identifier}`, error),
				);
			}
		} else {
			this.debug(
				`Voice state incomplete for guild ${guildId} - sessionId: ${!!state.voiceState?.sessionId}, token: ${!!state.voiceServer
					?.token}, endpoint: ${!!state.voiceServer?.endpoint}`,
			);
		}
	};

	private tryExtractVoiceStateFromPlayer(player: Player): void {
		const state = this.playerStates.get(player);
		if (!state) return;

		// Try to get voice state from Player's connection
		const connection = (player as any)?.connection;
		if (connection) {
			this.debug(`Player connection found for ${player.guildId}, trying to extract voice state`);

			// Try to get session ID from connection
			const sessionId = connection?.joinConfig?.sessionId || connection?.sessionId;
			if (sessionId) {
				state.voiceState = {
					sessionId,
					channelId: connection?.joinConfig?.channelId || connection?.channelId,
				};
				state.channelId = connection?.joinConfig?.channelId || connection?.channelId;
				this.debug(`Extracted sessionId from Player connection: ${sessionId}`);
			}

			// Try to get voice server info from connection
			const voiceServer = connection?._state?.voiceServer || connection?.voiceServer;
			if (voiceServer && voiceServer.token && voiceServer.endpoint) {
				state.voiceServer = {
					token: voiceServer.token,
					endpoint: voiceServer.endpoint,
					guildId: player.guildId,
					rawEvent: voiceServer,
				};
				this.debug(`Extracted voice server info from Player connection: ${voiceServer.endpoint}`);
			}

			// If we have both, send voice updates
			if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
				this.debug(`Voice state extracted from Player connection for ${player.guildId}`);
				this.sendVoiceUpdatesToNodes(player);
			}
		} else {
			this.debug(`No Player connection found for ${player.guildId}`);
		}
	}

	private sendVoiceUpdatesToNodes(player: Player, retryCount = 0): void {
		const state = this.playerStates.get(player);
		if (!state || !state.voiceState?.sessionId || !state.voiceServer?.token || !state.voiceServer?.endpoint) {
			return;
		}

		// Send voice update to all connected nodes
		for (const node of this.nodes) {
			if (!node.connected || !node.ws || node.ws.readyState !== WebSocket.OPEN || !node.sessionId) continue;
			this.sendVoiceUpdate(node, player.guildId, state).catch((error) =>
				this.debug(`Failed to send voiceUpdate for ${player.guildId} to ${node.identifier}`, error),
			);
		}

		// Resolve any waiting voice waiters
		this.voiceWaiters.get(player.guildId)?.resolve();
		this.voiceWaiters.delete(player.guildId);

		// Retry voice updates if connection is still not established after a delay
		if (retryCount < 3) {
			setTimeout(() => {
				this.debug(`Retrying voice update for ${player.guildId} (attempt ${retryCount + 1})`);
				this.sendVoiceUpdatesToNodes(player, retryCount + 1);
			}, 1000 * (retryCount + 1)); // Increasing delay: 1s, 2s, 3s
		}
	}

	private debug(message: string, ...optional: any[]): void {
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

			(player as any).skip = () => {
				const handled = this.skip(player);
				if (handled) return true;
				const original = this.originalMethods.get(player)?.skip;
				return original ? original() : handled;
			};
			(player as any).stop = () => {
				const handled = this.stop(player);
				if (handled) return true;
				const original = this.originalMethods.get(player)?.stop;
				return original ? original() : handled;
			};
			(player as any).pause = () => {
				const handled = this.pause(player);
				if (handled) return true;
				const original = this.originalMethods.get(player)?.pause;
				return original ? original() : handled;
			};
			(player as any).resume = () => {
				const handled = this.resume(player);
				if (handled) return true;
				const original = this.originalMethods.get(player)?.resume;
				return original ? original() : handled;
			};
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
		this.maybeConnectNodes();

		const requestedBy = payload.requestedBy ?? "Unknown";
		let queued = false;

		try {
			const { tracks, isPlaylist } = await this.resolvePlayRequest(player, payload.query, requestedBy);
			if (tracks.length === 0) {
				this.cleanupIdleNodes();
				return {
					handled: false,
					success: false,
					error: new Error("No tracks found"),
				};
			}

			// Ensure all tracks have proper Lavalink metadata
			for (const track of tracks) {
				if (!track.metadata?.lavalink?.encoded) {
					await this.ensureTrackEncoded(player, track, requestedBy);
				}
			}

			if (isPlaylist) {
				player.queue.addMultiple(tracks);
				player.emit("queueAddList", tracks);
			} else {
				player.queue.add(tracks[0]);
				player.emit("queueAdd", tracks[0]);
			}
			queued = true;

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
			if (!queued) {
				this.cleanupIdleNodes();
			}
			return {
				handled: true,
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

	async provideStream(_context: ExtensionContext, payload: ExtensionStreamRequest): Promise<StreamInfo | null> {
		try {
			const track = payload.track;
			// Check if this track has Lavalink metadata
			const lavalinkData = track.metadata?.lavalink;
			if (!lavalinkData?.encoded) {
				this.debug(`Track ${track.title} has no Lavalink encoded data`);
				return null;
			}

			// Ensure we have a node for this track
			const node = await this.ensureNodeForPlayer(_context.player);
			if (!node) {
				this.debug(`No node available for track ${track.title}`);
				return null;
			}

			// Create a dummy stream that represents the Lavalink connection
			// The actual audio is handled by Lavalink directly
			const lavalinkStream = new Readable({
				read() {
					// This stream is just a placeholder - Lavalink handles the actual audio
					// We don't need to push any data here
				},
			});

			// Mark the stream as ended since Lavalink handles everything
			lavalinkStream.push(null);

			return {
				stream: lavalinkStream,
				type: "arbitrary",
				metadata: {
					lavalink: {
						encoded: lavalinkData.encoded,
						node: node.identifier,
						guildId: _context.player.guildId,
					},
				},
			};
		} catch (error) {
			this.debug(`provideStream error for track ${payload.track.title}: ${(error as Error).message}`);
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
		const connected = this.nodes.filter((node) => node.connected && node.ws && node.ws.readyState === WebSocket.OPEN);
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
		if (!node || !node.connected || !node.ws || node.ws.readyState !== WebSocket.OPEN) {
			const picked = this.selectNode();
			if (!picked) throw new Error("No Lavalink nodes available");
			node = picked;
			state.node = node;
			this.debug(`Assigned node ${node.identifier} to guild ${player.guildId}`);
		}

		if (!node.sessionId) {
			await this.waitForNodeReady(node);
		}

		// Send voice update if voice state is available
		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			try {
				await this.sendVoiceUpdate(node, player.guildId, state);
			} catch (error) {
				this.debug(`Failed to send initial voice update to ${node.identifier} for ${player.guildId}`, error);
			}
		} else {
			this.debug(`Voice state not ready for ${player.guildId} - will wait for voice connection`);
		}

		return node;
	}

	private async loadTracks(node: InternalNode, identifier: string): Promise<LavalinkLoadResponse> {
		this.debug(`Loading tracks from node ${node.identifier} identifier=${identifier}`);
		const res = await node.rest.get<LavalinkLoadResponse>(`/loadtracks`, { params: { identifier } }).catch((error) => {
			this.debug(`loadTracks request failed for ${node.identifier} id=${identifier}`, error);
			throw error;
		});
		this.debug(`loadTracks response for ${node.identifier} id=${identifier} loadType=${res.data?.loadType}`);
		return res.data;
	}

	private async waitForNodeReady(node: InternalNode): Promise<void> {
		const timeout = this.options.connectTimeoutMs ?? 15_000;
		const start = Date.now();
		while (!node.sessionId) {
			if (Date.now() - start >= timeout) {
				throw new Error(`Node ${node.identifier} session not ready`);
			}
			await wait(200);
		}
		// Additional wait to ensure WebSocket is fully ready
		await wait(500);
	}

	private async waitForVoice(player: Player): Promise<void> {
		const state = this.playerStates.get(player);
		if (!state) return;

		// Check if voice state is already ready
		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			this.debug(`Voice state already ready for ${player.guildId}`);
			return;
		}

		const guildId = player.guildId;
		if (this.voiceWaiters.has(guildId)) {
			this.debug(`Voice waiter already exists for ${guildId}, waiting for existing promise`);
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

		this.debug(`Waiting for voice connection for ${guildId}`);
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.voiceWaiters.delete(guildId);
				this.debug(`Voice connection timeout for ${guildId}`);
				reject(new Error("Voice connection timed out"));
			}, this.options.connectTimeoutMs ?? 15_000);
			this.voiceWaiters.set(guildId, {
				resolve: () => {
					clearTimeout(timer);
					this.voiceWaiters.delete(guildId);
					this.debug(`Voice connection established for ${guildId}`);
					resolve();
				},
				reject: (error: Error) => {
					clearTimeout(timer);
					this.voiceWaiters.delete(guildId);
					this.debug(`Voice connection failed for ${guildId}: ${error.message}`);
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
			await this.destroyLavalinkPlayer(player);
			return false;
		}

		const node = await this.ensureNodeForPlayer(player);

		(player as any).clearLeaveTimeout?.();
		await (player as any).generateWillNext?.();

		// Try to get voice state from Player connection if not available
		if (!state.voiceState?.sessionId || !state.voiceServer?.token || !state.voiceServer?.endpoint) {
			this.debug(`Voice state not available, trying to extract from Player connection for ${player.guildId}`);
			this.tryExtractVoiceStateFromPlayer(player);
		}

		// Ensure voice connection is established before proceeding
		try {
			await this.waitForVoice(player);
		} catch (error) {
			this.debug(`Voice readiness failed for ${player.guildId}`, error);
			// Don't proceed if voice connection failed
			player.emit("playerError", error instanceof Error ? error : new Error(String(error)), track);
			return false;
		}

		// Verify voice state is properly established
		if (!state.voiceState?.sessionId || !state.voiceServer?.token || !state.voiceServer?.endpoint) {
			this.debug(
				`Voice state not ready for ${player.guildId} - sessionId: ${!!state.voiceState?.sessionId}, token: ${!!state.voiceServer
					?.token}, endpoint: ${!!state.voiceServer?.endpoint}`,
			);
			player.emit("playerError", new Error("Voice connection not established"), track);
			return false;
		}

		// Send voice update to ensure connection is active BEFORE starting track
		await this.sendVoiceUpdate(node, player.guildId, state);

		// Wait a bit for voice connection to establish and verify it
		await this.waitForVoiceConnection(node, player.guildId, 2000);

		// Create player only after voice connection is established
		await this.ensurePlayerExists(node, player.guildId);

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

			// Send another voice update right before starting the track
			await this.sendVoiceUpdate(node, player.guildId, state);

			await this.updatePlayer(node, player.guildId, {
				encodedTrack: encoded,
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
		if (!node.sessionId) throw new Error("Node session not ready");
		await node.rest.patch(`/sessions/${node.sessionId}/players/${guildId}`, payload).catch((error) => {
			throw error;
		});
	}

	private async destroyLavalinkPlayer(player: Player): Promise<void> {
		const state = this.playerStates.get(player);
		const node = state?.node;
		if (!state || !node) {
			this.cleanupIdleNodes();
			return;
		}
		if (node.sessionId) {
			try {
				await node.rest.delete(`/sessions/${node.sessionId}/players/${player.guildId}`);
			} catch (error: any) {
				this.debug(`Failed to destroy Lavalink player for ${player.guildId}`, error?.message || error?.code);
			}
		}
		node.players.delete(player.guildId);
		if (state.node === node) {
			state.node = undefined;
		}
		state.track = null;
		state.playing = false;
		state.paused = false;
		this.cleanupIdleNodes();
	}

	private cleanupIdleNodes(): void {
		let hasActiveState = false;
		for (const player of this.guildMap.values()) {
			const state = this.playerStates.get(player);
			if (
				state?.awaitingNode ||
				state?.awaitingTrack ||
				state?.playing ||
				state?.paused ||
				(state?.node && state.node.players.size > 0)
			) {
				hasActiveState = true;
				break;
			}
		}
		if (hasActiveState) {
			return;
		}

		for (const node of this.nodes) {
			if (node.players.size > 0) {
				return;
			}
		}

		// Only close nodes that have been idle for a longer period
		// and only close one node at a time to maintain connectivity
		const now = Date.now();
		for (const node of this.nodes) {
			if (!node.ws || node.closing) continue;
			const ready = node.ws.readyState;
			if (ready === WebSocket.CLOSING || ready === WebSocket.CLOSED) continue;

			// Only close if the node has been idle for more than 5 minutes
			const lastPing = node.lastPing || 0;
			if (now - lastPing > 5 * 60 * 1000) {
				this.debug(`Closing idle node ${node.identifier} (idle for ${Math.round((now - lastPing) / 1000)}s)`);
				this.closeNode(node, 1000, "Idle cleanup");
				break; // Only close one node at a time
			}
		}
	}

	private closeNode(node: InternalNode, code = 1000, reason?: string): void {
		if (!node.ws) return;
		const ready = node.ws.readyState;
		if (ready === WebSocket.CLOSING || ready === WebSocket.CLOSED) return;

		node.closing = true;
		const ws = node.ws;
		const handleClose = () => {
			node.closing = false;
			node.connected = false;
			node.connecting = false;
			node.ws = undefined;
			node.sessionId = undefined;
			node.resumed = false;
			node.stats = undefined;
			node.lastPing = undefined;
			node.players.clear();
			node.reconnectAttempts = 0;
		};
		ws.once("close", handleClose);

		try {
			ws.close(code, reason ?? "Idle");
		} catch (error) {
			ws.removeListener("close", handleClose);
			handleClose();
			this.debug(`Failed to close node ${node.identifier}`, error);
		}
	}

	private async sendVoiceUpdate(node: InternalNode, guildId: string, state: LavalinkPlayerState): Promise<void> {
		if (!node.sessionId) {
			this.debug(`Cannot send voice update to ${node.identifier} - session not ready`);
			return;
		}
		if (!state.voiceState?.sessionId || !state.voiceServer) {
			this.debug(
				`Cannot send voice update for ${guildId} - missing voice state (sessionId: ${!!state.voiceState
					?.sessionId}, voiceServer: ${!!state.voiceServer})`,
			);
			return;
		}

		// Ensure endpoint has proper protocol
		let endpoint = state.voiceServer.endpoint;
		if (endpoint && !endpoint.startsWith("wss://") && !endpoint.startsWith("ws://")) {
			endpoint = `wss://${endpoint}`;
		}

		// Use REST API for voice updates in Lavalink v4
		const voicePayload = {
			token: state.voiceServer.token,
			endpoint: endpoint,
			sessionId: state.voiceState.sessionId,
		};

		try {
			await node.rest.patch(`/sessions/${node.sessionId}/players/${guildId}`, {
				voice: voicePayload,
			});
			this.debug(
				`Sent voice update to ${node.identifier} for guild ${guildId} - sessionId: ${state.voiceState.sessionId}, endpoint: ${endpoint}`,
			);
		} catch (error) {
			this.debug(`Failed to send voice update to ${node.identifier} for guild ${guildId}`, error);
			throw error;
		}
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
		this.updatePlayer(state.node, player.guildId, { encodedTrack: null }).catch((error) => this.debug(`Stop failed`, error));
		this.destroyLavalinkPlayer(player).catch((error) =>
			this.debug(`Failed to destroy Lavalink player after stop for ${player.guildId}`, error),
		);
		return true;
	}

	private skip(player: Player): boolean {
		const state = this.playerStates.get(player);
		if (!state?.node) return false;
		state.skipNext = true;
		this.updatePlayer(state.node, player.guildId, { encodedTrack: null }).catch((error) => this.debug(`Skip failed`, error));
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

	private async resumeOnNode(node: InternalNode): Promise<void> {
		if (!node.sessionId) return;
		if (!this.options.resumeKey) return;
		try {
			await node.rest.patch(`/sessions/${node.sessionId}`, {
				resumeKey: this.options.resumeKey,
				timeout: this.options.resumeTimeout ?? 60,
			});
		} catch (error) {
			this.debug(`Failed to configure resume key for ${node.identifier}`, error);
		}
	}

	private async configureAfterReady(node: InternalNode, payload: LavalinkReadyPayload): Promise<void> {
		node.sessionId = payload.sessionId;
		node.resumed = payload.resumed;
		await this.resumeOnNode(node);
	}
}
