import type { Player } from "ziplayer";
import type { LavalinkPlayerState, InternalNode, VoiceServerRawEvent, VoiceServerState } from "../types/lavalink";

export class PlayerStateManager {
	private playerStates = new WeakMap<Player, LavalinkPlayerState>();
	private guildMap = new Map<string, Player>();
	private voiceWaiters = new Map<string, { resolve: () => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
	private debug: (message: string, ...optional: any[]) => void;

	constructor(debug: boolean) {
		this.debug = (message: string, ...optional: any[]) => {
			if (!debug) return;
			const formatted = `[PlayerStateManager] ${message}`;
			console.log(formatted, ...optional);
		};
	}

	attachPlayer(player: Player): void {
		if (!player) return;
		this.guildMap.set(player.guildId, player);

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
				voiceUpdateSent: false,
			});
		}
	}

	detachPlayer(player: Player): void {
		const state = this.playerStates.get(player);
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

	getState(player: Player): LavalinkPlayerState | undefined {
		return this.playerStates.get(player);
	}

	setState(player: Player, state: Partial<LavalinkPlayerState>): void {
		const currentState = this.playerStates.get(player);
		if (currentState) {
			Object.assign(currentState, state);
		}
	}

	getPlayerByGuildId(guildId: string): Player | undefined {
		return this.guildMap.get(guildId);
	}

	handleVoiceServerUpdate(guildId: string, data: any): void {
		const player = this.guildMap.get(guildId);
		if (!player) return;

		const state = this.playerStates.get(player);
		if (!state) return;

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
	}

	handleVoiceStateUpdate(guildId: string, data: any, userId: string): void {
		const player = this.guildMap.get(guildId);
		if (!player) return;

		const state = this.playerStates.get(player);
		if (!state) return;

		const userIdFromData = data?.user_id ?? data?.userId;
		if (userId && userIdFromData !== userId) return;

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
		}
	}

	waitForVoice(player: Player, timeoutMs: number = 15000): Promise<void> {
		const state = this.playerStates.get(player);
		if (!state) return Promise.resolve();
		if (state.voiceState?.sessionId && state.voiceServer?.token && state.voiceServer?.endpoint) {
			return Promise.resolve();
		}

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
			}, timeoutMs);
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

	resolveVoiceWaiter(guildId: string): void {
		this.voiceWaiters.get(guildId)?.resolve();
		this.voiceWaiters.delete(guildId);
	}

	rejectVoiceWaiter(guildId: string, error: Error): void {
		this.voiceWaiters.get(guildId)?.reject(error);
		this.voiceWaiters.delete(guildId);
	}

	getAllPlayers(): Player[] {
		return Array.from(this.guildMap.values());
	}

	getAllStates(): Map<Player, LavalinkPlayerState> {
		const states = new Map<Player, LavalinkPlayerState>();
		for (const player of this.guildMap.values()) {
			const state = this.playerStates.get(player);
			if (state) {
				states.set(player, state);
			}
		}
		return states;
	}

	updatePlayerPosition(player: Player, position: number): void {
		const state = this.playerStates.get(player);
		if (state) {
			state.lastPosition = position;
		}
	}

	setPlayerNode(player: Player, node: InternalNode): void {
		const state = this.playerStates.get(player);
		if (state) {
			// Reset voice update sent flag when node changes
			state.voiceUpdateSent = false;
			state.node = node;
			node.players.add(player.guildId);
		}
	}

	clearPlayerNode(player: Player): void {
		const state = this.playerStates.get(player);
		if (state?.node) {
			state.node.players.delete(player.guildId);
			state.node = undefined;
		}
	}

	destroy(): void {
		// Clear all voice waiters
		for (const [guildId, waiter] of this.voiceWaiters) {
			clearTimeout(waiter.timer);
			waiter.reject(new Error("PlayerStateManager destroyed"));
		}
		this.voiceWaiters.clear();
		this.playerStates = new WeakMap();
		this.guildMap.clear();
	}
}
