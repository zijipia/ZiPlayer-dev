const { Client, GatewayIntentBits } = require("discord.js");
const { PlayerManager } = require("ziplayer");
const { lavalinkExt } = require("@ziplayer/extension");
const { YouTubePlugin, SoundCloudPlugin, SpotifyPlugin } = require("@ziplayer/plugin");

require("dotenv").config();

// Tạo Discord client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
});
let interval = null;
// Cấu hình Lavalink với WebSocket optimization
const lavalinkOptions = {
	nodes: [
		{
			identifier: "testlava",
			password: "youshallnotpass",
			host: "5.39.63.207",
			port: 4722,
			secure: false,
		},
		// {
		// 	host: "localhost",
		// 	port: 2333,
		// 	password: "youshallnotpass",
		// 	identifier: "main-node",
		// 	secure: false,
		// },
	],
	client: client,
	clientName: "ziplayer-optimized-bot/1.0.0",
	searchPrefix: "scsearch", // hoặc "scsearch" cho SoundCloud
	nodeSort: "players", // Sắp xếp nodes theo số lượng players
	requestTimeoutMs: 10000,
	updateInterval: 30000, // 30 giây thay vì 5 giây (WebSocket đã xử lý real-time)
	debug: true, // Bật debug để xem WebSocket events
};

// Tạo Lavalink extension
const lavalink = new lavalinkExt(null, lavalinkOptions);
// Tạo PlayerManager
const manager = new PlayerManager({
	// Cấu hình player manager
	plugins: [new YouTubePlugin(), new SoundCloudPlugin(), new SpotifyPlugin()],

	extensions: [lavalink],
});

// Event handlers để demo WebSocket optimization
client.on("ready", () => {
	console.log(`Bot đã sẵn sàng! Logged in as ${client.user?.tag}`);
	console.log("WebSocket optimization đã được kích hoạt!");
});
manager.on("debug", console.log);
// Command handler
client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	if (!message.guild) return;
	const args = message.content.split(" ");
	const command = args[0];

	switch (command) {
		case "!play": {
			const query = args.slice(1).join(" ");
			if (!query) {
				message.reply("Vui lòng cung cấp tên bài hát hoặc URL!");
				return;
			}

			const player = await manager.create(message.guild.id, {
				extensions: ["lavalinkExt"],

				leaveOnEnd: false,
				leaveOnEmpty: false,
			});
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}
			const voiceChannel = message.member?.voice?.channel;

			await player.connect(voiceChannel);
			try {
				// WebSocket sẽ xử lý track events real-time
				const result = await player.play(query, {
					requestedBy: message.author.id,
				});

				player.autoPlay(true);

				if (result.success) {
					message.reply(`Đang phát: ${result.track?.title || "Unknown"}`);
				} else {
					message.reply("Không thể phát bài hát này!");
				}
			} catch (error) {
				console.error("Play error:", error);
				message.reply("Có lỗi xảy ra khi phát nhạc!");
			}
			break;
		}

		case "!pause": {
			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}

			if (player.pause()) {
				message.reply("Đã tạm dừng nhạc!");
			} else {
				message.reply("Không thể tạm dừng nhạc!");
			}
			break;
		}

		case "!resume": {
			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}

			if (player.resume()) {
				message.reply("Đã tiếp tục phát nhạc!");
			} else {
				message.reply("Không thể tiếp tục phát nhạc!");
			}
			break;
		}

		case "!stop": {
			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}

			if (player.stop()) {
				message.reply("Đã dừng nhạc!");
			} else {
				message.reply("Không thể dừng nhạc!");
			}
			break;
		}

		case "!skip": {
			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}

			if (player.skip()) {
				message.reply("Đã bỏ qua bài hát!");
			} else {
				message.reply("Không thể bỏ qua bài hát!");
			}
			break;
		}

		case "!volume": {
			const volume = parseInt(args[1]);
			if (isNaN(volume) || volume < 0 || volume > 200) {
				message.reply("Volume phải là số từ 0 đến 200!");
				return;
			}

			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}

			if (player.setVolume(volume)) {
				message.reply(`Đã đặt volume thành ${volume}%!`);
			} else {
				message.reply("Không thể thay đổi volume!");
			}
			break;
		}

		case "!status": {
			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}

			const status = {
				playing: player.isPlaying,
				paused: player.isPaused,
				currentTrack: player.queue.currentTrack?.title || "None",
				volume: player.volume,
				queueLength: player.queue.length,
			};

			message.reply(`**Trạng thái bot:**
🎵 Đang phát: ${status.playing ? "Có" : "Không"}
⏸️ Tạm dừng: ${status.paused ? "Có" : "Không"}
🎶 Bài hiện tại: ${status.currentTrack}
🔊 Volume: ${status.volume}%
📋 Số bài trong hàng đợi: ${status.queueLength}`);
			break;
		}
		case "!livestat": {
			const player = manager.getPlayer(message.guild.id);
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}
			if (interval) {
				clearInterval(interval);
				interval = null;
				return;
			}
			interval = setInterval(() => {
				const status = {
					playing: player.isPlaying,
					paused: player.isPaused,
					currentTrack: player.queue.currentTrack?.title || "None",
					volume: player.volume,
					queueLength: player.queue.length,
				};

				message.reply(`**Trạng thái bot:**
    🎵 Đang phát: ${status.playing ? "Có" : "Không"}
    ⏸️ Tạm dừng: ${status.paused ? "Có" : "Không"}
    🎶 Bài hiện tại: ${status.currentTrack}
    🔊 Volume: ${status.volume}%
    📋 Số bài trong hàng đợi: ${status.queueLength}`);
			}, 15000);
			break;
		}
	}
});

// WebSocket sẽ xử lý các events này real-time
manager.on("trackStart", (player, track) => {
	console.log(`🎵 Started playing: ${track.title}`);
});

manager.on("trackEnd", (track) => {
	console.log(`🏁 Finished playing: ${track.title}`);
});

manager.on("playerError", (error, track) => {
	console.error(`❌ Player error:`, error.message);
});

manager.on("queueEnd", () => {
	console.log("📋 Queue ended");
});
manager.on("debug", console.log);
manager.on("willPlay", (player, track, tracks) => {
	console.log(`🎵 Will play: ${track.title}`, tracks);
});
// Kết nối bot
client.login(process.env.DISCORD_TOKEN); // Thay thế bằng token của bot

console.log(`
🤖 WebSocket Optimized Music Bot
================================

Tính năng WebSocket optimization:
✅ Real-time player updates
✅ Instant track events
✅ Reduced REST API calls (83% reduction)
✅ Better performance
✅ Lower server load

Commands:
!play <query> - Phát nhạc
!pause - Tạm dừng
!resume - Tiếp tục
!stop - Dừng
!skip - Bỏ qua
!volume <0-200> - Đặt volume
!status - Xem trạng thái

Debug logs sẽ hiển thị WebSocket events real-time!
`);
