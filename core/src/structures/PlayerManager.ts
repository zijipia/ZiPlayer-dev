import { EventEmitter } from "events";
import { Player } from "./Player";
import { PlayerManagerOptions, PlayerOptions, Track, SourcePlugin } from "../types";

export class PlayerManager extends EventEmitter {
	private players: Map<string, Player> = new Map();
	private plugins: SourcePlugin[];
	private extensions: any[];
	private B_debug: boolean = false;

	private debug(message?: any, ...optionalParams: any[]): void {
		if (this.listenerCount("debug") > 0) {
			this.emit("debug", message, ...optionalParams);
			if (!this.B_debug) {
				this.B_debug = true;
			}
		}
	}

	constructor(options: PlayerManagerOptions = {}) {
		super();
		this.plugins = [];
		const provided = options.plugins || [];
		for (const p of provided as any[]) {
			try {
				if (p && typeof p === "object") {
					this.plugins.push(p as SourcePlugin);
				} else if (typeof p === "function") {
					const instance = new (p as any)();
					this.plugins.push(instance as SourcePlugin);
				}
			} catch (e) {
				this.debug(`[PlayerManager] Failed to init plugin:`, e);
			}
		}
		this.extensions = options.extensions || [];
	}

	private resolveGuildId(guildOrId: string | { id: string }): string {
		if (typeof guildOrId === "string") return guildOrId;
		if (guildOrId && typeof guildOrId === "object" && "id" in guildOrId) return guildOrId.id;
		throw new Error("Invalid guild or guildId provided.");
	}

	create(guildOrId: string | { id: string }, options?: PlayerOptions): Player {
		const guildId = this.resolveGuildId(guildOrId);
		if (this.players.has(guildId)) {
			return this.players.get(guildId)!;
		}

		this.debug(`[PlayerManager] Creating player for guildId: ${guildId}`);
		const player = new Player(guildId, options, this);
		this.plugins.forEach((plugin) => player.addPlugin(plugin));

		try {
			for (const ext of this.extensions) {
				let instance: any = ext;
				try {
					if (typeof ext === "function") {
						instance = new (ext as any)(player);
					}
				} catch {}

				if (instance && typeof instance === "object") {
					try {
						if ("player" in instance && !instance.player) instance.player = player;
						if (typeof instance.active === "function") {
							instance.active({ manager: this, player });
						}
					} catch (e) {
						this.debug(`[PlayerManager] Extension activation error:`, e);
					}
				}
			}
		} catch (e) {
			this.debug(`[PlayerManager] Extensions activation failed:`, e);
		}

		// Forward all player events
		player.on("willPlay", (track, tracks) => this.emit("willPlay", player, track, tracks));
		player.on("trackStart", (track) => this.emit("trackStart", player, track));
		player.on("trackEnd", (track) => this.emit("trackEnd", player, track));
		player.on("queueEnd", () => this.emit("queueEnd", player));
		player.on("playerError", (error, track) => this.emit("playerError", player, error, track));
		player.on("connectionError", (error) => this.emit("connectionError", player, error));
		player.on("volumeChange", (old, volume) => this.emit("volumeChange", player, old, volume));
		player.on("queueAdd", (track) => this.emit("queueAdd", player, track));
		player.on("queueRemove", (track, index) => this.emit("queueRemove", player, track, index));
		player.on("playerPause", (track) => this.emit("playerPause", player, track));
		player.on("playerResume", (track) => this.emit("playerResume", player, track));
		player.on("playerStop", () => this.emit("playerStop", player));
		player.on("playerDestroy", () => {
			this.emit("playerDestroy", player);
			this.players.delete(guildId);
		});
		player.on("debug", (...args) => {
			if (this.listenerCount("debug") > 0) {
				this.emit("debug", ...args);
			}
		});

		this.players.set(guildId, player);
		return player;
	}

	get(guildOrId: string | { id: string }): Player | undefined {
		const guildId = this.resolveGuildId(guildOrId);
		return this.players.get(guildId);
	}

	delete(guildOrId: string | { id: string }): boolean {
		const guildId = this.resolveGuildId(guildOrId);
		const player = this.players.get(guildId);
		if (player) {
			this.debug(`[PlayerManager] Deleting player for guildId: ${guildId}`);
			player.destroy();
			return this.players.delete(guildId);
		}
		return false;
	}

	has(guildOrId: string | { id: string }): boolean {
		const guildId = this.resolveGuildId(guildOrId);
		return this.players.has(guildId);
	}

	get size(): number {
		return this.players.size;
	}

	get debugEnabled(): boolean {
		return this.B_debug;
	}

	destroy(): void {
		this.debug(`[PlayerManager] Destroying all players`);
		for (const player of this.players.values()) {
			player.destroy();
		}
		this.players.clear();
		this.removeAllListeners();
	}
}
