import { BaseExtension, Player, PlayerManager, Track } from "ziplayer";

/**
 * Example: A tiny extension that announces basic player events
 * to the text channel saved in `player.options.userdata.channel`.
 *
 * How to use:
 *   const manager = new PlayerManager({
 *     plugins: [...],
 *     extensions: [new AutoAnnounceExt()],
 *   });
 *
 * When a player is created (manager.create) this extension will be activated
 * and it will hook into events on that player.
 */
export class AutoAnnounceExt extends BaseExtension {
  name = "autoAnnounceExt";
  version = "1.0.0";
  player: Player | null = null;

  active(alas: any): boolean {
    // Wire the player the first time we see it
    if (alas?.player && !this.player) this.player = alas.player as Player;
    const player = this.player;
    if (!player) return false;

    // Avoid double-wiring
    const anyP = player as any;
    if (anyP.__autoAnnounceWired) return true;
    anyP.__autoAnnounceWired = true;

    const send = (msg: string) => {
      try {
        (player.userdata as any)?.channel?.send?.(msg);
      } catch {}
    };

    player.on("trackStart", (track: Track) => {
      send(`Now playing: ${track.title}`);
    });

    player.on("trackEnd", (track: Track) => {
      send(`Finished: ${track.title}`);
    });

    player.on("queueAdd", (track: Track) => {
      send(`Added to queue: ${track.title}`);
    });

    player.on("queueEnd", () => {
      send(`Queue ended ✨`);
    });

    player.on("playerError", (err: Error, track?: Track) => {
      send(`Error${track ? ` on ${track.title}` : ""}: ${err.message}`);
    });

    // Let the manager know we are active
    player.emit("debug", `[AutoAnnounceExt] active on guild=${player.guildId}`);
    return true;
  }
}

// Example usage (uncomment to try quickly):
// const manager = new PlayerManager({
//   plugins: [],
//   extensions: [new AutoAnnounceExt()],
// });
// const player = manager.create("<guildId>", { userdata: { channel: <TextChannel> } });
// await player.connect(<VoiceChannel>);
// await player.play("never gonna give you up", "<userId>");

