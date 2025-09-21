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

// Cấu hình Lavalink
const lavalinkOptions = {
	nodes: [
		{
			identifier: "testlava",
			password: "youshallnotpass",
			host: "5.39.63.207",
			port: 4722,
			secure: false,
		},
	],
	client: client,
	clientName: "ziplayer-skip-test/1.0.0",
	searchPrefix: "scsearch",
	nodeSort: "players",
	requestTimeoutMs: 10000,
	updateInterval: 30000,
	debug: true,
};

// Tạo Lavalink extension
const lavalink = new lavalinkExt(null, lavalinkOptions);

// Tạo PlayerManager
const manager = new PlayerManager({
	plugins: [new YouTubePlugin(), new SoundCloudPlugin(), new SpotifyPlugin()],
	extensions: [lavalink],
});

// Event handlers
client.on("ready", () => {
	console.log(`Bot đã sẵn sàng! Logged in as ${client.user?.tag}`);
	console.log("Testing Lavalink skip functionality...");
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
				userdata: {
					channel: message.channel,
				},
			});
			if (!player) {
				message.reply("Bot chưa kết nối voice channel!");
				return;
			}
			const voiceChannel = message.member?.voice?.channel;

			await player.connect(voiceChannel);
			try {
				const result = await player.play(query, {
					requestedBy: message.author.id,
				});

				player.autoPlay(true);

				if (result) {
					message.reply(`Đang phát: ${player.queue.currentTrack?.title || "Unknown"}`);
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

			if (player.destroy()) {
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
				source: player.queue.currentTrack?.source || "None",
			};

			message.reply(`**Trạng thái bot:**
🎵 Đang phát: ${status.playing ? "Có" : "Không"}
⏸️ Tạm dừng: ${status.paused ? "Có" : "Không"}
🎶 Bài hiện tại: ${status.currentTrack}
🔊 Volume: ${status.volume}%
📋 Số bài trong hàng đợi: ${status.queueLength}
🎵 Source: ${status.source}
🔁 Autoplay: ${player.queue.autoPlay() ? "Có" : "Không"}`);
			break;
		}

		case "!test": {
			message.reply(`**Test Skip Functionality:**

1. Phát một bài từ YouTube:
   !play never neuro x evil

2. Thử các lệnh skip:
   !skip - Bỏ qua bài hát
   !pause - Tạm dừng
   !resume - Tiếp tục
   !volume 50 - Đặt volume

3. Phát một bài từ SoundCloud (fallback):
   !play https://soundcloud.com/inspector-gadget-446323366/lemon-demon-modify

4. Thử skip với SoundCloud track (sẽ fallback về plugin)

Lưu ý: Skip command đã được sửa để xử lý lỗi 400 Bad Request!`);
			break;
		}
	}
});

// Event handlers để demo skip
manager.on("trackStart", (player, track) => {
	console.log(`🎵 Started playing: ${track.title} (Source: ${track.source})`);
	player.userdata.channel.send(`🎵 Started playing: ${track.title} (Source: ${track.source})`);
});

manager.on("trackEnd", (player, track) => {
	console.log(`🏁 Finished playing: ${track.title} (Source: ${track.source})`);
	player.userdata.channel.send(`🏁 Finished playing: ${track.title} (Source: ${track.source})`);
});

manager.on("playerError", (player, error, track) => {
	console.error(`❌ Player error:`, error.message);
	player.userdata.channel.send(`❌ Player error: ${error.message}`);
});

manager.on("queueEnd", (player) => {
	console.log("📋 Queue ended");
	player.userdata.channel.send("📋 Queue ended");
});

manager.on("willPlay", (player, track, upcoming) => {
	console.log(`🎵 Will play next: ${track.title} (Source: ${track.source})`);
	player.userdata.channel.send(`🎵 Will play next: ${track.title} (Source: ${track.source})`);
});

// Kết nối bot
client.login(process.env.DISCORD_TOKEN);

console.log(`
🤖 Lavalink Skip Test Bot
=========================

Tính năng skip đã được sửa:
✅ Xử lý lỗi 400 Bad Request
✅ Kiểm tra kết nối node trước khi gửi request
✅ Fallback về plugin khi Lavalink không khả dụng
✅ Debug logs rõ ràng về lỗi

Commands:
!play <query> - Phát nhạc
!pause - Tạm dừng
!resume - Tiếp tục
!stop - Dừng
!skip - Bỏ qua (đã sửa)
!volume <0-200> - Đặt volume
!status - Xem trạng thái
!test - Hướng dẫn test

Test skip functionality với mixed sources!
`);
