<img width="1175" height="305" alt="logo" src="https://github.com/user-attachments/assets/b85a4976-ef7d-432a-9cae-36b11486ac0f" />

# ziplayer

A modular Discord voice player with plugin system for @discordjs/voice.

## Features

- 🎵 **Plugin-based architecture** - Easy to extend with new sources
- 🎶 **Multiple source support** - YouTube, SoundCloud, Spotify (with fallback)
- 🔊 **Queue management** - Add, remove, shuffle, clear
- 🎚️ **Volume control** - 0-200% volume range
- ⏯️ **Playback control** - Play, pause, resume, stop, skip
- 🔁 **Auto play** - Automatically replay the queue when it ends
- 🔂 **Loop control** - Repeat a single track or the entire queue
- 📊 **Progress bar** - Display playback progress with customizable icons
- 🔔 **Event-driven** - Rich event system for all player actions
- 🎭 **Multi-guild support** - Manage players across multiple Discord servers
- 🗃️ **User data** - Attach custom data to each player for later use

## Installation

```bash
npm install ziplayer @ziplayer/plugin @ziplayer/extension @discordjs/voice discord.js
```

## Quick Start

```typescript
import { PlayerManager } from "ziplayer";
import { SoundCloudPlugin, YouTubePlugin, SpotifyPlugin } from "@ziplayer/plugin";
import { voiceExt } from "@ziplayer/extension";

const manager = new PlayerManager({
	plugins: [new SoundCloudPlugin(), new YouTubePlugin(), new SpotifyPlugin()],
	extensions: [
		new voiceExt(null, {
			lang: "vi-VN",
			minimalVoiceMessageDuration: 1,
			postSilenceDelayMs: 2000,
		}),
	],
});

// Create player
const player = manager.create(guildId, {
	leaveOnEnd: true,
	leaveTimeout: 30000,
	userdata: { channel: textChannel }, // store channel for events
	// Choose extensions for this player (by name or instances)
	extensions: ["voiceExt"],
});

// Connect and play
await player.connect(voiceChannel);
await player.play("Never Gonna Give You Up", userId);

// Play a full YouTube playlist
await player.play("https://www.youtube.com/playlist?list=PL123", userId);

// Enable autoplay
player.queue.autoPlay(true);

// Play a full SoundCloud playlist
await player.play("https://soundcloud.com/artist/sets/playlist", userId);

// Events
player.on("willPlay", (player, track) => {
	console.log(`Up next: ${track.title}`);
});
player.on("trackStart", (player, track) => {
	console.log(`Now playing: ${track.title}`);
	player.userdata?.channel?.send(`Now playing: ${track.title}`);
});

// Receive transcripts
manager.on("voiceCreate", (player, evt) => {
	console.log(`User ${evt.userId} said: ${evt.content}`);
});
```

## Available Plugins

### YouTubePlugin

Supports YouTube videos and playlists.

```typescript
import { YouTubePlugin } from "@ziplayer/plugin";
const youtube = new YouTubePlugin();
```

### SoundCloudPlugin

Supports SoundCloud tracks and playlists.

```typescript
import { SoundCloudPlugin } from "@ziplayer/plugin";
const soundcloud = new SoundCloudPlugin();
```

### SpotifyPlugin

Supports Spotify tracks, albums, and playlists (requires fallback plugin for streaming).

```typescript
import { SpotifyPlugin } from "@ziplayer/plugin";
const spotify = new SpotifyPlugin();
```

## Creating Custom Plugins

```typescript
import { BasePlugin, Track, SearchResult, StreamInfo } from "ziplayer";

export class MyPlugin extends BasePlugin {
	name = "myplugin";
	version = "1.0.0";

	canHandle(query: string): boolean {
		return query.includes("mysite.com");
	}

	async search(query: string, requestedBy: string): Promise<SearchResult> {
		// Implement search logic
		return {
			tracks: [
				/* ... */
			],
		};
	}

	async getStream(track: Track): Promise<StreamInfo> {
		// Return audio stream
		return { stream, type: "arbitrary" };
	}
}
```

## Progress Bar

Display the current playback progress with `getProgressBar`:

```typescript
console.log(player.getProgressBar({ size: 30, barChar: "-", progressChar: "🔘" }));
```

## Events

All player events are forwarded through the PlayerManager:

- `trackStart` - When a track starts playing
- `willPlay` - Before a track begins playing
- `trackEnd` - When a track finishes
- `queueEnd` - When the queue is empty
- `playerError` - When an error occurs
- `queueAdd` - When a track is added
- `volumeChange` - When volume changes
- And more...

## Useful Links

[Example](https://github.com/ZiProject/ZiPlayer/tree/main/examples) | [Repo](https://github.com/ZiProject/ZiPlayer) |
[Package](https://www.npmjs.com/package/ziplayer) | [Plugin](https://www.npmjs.com/package/@ziplayer/plugin) |
[Extension](https://www.npmjs.com/package/@ziplayer/extension)

## License

MIT License
