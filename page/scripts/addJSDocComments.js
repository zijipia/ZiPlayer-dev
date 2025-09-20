const fs = require("fs");
const path = require("path");

/**
 * Script để thêm JSDoc comments vào code
 */

class JSDocAdder {
	constructor() {
		this.templates = {
			class: `/**
 * {description}
 * 
 * @example
 * {example}
 */`,

			method: `/**
 * {description}
 * 
 * @param {type} param - Description
 * @returns {type} Description
 * @example
 * {example}
 */`,

			event: `/**
 * {description}
 * 
 * @event {name}
 * @param {type} param - Description
 */`,

			interface: `/**
 * {description}
 * 
 * @example
 * {example}
 */`,
		};
	}

	/**
	 * Thêm JSDoc cho PlayerManager class
	 */
	addPlayerManagerDocs() {
		const filePath = path.resolve(__dirname, "../../core/src/structures/PlayerManager.ts");
		let content = fs.readFileSync(filePath, "utf8");

		// Thêm JSDoc cho class
		const classDoc = `/**
 * The main class for managing players across multiple Discord guilds.
 * 
 * @example
 * const manager = new PlayerManager({
 *   plugins: [new YouTubePlugin(), new SoundCloudPlugin()],
 *   extensions: [new voiceExt(), new lavalinkExt()]
 * });
 * 
 * @method create - Create a new player for a guild
 * @method get - Get an existing player for a guild  
 * @method destroy - Destroy a player and clean up resources
 * @event playerCreate - Emitted when a new player is created
 * @event playerDestroy - Emitted when a player is destroyed
 */`;

		// Thay thế class declaration
		content = content.replace(
			/export class PlayerManager extends EventEmitter \{/,
			`${classDoc}\nexport class PlayerManager extends EventEmitter {`,
		);

		// Thêm JSDoc cho methods
		const methodDocs = {
			"async create(": `/**
 * Create a new player for a guild
 * 
 * @param {string | {id: string}} guildOrId - Guild ID or guild object
 * @param {PlayerOptions} options - Player configuration options
 * @returns {Promise<Player>} The created player instance
 * @example
 * const player = await manager.create(guildId, {
 *   tts: { interrupt: true, volume: 1 },
 *   leaveOnEnd: true,
 *   leaveTimeout: 30000
 * });
 */`,

			"get(guildOrId: string | { id: string }): Player | undefined": `/**
 * Get an existing player for a guild
 * 
 * @param {string | {id: string}} guildOrId - Guild ID or guild object
 * @returns {Player | undefined} The player instance or undefined
 * @example
 * const player = manager.get(guildId);
 * if (player) {
 *   await player.play("song name", userId);
 * }
 */`,

			"delete(guildOrId: string | { id: string }): boolean": `/**
 * Destroy a player and clean up resources
 * 
 * @param {string | {id: string}} guildOrId - Guild ID or guild object
 * @returns {boolean} True if player was destroyed
 * @example
 * const destroyed = manager.destroy(guildId);
 * console.log(\`Player destroyed: \${destroyed}\`);
 */`,
		};

		// Thêm method docs
		for (const [method, doc] of Object.entries(methodDocs)) {
			const regex = new RegExp(`(\\s+)(${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`);
			content = content.replace(regex, `$1${doc}\n$1$2`);
		}

		fs.writeFileSync(filePath, content);
		console.log("Added JSDoc to PlayerManager");
	}

	/**
	 * Thêm JSDoc cho Player class
	 */
	addPlayerDocs() {
		const filePath = path.resolve(__dirname, "../../core/src/structures/Player.ts");
		let content = fs.readFileSync(filePath, "utf8");

		const classDoc = `/**
 * Represents a music player for a specific Discord guild.
 * 
 * @example
 * const player = await manager.create(guildId, {
 *   tts: { interrupt: true, volume: 1 },
 *   leaveOnEnd: true,
 *   leaveTimeout: 30000
 * });
 * 
 * await player.connect(voiceChannel);
 * await player.play("Never Gonna Give You Up", userId);
 * 
 * @method connect - Connect to a voice channel
 * @method play - Play a track or search query
 * @method pause - Pause the current track
 * @method resume - Resume the paused track
 * @method skip - Skip to the next track
 * @method stop - Stop playback and clear queue
 * @method setVolume - Set the player volume
 * @event trackStart - Emitted when a track starts playing
 * @event trackEnd - Emitted when a track ends
 * @event queueEnd - Emitted when the queue is empty
 */`;

		content = content.replace(
			/export class Player extends EventEmitter \{/,
			`${classDoc}\nexport class Player extends EventEmitter {`,
		);

		// Thêm method docs
		const methodDocs = {
			"async connect(": `/**
 * Connect to a voice channel
 * 
 * @param {VoiceChannel} channel - Discord voice channel
 * @returns {Promise<void>}
 * @example
 * await player.connect(voiceChannel);
 */`,

			"async play(": `/**
 * Play a track or search query
 * 
 * @param {string} query - Track URL or search query
 * @param {string} requestedBy - User ID who requested the track
 * @returns {Promise<void>}
 * @example
 * await player.play("Never Gonna Give You Up", userId);
 * await player.play("https://youtube.com/watch?v=dQw4w9WgXcQ", userId);
 * await player.play("tts: Hello everyone!", userId);
 */`,

			"pause(): void": `/**
 * Pause the current track
 * 
 * @example
 * player.pause();
 */`,

			"resume(): void": `/**
 * Resume the paused track
 * 
 * @example
 * player.resume();
 */`,

			"skip(): boolean": `/**
 * Skip to the next track
 * 
 * @returns {boolean} True if skipped successfully
 * @example
 * const skipped = player.skip();
 * console.log(\`Skipped: \${skipped}\`);
 */`,

			"stop(): void": `/**
 * Stop playback and clear queue
 * 
 * @example
 * player.stop();
 */`,

			"setVolume(volume: number): void": `/**
 * Set the player volume (0-2)
 * 
 * @param {number} volume - Volume level (0-2)
 * @example
 * player.setVolume(0.5); // 50% volume
 */`,
		};

		for (const [method, doc] of Object.entries(methodDocs)) {
			const regex = new RegExp(`(\\s+)(${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`);
			content = content.replace(regex, `$1${doc}\n$1$2`);
		}

		fs.writeFileSync(filePath, content);
		console.log("Added JSDoc to Player");
	}

	/**
	 * Thêm JSDoc cho Queue class
	 */
	addQueueDocs() {
		const filePath = path.resolve(__dirname, "../../core/src/structures/Queue.ts");
		let content = fs.readFileSync(filePath, "utf8");

		const classDoc = `/**
 * Manages the track queue for a player.
 * 
 * @example
 * const queue = player.queue;
 * 
 * // Add tracks
 * queue.add(track);
 * queue.add([track1, track2, track3]);
 * 
 * // Queue controls
 * queue.shuffle();
 * queue.clear();
 * queue.autoPlay(true);
 * 
 * // Get queue info
 * console.log(\`Queue length: \${queue.length}\`);
 * console.log(\`Current track: \${queue.current?.title}\`);
 * 
 * @method add - Add track(s) to the queue
 * @method remove - Remove a track from the queue
 * @method shuffle - Shuffle the queue
 * @method clear - Clear all tracks from the queue
 * @method autoPlay - Enable or disable auto-play
 */`;

		content = content.replace(/export class Queue \{/, `${classDoc}\nexport class Queue {`);

		const methodDocs = {
			"add(track: Track): void": `/**
 * Add track(s) to the queue
 * 
 * @param {Track | Track[]} track - Track or array of tracks to add
 * @example
 * queue.add(track);
 * queue.add([track1, track2, track3]);
 */`,

			"remove(index: number): Track | null": `/**
 * Remove a track from the queue
 * 
 * @param {number} index - Index of track to remove
 * @returns {Track | null} Removed track or null
 * @example
 * const removed = queue.remove(0);
 * console.log(\`Removed: \${removed?.title}\`);
 */`,

			"shuffle(): void": `/**
 * Shuffle the queue
 * 
 * @example
 * queue.shuffle();
 */`,

			"clear(): void": `/**
 * Clear all tracks from the queue
 * 
 * @example
 * queue.clear();
 */`,

			"autoPlay(value?: boolean): boolean": `/**
 * Enable or disable auto-play
 * 
 * @param {boolean} value - Enable/disable auto-play
 * @returns {boolean} Current auto-play state
 * @example
 * queue.autoPlay(true);
 */`,
		};

		for (const [method, doc] of Object.entries(methodDocs)) {
			const regex = new RegExp(`(\\s+)(${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`);
			content = content.replace(regex, `$1${doc}\n$1$2`);
		}

		fs.writeFileSync(filePath, content);
		console.log("Added JSDoc to Queue");
	}

	/**
	 * Thêm JSDoc cho interfaces
	 */
	addInterfaceDocs() {
		const filePath = path.resolve(__dirname, "../../core/src/types/index.ts");
		let content = fs.readFileSync(filePath, "utf8");

		const interfaceDocs = {
			"export interface Track {": `/**
 * Represents a music track with metadata and streaming information.
 * 
 * @example
 * const track: Track = {
 *   id: "dQw4w9WgXcQ",
 *   title: "Never Gonna Give You Up",
 *   url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
 *   duration: 212000,
 *   thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
 *   requestedBy: "123456789",
 *   source: "youtube",
 *   metadata: {
 *     artist: "Rick Astley",
 *     album: "Whenever You Need Somebody"
 *   }
 * };
 */
export interface Track {`,

			"export interface SearchResult {": `/**
 * Contains search results from plugins, including tracks and optional playlist information.
 * 
 * @example
 * const result: SearchResult = {
 *   tracks: [
 *     {
 *       id: "track1",
 *       title: "Song 1",
 *       url: "https://example.com/track1",
 *       duration: 180000,
 *       requestedBy: "user123",
 *       source: "youtube"
 *     }
 *   ],
 *   playlist: {
 *     name: "My Playlist",
 *     url: "https://example.com/playlist",
 *     thumbnail: "https://example.com/thumb.jpg"
 *   }
 * };
 */
export interface SearchResult {`,

			"export interface StreamInfo {": `/**
 * Contains streaming information for audio playback.
 * 
 * @example
 * const streamInfo: StreamInfo = {
 *   stream: audioStream,
 *   type: "webm/opus",
 *   metadata: {
 *     bitrate: 128000,
 *     sampleRate: 48000
 *   }
 * };
 */
export interface StreamInfo {`,

			"export interface PlayerOptions {": `/**
 * Configuration options for creating a new player instance.
 * 
 * @example
 * const options: PlayerOptions = {
 *   leaveOnEnd: true,
 *   leaveOnEmpty: true,
 *   leaveTimeout: 30000,
 *   volume: 0.5,
 *   quality: "high",
 *   selfDeaf: false,
 *   selfMute: false,
 *   extractorTimeout: 10000,
 *   tts: {
 *     createPlayer: true,
 *     interrupt: true,
 *     volume: 1.0,
 *     Max_Time_TTS: 30000
 *   }
 * };
 */
export interface PlayerOptions {`,

			"export interface PlayerManagerOptions {": `/**
 * Configuration options for creating a PlayerManager instance.
 * 
 * @example
 * const managerOptions: PlayerManagerOptions = {
 *   plugins: [
 *     new YouTubePlugin(),
 *     new SoundCloudPlugin(),
 *     new SpotifyPlugin(),
 *     new TTSPlugin({ defaultLang: "en" })
 *   ],
 *   extensions: [
 *     new voiceExt(null, { lang: "en-US" }),
 *     new lavalinkExt(null, { nodes: [...] })
 *   ],
 *   extractorTimeout: 10000
 * };
 */
export interface PlayerManagerOptions {`,

			"export interface PlayerEvents {": `/**
 * Event types emitted by Player instances.
 * 
 * @example
 * player.on("trackStart", (track) => {
 *   console.log(\`Now playing: \${track.title}\`);
 * });
 * 
 * player.on("queueEnd", () => {
 *   console.log("Queue finished");
 * });
 */
export interface PlayerEvents {`,
		};

		for (const [interfaceName, doc] of Object.entries(interfaceDocs)) {
			content = content.replace(interfaceName, doc);
		}

		fs.writeFileSync(filePath, content);
		console.log("Added JSDoc to interfaces");
	}

	/**
	 * Chạy tất cả
	 */
	run() {
		console.log("Adding JSDoc comments to code...");
		this.addPlayerManagerDocs();
		this.addPlayerDocs();
		this.addQueueDocs();
		this.addInterfaceDocs();
		console.log("JSDoc comments added successfully!");
	}
}

// Chạy script
if (require.main === module) {
	const adder = new JSDocAdder();
	adder.run();
}

module.exports = JSDocAdder;
