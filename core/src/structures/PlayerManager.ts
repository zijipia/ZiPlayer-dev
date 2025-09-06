import { EventEmitter } from "events";
import { Player } from "./Player";
import { PlayerManagerOptions, PlayerOptions, Track, SourcePlugin } from "../types";

export class PlayerManager extends EventEmitter {
	private players: Map<string, Player> = new Map();
	private plugins: SourcePlugin[];

	private debug(message?: any, ...optionalParams: any[]): void {
		if (this.listenerCount("debug") > 0) {
			this.emit("debug", message, ...optionalParams);
		}
	}

	constructor(options: PlayerManagerOptions = {}) {
		super();
		this.plugins = options.plugins || [];
	}

	create(guildId: string, options?: PlayerOptions): Player {
		if (this.players.has(guildId)) {
			return this.players.get(guildId)!;
		}

		this.debug(`[PlayerManager] Creating player for guildId: ${guildId}`);
		const player = new Player(guildId, options);
		this.plugins.forEach((plugin) => player.addPlugin(plugin));

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

	get(guildId: string): Player | undefined {
		return this.players.get(guildId);
	}

	delete(guildId: string): boolean {
		const player = this.players.get(guildId);
		if (player) {
			this.debug(`[PlayerManager] Deleting player for guildId: ${guildId}`);
			player.destroy();
			return this.players.delete(guildId);
		}
		return false;
	}

	has(guildId: string): boolean {
		return this.players.has(guildId);
	}

	get size(): number {
		return this.players.size;
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
