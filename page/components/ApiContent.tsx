"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Play, Music, Mic, Headphones, Settings } from "lucide-react";

// Import generated API content (will be created by build script)
import { generatedApiContent } from "./GeneratedApiContent";
const apiContent = generatedApiContent;
// const apiContent = {
// 	playermanager: {
// 		title: "PlayerManager",
// 		description: "The main class for managing players across multiple Discord guilds.",
// 		badges: ["class", "core", "manager"],
// 		code: `import { PlayerManager } from "ziplayer";
// import { YouTubePlugin, SoundCloudPlugin, SpotifyPlugin, TTSPlugin } from "@ziplayer/plugin";
// import { voiceExt, lavalinkExt } from "@ziplayer/extension";

// const manager = new PlayerManager({
//   plugins: [
//     new TTSPlugin({ defaultLang: "en" }),
//     new YouTubePlugin(),
//     new SoundCloudPlugin(),
//     new SpotifyPlugin()
//   ],
//   extensions: [
//     new voiceExt(null, { lang: "en-US" }),
//     new lavalinkExt(null, { nodes: [...] })
//   ]
// });`,
// 		methods: [
// 			{
// 				name: "create",
// 				description: "Create a new player for a guild",
// 				signature: "create(guildId: string, options?: PlayerOptions): Player",
// 				example: `const player = await manager.create(guildId, {
//   tts: { interrupt: true, volume: 1 },
//   leaveOnEnd: true,
//   leaveTimeout: 30000,
// });`,
// 			},
// 			{
// 				name: "get",
// 				description: "Get an existing player for a guild",
// 				signature: "get(guildId: string): Player | undefined",
// 				example: `const player = manager.get(guildId);
// if (player) {
//   await player.play("song name", userId);
// }`,
// 			},
// 			{
// 				name: "destroy",
// 				description: "Destroy a player and clean up resources",
// 				signature: "destroy(guildId: string): boolean",
// 				example: `const destroyed = manager.destroy(guildId);
// console.log(\`Player destroyed: \${destroyed}\`);`,
// 			},
// 		],
// 		events: [
// 			{
// 				name: "playerCreate",
// 				description: "Emitted when a new player is created",
// 				parameters: ["player: Player"],
// 			},
// 			{
// 				name: "playerDestroy",
// 				description: "Emitted when a player is destroyed",
// 				parameters: ["player: Player"],
// 			},
// 			{
// 				name: "voiceCreate",
// 				description: "Emitted when voice is detected (requires voiceExt)",
// 				parameters: ["player: Player", "event: VoiceEvent"],
// 			},
// 		],
// 	},
// 	player: {
// 		title: "Player",
// 		description: "Represents a music player for a specific Discord guild.",
// 		badges: ["class", "core", "player"],
// 		code: `const player = await manager.create(guildId, {
//   tts: { interrupt: true, volume: 1 },
//   leaveOnEnd: true,
//   leaveTimeout: 30000,
// });

// await player.connect(voiceChannel);
// await player.play("Never Gonna Give You Up", userId);`,
// 		methods: [
// 			{
// 				name: "connect",
// 				description: "Connect to a voice channel",
// 				signature: "connect(channel: VoiceChannel): Promise<void>",
// 				example: `await player.connect(voiceChannel);`,
// 			},
// 			{
// 				name: "play",
// 				description: "Play a track or search query",
// 				signature: "play(query: string, requestedBy: string): Promise<void>",
// 				example: `await player.play("Never Gonna Give You Up", userId);
// await player.play("https://youtube.com/watch?v=dQw4w9WgXcQ", userId);
// await player.play("tts: Hello everyone!", userId);`,
// 			},
// 			{
// 				name: "pause",
// 				description: "Pause the current track",
// 				signature: "pause(): void",
// 				example: `player.pause();`,
// 			},
// 			{
// 				name: "resume",
// 				description: "Resume the paused track",
// 				signature: "resume(): void",
// 				example: `player.resume();`,
// 			},
// 			{
// 				name: "skip",
// 				description: "Skip to the next track",
// 				signature: "skip(): boolean",
// 				example: `const skipped = player.skip();
// console.log(\`Skipped: \${skipped}\`);`,
// 			},
// 			{
// 				name: "stop",
// 				description: "Stop playback and clear queue",
// 				signature: "stop(): void",
// 				example: `player.stop();`,
// 			},
// 			{
// 				name: "setVolume",
// 				description: "Set the player volume (0-2)",
// 				signature: "setVolume(volume: number): void",
// 				example: `player.setVolume(0.5); // 50% volume`,
// 			},
// 		],
// 		events: [
// 			{
// 				name: "trackStart",
// 				description: "Emitted when a track starts playing",
// 				parameters: ["player: Player", "track: Track"],
// 			},
// 			{
// 				name: "trackEnd",
// 				description: "Emitted when a track ends",
// 				parameters: ["player: Player", "track: Track", "reason: string"],
// 			},
// 			{
// 				name: "queueEnd",
// 				description: "Emitted when the queue is empty",
// 				parameters: ["player: Player"],
// 			},
// 		],
// 	},
// 	queue: {
// 		title: "Queue",
// 		description: "Manages the track queue for a player.",
// 		badges: ["class", "core", "queue"],
// 		code: `const queue = player.queue;

// // Add tracks
// queue.add(track);
// queue.add([track1, track2, track3]);

// // Queue controls
// queue.shuffle();
// queue.clear();
// queue.autoPlay(true);

// // Get queue info
// console.log(\`Queue length: \${queue.length}\`);
// console.log(\`Current track: \${queue.current?.title}\`);`,
// 		methods: [
// 			{
// 				name: "add",
// 				description: "Add track(s) to the queue",
// 				signature: "add(track: Track | Track[]): void",
// 				example: `queue.add(track);
// queue.add([track1, track2, track3]);`,
// 			},
// 			{
// 				name: "remove",
// 				description: "Remove a track from the queue",
// 				signature: "remove(index: number): Track | undefined",
// 				example: `const removed = queue.remove(0);
// console.log(\`Removed: \${removed?.title}\`);`,
// 			},
// 			{
// 				name: "shuffle",
// 				description: "Shuffle the queue",
// 				signature: "shuffle(): void",
// 				example: `queue.shuffle();`,
// 			},
// 			{
// 				name: "clear",
// 				description: "Clear all tracks from the queue",
// 				signature: "clear(): void",
// 				example: `queue.clear();`,
// 			},
// 			{
// 				name: "autoPlay",
// 				description: "Enable or disable auto-play",
// 				signature: "autoPlay(enabled: boolean): void",
// 				example: `queue.autoPlay(true);`,
// 			},
// 		],
// 		events: [],
// 	},
// 	track: {
// 		title: "Track",
// 		description: "Represents a music track with metadata and streaming information.",
// 		badges: ["interface", "core", "track"],
// 		code: `interface Track {
//   id: string;
//   title: string;
//   url: string;
//   duration: number;
//   thumbnail?: string;
//   requestedBy: string;
//   source: string;
//   metadata?: Record<string, any>;
// }

// // Example usage
// const track: Track = {
//   id: "dQw4w9WgXcQ",
//   title: "Never Gonna Give You Up",
//   url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
//   duration: 212000,
//   thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
//   requestedBy: "123456789",
//   source: "youtube",
//   metadata: {
//     artist: "Rick Astley",
//     album: "Whenever You Need Somebody"
//   }
// };`,
// 		methods: [],
// 		events: [],
// 	},
// 	searchresult: {
// 		title: "SearchResult",
// 		description: "Contains search results from plugins, including tracks and optional playlist information.",
// 		badges: ["interface", "core", "search"],
// 		code: `interface SearchResult {
//   tracks: Track[];
//   playlist?: {
//     name: string;
//     url: string;
//     thumbnail?: string;
//   };
// }

// // Example usage
// const result: SearchResult = {
//   tracks: [
//     {
//       id: "track1",
//       title: "Song 1",
//       url: "https://example.com/track1",
//       duration: 180000,
//       requestedBy: "user123",
//       source: "youtube"
//     }
//   ],
//   playlist: {
//     name: "My Playlist",
//     url: "https://example.com/playlist",
//     thumbnail: "https://example.com/thumb.jpg"
//   }
// };`,
// 		methods: [],
// 		events: [],
// 	},
// 	streaminfo: {
// 		title: "StreamInfo",
// 		description: "Contains streaming information for audio playback.",
// 		badges: ["interface", "core", "stream"],
// 		code: `interface StreamInfo {
//   stream: Readable;
//   type: "webm/opus" | "ogg/opus" | "arbitrary";
//   metadata?: Record<string, any>;
// }

// // Example usage
// const streamInfo: StreamInfo = {
//   stream: audioStream,
//   type: "webm/opus",
//   metadata: {
//     bitrate: 128000,
//     sampleRate: 48000
//   }
// };`,
// 		methods: [],
// 		events: [],
// 	},
// 	playeroptions: {
// 		title: "PlayerOptions",
// 		description: "Configuration options for creating a new player instance.",
// 		badges: ["interface", "core", "options"],
// 		code: `interface PlayerOptions {
//   leaveOnEnd?: boolean;
//   leaveOnEmpty?: boolean;
//   leaveTimeout?: number;
//   volume?: number;
//   quality?: "high" | "low";
//   selfDeaf?: boolean;
//   selfMute?: boolean;
//   extractorTimeout?: number;
//   userdata?: Record<string, any>;
//   tts?: {
//     createPlayer?: boolean;
//     interrupt?: boolean;
//     volume?: number;
//     Max_Time_TTS?: number;
//   };
//   extensions?: any[] | string[];
// }

// // Example usage
// const options: PlayerOptions = {
//   leaveOnEnd: true,
//   leaveOnEmpty: true,
//   leaveTimeout: 30000,
//   volume: 0.5,
//   quality: "high",
//   selfDeaf: false,
//   selfMute: false,
//   extractorTimeout: 10000,
//   tts: {
//     createPlayer: true,
//     interrupt: true,
//     volume: 1.0,
//     Max_Time_TTS: 30000
//   }
// };`,
// 		methods: [],
// 		events: [],
// 	},
// 	playermanageroptions: {
// 		title: "PlayerManagerOptions",
// 		description: "Configuration options for creating a PlayerManager instance.",
// 		badges: ["interface", "core", "manager"],
// 		code: `interface PlayerManagerOptions {
//   plugins?: SourcePluginLike[];
//   extensions?: any[];
//   extractorTimeout?: number;
// }

// // Example usage
// const managerOptions: PlayerManagerOptions = {
//   plugins: [
//     new YouTubePlugin(),
//     new SoundCloudPlugin(),
//     new SpotifyPlugin(),
//     new TTSPlugin({ defaultLang: "en" })
//   ],
//   extensions: [
//     new voiceExt(null, { lang: "en-US" }),
//     new lavalinkExt(null, { nodes: [...] })
//   ],
//   extractorTimeout: 10000
// };`,
// 		methods: [],
// 		events: [],
// 	},
// 	lavalinkext: {
// 		title: "lavalinkExt",
// 		description: "Lavalink extension for high-quality audio streaming and advanced features.",
// 		badges: ["class", "extension", "lavalink"],
// 		code: `import { lavalinkExt } from "@ziplayer/extension";

// const extension = new lavalinkExt(null, {
//   nodes: [
//     {
//       host: "localhost",
//       port: 2333,
//       password: "youshallnotpass",
//       secure: false
//     }
//   ],
//   searchPrefix: "scsearch",
//   nodeSort: "players",
//   requestTimeoutMs: 10000,
//   updateInterval: 5000,
//   debug: true
// });`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new Lavalink extension instance",
// 				signature: "constructor(player: Player | null, options: LavalinkExtOptions)",
// 				example: `const lavalink = new lavalinkExt(player, {
//   nodes: [{ host: "localhost", port: 2333, password: "pass" }],
//   debug: true
// });`,
// 			},
// 			{
// 				name: "active",
// 				description: "Check if the extension is active",
// 				signature: "active(alas: any): Promise<boolean>",
// 				example: `const isActive = await lavalink.active({ manager, player });`,
// 			},
// 		],
// 		events: [
// 			{
// 				name: "nodeConnect",
// 				description: "Emitted when a Lavalink node connects",
// 				parameters: ["node: LavalinkNode"],
// 			},
// 			{
// 				name: "nodeDisconnect",
// 				description: "Emitted when a Lavalink node disconnects",
// 				parameters: ["node: LavalinkNode", "reason: string"],
// 			},
// 			{
// 				name: "trackStart",
// 				description: "Emitted when a track starts playing on Lavalink",
// 				parameters: ["player: Player", "track: Track"],
// 			},
// 			{
// 				name: "trackEnd",
// 				description: "Emitted when a track ends on Lavalink",
// 				parameters: ["player: Player", "track: Track", "reason: string"],
// 			},
// 		],
// 	},
// 	voiceext: {
// 		title: "voiceExt",
// 		description: "Voice recognition extension for speech-to-text and voice commands.",
// 		badges: ["class", "extension", "voice"],
// 		code: `import { voiceExt } from "@ziplayer/extension";

// const extension = new voiceExt(null, {
//   lang: "en-US",
//   debug: false,
//   onVoiceChange: async (ctx) => {
//     // Custom voice change handler
//     return { lang: "vi-VN" };
//   }
// });`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new Voice extension instance",
// 				signature: "constructor(player: Player | null, options: VoiceExtOptions)",
// 				example: `const voice = new voiceExt(player, {
//   lang: "en-US",
//   debug: true
// });`,
// 			},
// 			{
// 				name: "active",
// 				description: "Check if the extension is active",
// 				signature: "active(alas: any): Promise<boolean>",
// 				example: `const isActive = await voice.active({ manager, player });`,
// 			},
// 		],
// 		events: [
// 			{
// 				name: "voiceCreate",
// 				description: "Emitted when voice is detected",
// 				parameters: ["player: Player", "event: VoiceEvent"],
// 			},
// 			{
// 				name: "voiceChange",
// 				description: "Emitted when voice settings change",
// 				parameters: ["player: Player", "oldLang: string", "newLang: string"],
// 			},
// 		],
// 	},
// 	lyricsext: {
// 		title: "lyricsExt",
// 		description: "Lyrics extension for fetching and displaying song lyrics.",
// 		badges: ["class", "extension", "lyrics"],
// 		code: `import { lyricsExt } from "@ziplayer/extension";

// const extension = new lyricsExt(null, {
//   debug: false,
//   providers: ["genius", "musixmatch"],
//   fallback: true
// });`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new Lyrics extension instance",
// 				signature: "constructor(player: Player | null, options: LyricsOptions)",
// 				example: `const lyrics = new lyricsExt(player, {
//   debug: true,
//   providers: ["genius"]
// });`,
// 			},
// 			{
// 				name: "getLyrics",
// 				description: "Get lyrics for a track",
// 				signature: "getLyrics(track: Track): Promise<LyricsResult | null>",
// 				example: `const lyrics = await lyrics.getLyrics(track);
// if (lyrics) {
//   console.log(lyrics.text);
// }`,
// 			},
// 		],
// 		events: [
// 			{
// 				name: "lyricsFound",
// 				description: "Emitted when lyrics are found",
// 				parameters: ["player: Player", "track: Track", "lyrics: LyricsResult"],
// 			},
// 			{
// 				name: "lyricsNotFound",
// 				description: "Emitted when lyrics are not found",
// 				parameters: ["player: Player", "track: Track"],
// 			},
// 		],
// 	},
// 	youtubeplugin: {
// 		title: "YouTubePlugin",
// 		description: "Plugin for searching and streaming YouTube videos.",
// 		badges: ["class", "plugin", "youtube"],
// 		code: `import { YouTubePlugin } from "@ziplayer/plugin";

// const plugin = new YouTubePlugin();

// // The plugin automatically handles YouTube URLs and search queries
// await player.play("https://youtube.com/watch?v=dQw4w9WgXcQ", userId);
// await player.play("Never Gonna Give You Up", userId);`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new YouTube plugin instance",
// 				signature: "constructor()",
// 				example: `const youtube = new YouTubePlugin();`,
// 			},
// 			{
// 				name: "canHandle",
// 				description: "Check if the plugin can handle a query",
// 				signature: "canHandle(query: string): boolean",
// 				example: `const canHandle = youtube.canHandle("https://youtube.com/watch?v=...");`,
// 			},
// 			{
// 				name: "search",
// 				description: "Search for tracks on YouTube",
// 				signature: "search(query: string, requestedBy: string): Promise<SearchResult>",
// 				example: `const results = await youtube.search("Never Gonna Give You Up", userId);`,
// 			},
// 		],
// 		events: [],
// 	},
// 	soundcloudplugin: {
// 		title: "SoundCloudPlugin",
// 		description: "Plugin for searching and streaming SoundCloud tracks.",
// 		badges: ["class", "plugin", "soundcloud"],
// 		code: `import { SoundCloudPlugin } from "@ziplayer/plugin";

// const plugin = new SoundCloudPlugin();

// // The plugin automatically handles SoundCloud URLs and search queries
// await player.play("https://soundcloud.com/artist/track", userId);
// await player.play("soundcloud: Never Gonna Give You Up", userId);`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new SoundCloud plugin instance",
// 				signature: "constructor()",
// 				example: `const soundcloud = new SoundCloudPlugin();`,
// 			},
// 			{
// 				name: "canHandle",
// 				description: "Check if the plugin can handle a query",
// 				signature: "canHandle(query: string): boolean",
// 				example: `const canHandle = soundcloud.canHandle("https://soundcloud.com/...");`,
// 			},
// 		],
// 		events: [],
// 	},
// 	spotifyplugin: {
// 		title: "SpotifyPlugin",
// 		description: "Plugin for searching and streaming Spotify tracks.",
// 		badges: ["class", "plugin", "spotify"],
// 		code: `import { SpotifyPlugin } from "@ziplayer/plugin";

// const plugin = new SpotifyPlugin();

// // The plugin automatically handles Spotify URLs and search queries
// await player.play("https://open.spotify.com/track/...", userId);
// await player.play("spotify:track:4iV5W9uYEdYUVa79Axb7Rh", userId);`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new Spotify plugin instance",
// 				signature: "constructor()",
// 				example: `const spotify = new SpotifyPlugin();`,
// 			},
// 			{
// 				name: "canHandle",
// 				description: "Check if the plugin can handle a query",
// 				signature: "canHandle(query: string): boolean",
// 				example: `const canHandle = spotify.canHandle("https://open.spotify.com/...");`,
// 			},
// 		],
// 		events: [],
// 	},
// 	ttsplugin: {
// 		title: "TTSPlugin",
// 		description: "Text-to-Speech plugin for converting text to audio.",
// 		badges: ["class", "plugin", "tts"],
// 		code: `import { TTSPlugin } from "@ziplayer/plugin";

// const plugin = new TTSPlugin({
//   defaultLang: "en",
//   slow: false,
//   createStream: async (text, ctx) => {
//     // Custom TTS stream creation
//     return customTTSStream;
//   }
// });

// // Use TTS with tts: prefix
// await player.play("tts: Hello everyone!", userId);`,
// 		methods: [
// 			{
// 				name: "constructor",
// 				description: "Create a new TTS plugin instance",
// 				signature: "constructor(options?: TTSPluginOptions)",
// 				example: `const tts = new TTSPlugin({
//   defaultLang: "vi",
//   slow: false
// });`,
// 			},
// 			{
// 				name: "canHandle",
// 				description: "Check if the plugin can handle a query",
// 				signature: "canHandle(query: string): boolean",
// 				example: `const canHandle = tts.canHandle("tts: Hello world");`,
// 			},
// 		],
// 		events: [],
// 	},
// 	playerevents: {
// 		title: "PlayerEvents",
// 		description: "Event types emitted by Player instances.",
// 		badges: ["interface", "core", "events"],
// 		code: `interface PlayerEvents {
//   debug: [message: string, ...args: any[]];
//   willPlay: [track: Track, upcomingTracks: Track[]];
//   trackStart: [track: Track];
//   trackEnd: [track: Track];
//   queueEnd: [];
//   playerError: [error: Error, track?: Track];
//   connectionError: [error: Error];
//   volumeChange: [oldVolume: number, newVolume: number];
//   queueAdd: [track: Track];
//   queueAddList: [tracks: Track[]];
//   queueRemove: [track: Track, index: number];
//   playerPause: [track: Track];
//   playerResume: [track: Track];
//   playerStop: [];
//   playerDestroy: [];
//   ttsStart: [payload: { text?: string; track?: Track }];
//   ttsEnd: [];
// }

// // Example usage
// player.on("trackStart", (track) => {
//   console.log(\`Now playing: \${track.title}\`);
// });

// player.on("queueEnd", () => {
//   console.log("Queue finished");
// });`,
// 		methods: [],
// 		events: [],
// 	},
// };

export function ApiContent() {
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [activeSection, setActiveSection] = useState("playermanager");

	const copyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		setCopiedCode(code);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const currentContent = apiContent[activeSection as keyof typeof apiContent];

	return (
		<div className='max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-sm min-h-full'>
			{/* Header */}
			<div className='mb-8'>
				<div className='flex items-center gap-4 mb-4'>
					<div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg'>
						<Play className='w-6 h-6 text-white' />
					</div>
					<div>
						<h1 className='text-4xl font-bold text-white'>{currentContent.title}</h1>
						<div className='flex gap-2 mt-2'>
							{currentContent.badges.map((badge) => (
								<span
									key={badge}
									className='px-2 py-1 text-xs font-medium bg-gray-700/50 backdrop-blur-sm text-gray-300 rounded border border-gray-600/30'>
									{badge}
								</span>
							))}
						</div>
					</div>
				</div>
				<p className='text-xl text-gray-300 leading-relaxed'>{currentContent.description}</p>
			</div>

			{/* Code Example */}
			<div className='mb-8'>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-2xl font-bold text-white'>Example</h2>
					<button
						onClick={() => copyCode(currentContent.code)}
						className='flex items-center gap-2 px-3 py-1 bg-gray-700/50 backdrop-blur-sm hover:bg-gray-600/50 text-white rounded transition-colors border border-gray-600/30'>
						{copiedCode === currentContent.code ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
						{copiedCode === currentContent.code ? "Copied!" : "Copy"}
					</button>
				</div>
				<div className='relative'>
					<div className='absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-xl' />
					<div className='relative bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 shadow-lg'>
						<pre className='text-sm text-gray-300 overflow-x-auto'>
							<code>{currentContent.code}</code>
						</pre>
					</div>
				</div>
			</div>

			{/* Methods */}
			{currentContent.methods && (
				<div className='mb-8'>
					<h2 className='text-2xl font-bold text-white mb-6'>Methods</h2>
					<div className='space-y-6'>
						{currentContent.methods.map((method, index) => (
							<div
								key={index}
								className='bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 shadow-lg'>
								<div className='flex items-start justify-between mb-3'>
									<div>
										<h3 className='text-xl font-bold text-white mb-2'>{method.name}</h3>
										<p className='text-gray-300 mb-3'>{method.description}</p>
										<code className='text-sm text-blue-400 bg-gray-900/50 backdrop-blur-sm px-2 py-1 rounded border border-gray-700/50'>
											{method.signature}
										</code>
									</div>
									<button
										onClick={() => copyCode(method.example)}
										className='flex items-center gap-2 px-3 py-1 bg-gray-700/50 backdrop-blur-sm hover:bg-gray-600/50 text-white rounded transition-colors border border-gray-600/30'>
										{copiedCode === method.example ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
									</button>
								</div>
								<div className='bg-gray-900/50 backdrop-blur-sm rounded p-4 border border-gray-700/30'>
									<pre className='text-sm text-gray-300 overflow-x-auto'>
										<code>{method.example}</code>
									</pre>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Events */}
			{currentContent.events && (
				<div className='mb-8'>
					<h2 className='text-2xl font-bold text-white mb-6'>Events</h2>
					<div className='space-y-4'>
						{currentContent.events.map((event, index) => (
							<div
								key={index}
								className='bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 shadow-lg'>
								<h3 className='text-xl font-bold text-white mb-2'>{event.name}</h3>
								<p className='text-gray-300 mb-3'>{event.description}</p>
								<div className='flex flex-wrap gap-2'>
									{event.parameters.map((param, idx) => (
										<span
											key={idx}
											className='px-2 py-1 text-xs font-medium bg-blue-900/30 backdrop-blur-sm text-blue-300 rounded border border-blue-700/30'>
											{param}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Navigation */}
			<div className='flex flex-wrap gap-2'>
				{/* Core Classes */}
				<div className='flex gap-2'>
					<button
						onClick={() => setActiveSection("playermanager")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "playermanager"
								? "bg-blue-600/80 text-white border-blue-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						PlayerManager
					</button>
					<button
						onClick={() => setActiveSection("player")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "player"
								? "bg-blue-600/80 text-white border-blue-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						Player
					</button>
					<button
						onClick={() => setActiveSection("queue")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "queue"
								? "bg-blue-600/80 text-white border-blue-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						Queue
					</button>
				</div>

				{/* Interfaces */}
				<div className='flex gap-2'>
					<button
						onClick={() => setActiveSection("track")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "track"
								? "bg-green-600/80 text-white border-green-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						Track
					</button>
					<button
						onClick={() => setActiveSection("searchresult")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "searchresult"
								? "bg-green-600/80 text-white border-green-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						SearchResult
					</button>
					<button
						onClick={() => setActiveSection("streaminfo")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "streaminfo"
								? "bg-green-600/80 text-white border-green-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						StreamInfo
					</button>
					<button
						onClick={() => setActiveSection("playeroptions")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "playeroptions"
								? "bg-green-600/80 text-white border-green-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						PlayerOptions
					</button>
					<button
						onClick={() => setActiveSection("playermanageroptions")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "playermanageroptions"
								? "bg-green-600/80 text-white border-green-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						PlayerManagerOptions
					</button>
					<button
						onClick={() => setActiveSection("playerevents")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "playerevents"
								? "bg-green-600/80 text-white border-green-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						PlayerEvents
					</button>
				</div>

				{/* Extensions */}
				<div className='flex gap-2'>
					<button
						onClick={() => setActiveSection("lavalinkext")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "lavalinkext"
								? "bg-purple-600/80 text-white border-purple-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						lavalinkExt
					</button>
					<button
						onClick={() => setActiveSection("voiceext")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "voiceext"
								? "bg-purple-600/80 text-white border-purple-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						voiceExt
					</button>
					<button
						onClick={() => setActiveSection("lyricsext")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "lyricsext"
								? "bg-purple-600/80 text-white border-purple-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						lyricsExt
					</button>
				</div>

				{/* Plugins */}
				<div className='flex gap-2'>
					<button
						onClick={() => setActiveSection("youtubeplugin")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "youtubeplugin"
								? "bg-red-600/80 text-white border-red-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						YouTubePlugin
					</button>
					<button
						onClick={() => setActiveSection("soundcloudplugin")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "soundcloudplugin"
								? "bg-orange-600/80 text-white border-orange-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						SoundCloudPlugin
					</button>
					<button
						onClick={() => setActiveSection("spotifyplugin")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "spotifyplugin"
								? "bg-green-500/80 text-white border-green-400/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						SpotifyPlugin
					</button>
					<button
						onClick={() => setActiveSection("ttsplugin")}
						className={`px-3 py-1 text-sm rounded transition-colors backdrop-blur-sm border ${
							activeSection === "ttsplugin"
								? "bg-indigo-600/80 text-white border-indigo-500/50"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/30"
						}`}>
						TTSPlugin
					</button>
				</div>
			</div>
		</div>
	);
}
