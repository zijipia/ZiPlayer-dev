const { Client, GatewayIntentBits } = require("discord.js");
const { PlayerManager } = require("ziplayer");
const { TTSPlugin, YouTubePlugin, SoundCloudPlugin, SpotifyPlugin } = require("@ziplayer/plugin");
const { voiceExt } = require("@ziplayer/extension");
require("dotenv").config();
//#region Discord Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	],
});
client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

//#endregion
//#region Player Manager
const manager = new PlayerManager({
	plugins: [
		new TTSPlugin({
			defaultLang: "vi",
		}),
		new YouTubePlugin(),
		new SoundCloudPlugin(),
		new SpotifyPlugin(),
	],
	extensions: [
		new voiceExt(null, {
			client: client,
			ignoreBots: true,
		}),
	],
});
manager.on("trackStart", (player, track) => {
	console.log(`Now playing ${track.title}`);
});
manager.on("trackEnd", (player, track) => {
	console.log(`${track.title} has ended`);
});
manager.on("trackError", (player, track, error) => {
	console.log(`${track.title} has errored: ${error}`);
});

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith("!")) return;
	const args = message.content.slice(1).split(/ +/);
	const command = args.shift().toLowerCase();

	if (!message.member.voice.channel) {
		message.channel.send("You are not in a voice channel");
		return;
	}

	async function createPlayer() {
		const player = await manager.create(message.guild.id, {
			tts: {
				voice: "vi",
				interrupt: true,
				volume: 50,
			},
			extensions: ["voiceExt"],
			userdata: {
				channel: message.channel,
			},
		});
		if (!player?.connection) await player.connect(message.member.voice.channel);
		return player;
	}

	switch (command) {
		case "join": {
			await createPlayer();
			break;
		}
		case "tts": {
			const query = args.join(" ");
			const player = await createPlayer();
			await player.play(`tts:${query}`, message.author.id);
			break;
		}
		case "play": {
			const query = args.join(" ");
			const player = await createPlayer();
			await player.play(query, message.author.id);
			break;
		}
		case "leave":
		case "stop": {
			const player = manager.getPlayer(message.guild.id);
			if (player) {
				player.destroy();
			}
			break;
		}
		case "next":
		case "skip": {
			const player = manager.getPlayer(message.guild.id);
			if (player) {
				player.skip();
			}
			break;
		}
		default: {
			message.channel.send(`Command not found: ${command}`);
			break;
		}
	}
});

manager.on("voiceCreate", async (plr, evt) => {
	const lowerContent = evt.content.toLowerCase();
	console.log(lowerContent);
	plr.userdata.channel.send(`[Speech]: [${evt.user?.tag}] ${lowerContent}`);

	if (lowerContent.includes("ngưng phát")) {
		plr.destroy();
	}
	if (lowerContent.includes("bỏ qua")) {
		plr.skip();
	}
	if (lowerContent.includes("dừng")) {
		plr.destroy();
	}
	if (lowerContent.includes("phát")) {
		plr.play(lowerContent.replaceAll("phát", ""));
	}
}); //#endregion

process.on("unhandledRejection", (reason, promise) => {
	console.log(reason);
});
process.on("uncaughtException", (error) => {
	console.log(error);
});
