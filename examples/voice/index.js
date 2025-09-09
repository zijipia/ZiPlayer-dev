require("dotenv").config();

const { PlayerManager } = require("../../core/dist");
const { Client, GatewayIntentBits } = require("discord.js");
const { SoundCloudPlugin, YouTubePlugin, SpotifyPlugin, TTSPlugin } = require("../../plugins/dist");
const { voiceExt } = require("../../extension/dist");

const prefix = "!";
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
});

const player = new PlayerManager({
	plugins: [new TTSPlugin({ defaultLang: "vi" }), new SoundCloudPlugin(), new YouTubePlugin(), new SpotifyPlugin()],
	extensions: [new voiceExt(null, { client, lang: "vi-VN", minimalVoiceMessageDuration: 1 })],
});

// Basic events
player.on("trackStart", (plr, track) => {
	plr.userdata?.channel?.send?.(`Started playing: **${track.title}**`);
});
player.on("queueAdd", (plr, track) => {
	plr.userdata?.channel?.send?.(`Added to queue: **${track.title}**`);
});
player.on("playerError", (plr, error) => {
	console.log(`[${plr.guildId}] Player error:`, error);
});
player.on("debug", console.log);
player.on("willPlay", (plr, track, upcomming) => {
	console.log(`${track.title} will play next!`);
	plr.userdata?.channel?.send?.(`Upcomming: **${track.title}**, and \n${upcomming.map((t) => `${t.title}\n`)}`);
});

// Voice recognition from voiceExt
player.on("voiceCreate", (plr, evt) => {
	const userTag = evt.user?.tag || evt.userId;
	plr.userdata?.channel?.send?.(`??? ${userTag}: ${evt.content}`);
});

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
	if (message.author.bot || !message.guild) return;
	if (!message.content.startsWith(prefix)) return;
	const args = message.content.slice(1).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	if (command === "join") {
		if (!message.member.voice.channel) return message.channel.send("You must be in a voice channel");
		const queue = player.create(message.guild.id, {
			userdata: { channel: message.channel },
			selfDeaf: true,
		});
		try {
			if (!queue.connection) await queue.connect(message.member.voice.channel);
			message.channel.send("Joined your voice channel");
		} catch (e) {
			console.log(e);
			return message.channel.send("Could not join your voice channel");
		}
	} else if (command === "say") {
		const text = args.join(" ").trim();
		if (!text) return message.channel.send("Usage: !say <text>");
		const plr = player.get(message.guild.id);
		if (!plr || !plr.connection) return message.channel.send("Use !join first so I can speak.");
		const query = `tts: ${text}`; // see TTSPlugin formats
		await plr.play(query, message.author.id).catch(() => null);
	}
});

client.login(process.env.TOKEN);
