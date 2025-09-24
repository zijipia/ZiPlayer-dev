const { YTSRPlugin } = require("../plugins/dist/YTSRPlugin");

/**
 * Test đơn giản cho Mix Playlist
 */

async function testMixPlaylist() {
	const plugin = new YTSRPlugin();

	console.log("🧪 Test Mix Playlist\n");

	try {
		// Test Mix playlist URL
		const mixUrl = "https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1";
		console.log("Testing Mix playlist:", mixUrl);

		const result = await plugin.handleMixPlaylist(mixUrl, "test_user", 5);

		console.log(`✅ Tìm thấy ${result.tracks.length} track trong Mix`);

		if (result.playlist) {
			console.log(`📋 Mix Playlist: ${result.playlist.name}`);
		}

		result.tracks.forEach((track, index) => {
			console.log(`${index + 1}. ${track.title} - ${track.metadata?.author}`);
		});

		console.log("\n🎉 Test Mix Playlist hoàn thành!");
	} catch (error) {
		console.error("❌ Lỗi:", error.message);
	}
}

// Chạy test
testMixPlaylist().catch(console.error);
