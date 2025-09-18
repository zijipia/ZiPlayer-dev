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
		client.on("raw", this.handleRawEvent);
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
		if (this.wsReady) return;
		if (!this.userId && !this.client?.user?.id) return;
		if (!this.userId && this.client?.user?.id) {
			this.userId = this.client.user.id;
		}
		if (!this.userId) return;
		this.wsReady = true;
		for (const node of this.nodes) {
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
			this.handleNodeMessage(node, data.toString());
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

	private handleNodeMessage(node: InternalNode, payload: string): void {
		let data: LavalinkSocketMessage;
		try {
			data = JSON.parse(payload);
		} catch (error) {
			this.debug(`Node ${node.identifier} sent invalid payload`, error, payload.slice(0, 200));
			return;
		}
		this.debug(`Node ${node.identifier} message op=${(data as any).op}`);
		switch (data.op) {
			case "ready":
				this.handleNodeReady(node, data as LavalinkReadyPayload);
				break;
			case "stats":
				node.stats = (data as any).stats ?? (data as any);
				break;
			case "playerUpdate":
				this.handlePlayerUpdate(node, data as LavalinkPlayerStatePayload);
				break;
			case "event":
				this.handleLavalinkEvent(node, data as LavalinkEventPayload);
				break;
			default:
				this.debug(`Node ${node.identifier} unknown op ${data.op}`, data);
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
		if (!payload.resumed) {
			for (const guildId of [...node.players]) {
				const player = this.manager?.get(guildId);
				if (!player) continue;
				const state = this.playerStates.get(player);
				if (!state) continue;
				const current = state.track;
				if (current) {
					player.queue.insert(current, 0);
					state.track = null;
					state.playing = false;
				}
				this.startNextOnLavalink(player).catch((error) =>
					this.debug(`Failed to resume player ${guildId} on node ${node.identifier}`, error),
				);
			}
		}
	}

	private handlePlayerUpdate(_node: InternalNode, payload: LavalinkPlayerStatePayload): void {
		const player = this.manager?.get(payload.guildId);
		if (!player) return;
		const state = this.playerStates.get(player);
		if (!state) return;
		state.lastPosition = payload.state?.position ?? state.lastPosition;
		this.debug(`PlayerUpdate for guild=${payload.guildId} pos=${state.lastPosition}`);
	}

	private handleLavalinkEvent(node: InternalNode, payload: LavalinkEventPayload): void {
		const guildId = payload.guildId;
		const player = this.manager?.get(guildId) ?? this.guildMap.get(guildId);
		if (!player) return;
		const state = this.playerStates.get(player);
		if (!state) return;
		switch (payload.type) {
			case "TrackStartEvent": {
				const track = this.resolveTrackFromEvent(player, payload.track);
				if (track) {
					state.track = track;
					state.playing = true;
					state.paused = false;
					player.isPlaying = true;
					player.isPaused = false;
					player.emit("trackStart", track);
				}
				break;
			}
			case "TrackEndEvent": {
				const track = this.resolveTrackFromEvent(player, payload.track) ?? state.track ?? null;
				if (track) {
					player.emit("trackEnd", track);
				}
				state.track = null;
				state.playing = false;
				player.isPlaying = false;
				if (payload.reason === "replaced") return;
				if (payload.reason === "stopped" && !state.skipNext) return;
				const forced = state.skipNext;
				state.skipNext = false;
				this.startNextOnLavalink(player, forced).catch((error) => this.debug(`Failed to start next track for ${guildId}`, error));
				break;
			}
			case "TrackExceptionEvent": {
				const track = this.resolveTrackFromEvent(player, payload.track) ?? state.track ?? null;
				const error = new Error(payload.exception?.message ?? "Track exception");
				player.emit("playerError", error, track ?? undefined);
				state.track = null;
				state.playing = false;
				player.isPlaying = false;
				this.startNextOnLavalink(player).catch((err) => this.debug(`Failed to recover after exception for ${guildId}`, err));
				break;
			}
			case "TrackStuckEvent": {
				const track = this.resolveTrackFromEvent(player, payload.track) ?? state.track ?? null;
				const error = new Error(`Track stuck for ${payload.thresholdMs}ms`);
				player.emit("playerError", error, track ?? undefined);
				state.track = null;
				state.playing = false;
				player.isPlaying = false;
				this.startNextOnLavalink(player).catch((err) => this.debug(`Failed to recover after stuck track for ${guildId}`, err));
				break;
			}
			case "WebSocketClosedEvent": {
				const error = new Error(`Voice websocket closed with code ${payload.code} (${payload.reason})`);
				player.emit("connectionError", error);
				node.players.delete(guildId);
				break;
			}
		}
	}

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
		this.maybeConnectNodes();

		const requestedBy = payload.requestedBy ?? "Unknown";
		try {
			const { tracks, isPlaylist } = await this.resolvePlayRequest(player, payload.query, requestedBy);
			if (tracks.length === 0) {
				return {
					handled: true,
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
			node.players.add(player.guildId);
			this.debug(`Assigned node ${node.identifier} to guild ${player.guildId}`);
		}

		if (!node.sessionId) {
			await this.waitForNodeReady(node);
		}

		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			await this.sendVoiceUpdate(node, player.guildId, state);
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
			}, this.options.connectTimeoutMs ?? 15_000);
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
		if (!state?.node?.sessionId) return;
		try {
			await state.node.rest.delete(`/sessions/${state.node.sessionId}/players/${player.guildId}`);
		} catch (error) {
			this.debug(`Failed to destroy Lavalink player for ${player.guildId}`, error);
		}
		state.node.players.delete(player.guildId);
		state.track = null;
		state.playing = false;
		state.paused = false;
	}

	private async sendVoiceUpdate(node: InternalNode, guildId: string, state: LavalinkPlayerState): Promise<void> {
		if (!node.ws || node.ws.readyState !== WebSocket.OPEN) return;
		if (!state.voiceState?.sessionId || !state.voiceServer) return;
		const eventPayload = state.voiceServer.rawEvent ?? {
			token: state.voiceServer.token,
			endpoint: state.voiceServer.endpoint,
			guild_id: state.voiceServer.guildId ?? guildId,
		};
		const payload = {
			op: "voiceUpdate",
			guildId,
			sessionId: state.voiceState.sessionId,
			event: eventPayload,
		};
		node.ws.send(JSON.stringify(payload));
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
