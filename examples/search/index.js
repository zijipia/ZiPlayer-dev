const { PlayerManager, getManager } = require("ziplayer");
const { SoundCloudPlugin, YouTubePlugin, SpotifyPlugin, TTSPlugin } = require("@ziplayer/plugin");

(async () => {
	//main file
	new PlayerManager({
		plugins: [new TTSPlugin({ defaultLang: "vi" }), new YouTubePlugin(), new SoundCloudPlugin(), new SpotifyPlugin()],
	});
	//another file
	const plr = PlayerManager.default();
	console.log(await plr.search("Ziji nightcore"));
})();
