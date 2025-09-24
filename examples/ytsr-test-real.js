const { YTSRPlugin } = require("../plugins/dist/YTSRPlugin");

/**
 * Test thực tế với các URL và query cụ thể
 *
 * Test với:
 * - https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1
 * - https://youtu.be/MWGnHCaqxdU?si=5CkjqYUnO-S7FaNS
 * - https://www.youtube.com/playlist?list=PL1TL451RtuURA4iTeV2b8ll-spKEi6JME
 * - "EVIL Cover by Camila and Evil"
 */

async function testRealYTSRPlugin() {
	const plugin = new YTSRPlugin();

	console.log("🧪 YTSRPlugin Test Thực Tế\n");

	try {
		// Test 1: URL YouTube với playlist và radio
		console.log("1. Test URL YouTube với playlist và radio:");
		console.log("   URL: https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1");

		const result1 = await plugin.search(
			"https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1",
			"test_user",
		);
		console.log(`   ✅ Tìm thấy ${result1.tracks.length} track:`);

		if (result1.tracks.length > 0) {
			const track = result1.tracks[0];
			console.log(`   📹 Video: ${track.title}`);
			console.log(`   👤 Tác giả: ${track.metadata?.author}`);
			console.log(`   ⏱️ Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`);
			console.log(`   👀 Lượt xem: ${track.metadata?.views?.toLocaleString()}`);
			console.log(`   🔗 URL: ${track.url}`);
		}
		console.log();

		// Test 2: URL YouTube short format
		console.log("2. Test URL YouTube short format:");
		console.log("   URL: https://youtu.be/MWGnHCaqxdU?si=5CkjqYUnO-S7FaNS");

		const result2 = await plugin.search("https://youtu.be/MWGnHCaqxdU?si=5CkjqYUnO-S7FaNS", "test_user");
		console.log(`   ✅ Tìm thấy ${result2.tracks.length} track:`);

		if (result2.tracks.length > 0) {
			const track = result2.tracks[0];
			console.log(`   📹 Video: ${track.title}`);
			console.log(`   👤 Tác giả: ${track.metadata?.author}`);
			console.log(`   ⏱️ Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`);
			console.log(`   👀 Lượt xem: ${track.metadata?.views?.toLocaleString()}`);
			console.log(`   🔗 URL: ${track.url}`);
		}
		console.log();

		// Test 3: URL Playlist YouTube Mix (RD)
		console.log("3. Test URL Playlist YouTube Mix (RD):");
		console.log("   URL: https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1");

		const result3 = await plugin.search(
			"https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1",
			"test_user",
			{
				limit: 8,
			},
		);
		console.log(`   ✅ Tìm thấy ${result3.tracks.length} track trong Mix:`);

		if (result3.playlist) {
			console.log(`   📋 Mix Playlist: ${result3.playlist.name}`);
			console.log(`   🔗 URL: ${result3.playlist.url}`);
		}

		result3.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. 📹 ${track.title}`);
			console.log(`      👤 Tác giả: ${track.metadata?.author}`);
			console.log(`      ⏱️ Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`);
			console.log(`      🔗 URL: ${track.url}`);
		});
		console.log();

		// Test 3.1: Test handleMixPlaylist method trực tiếp
		console.log("3.1. Test handleMixPlaylist method trực tiếp:");
		const mixResult = await plugin.handleMixPlaylist(
			"https://www.youtube.com/watch?v=MWGnHCaqxdU&list=RDMWGnHCaqxdU&start_radio=1",
			"test_user",
			6,
		);
		console.log(`   ✅ Tìm thấy ${mixResult.tracks.length} track trong Mix:`);

		if (mixResult.playlist) {
			console.log(`   📋 Mix Playlist: ${mixResult.playlist.name}`);
		}

		mixResult.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. 📹 ${track.title}`);
			console.log(`      👤 Tác giả: ${track.metadata?.author}`);
		});
		console.log();

		// Test 4: Text search query
		console.log("4. Test Text Search Query:");
		console.log('   Query: "EVIL Cover by Camila and Evil"');

		const result4 = await plugin.search("EVIL Cover by Camila and Evil", "test_user", {
			limit: 5,
			type: "video",
		});
		console.log(`   ✅ Tìm thấy ${result4.tracks.length} video:`);

		result4.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. 📹 ${track.title}`);
			console.log(`      👤 Tác giả: ${track.metadata?.author}`);
			console.log(`      ⏱️ Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`);
			console.log(`      👀 Lượt xem: ${track.metadata?.views?.toLocaleString()}`);
			console.log(`      🔗 URL: ${track.url}`);
		});
		console.log();

		// Test 5: getRelatedTracks với video đầu tiên từ kết quả tìm kiếm
		if (result4.tracks.length > 0) {
			console.log("5. Test getRelatedTracks:");
			const firstVideo = result4.tracks[0];
			console.log(`   Video gốc: ${firstVideo.title}`);

			const relatedTracks = await plugin.getRelatedTracks(firstVideo.url, {
				limit: 3,
				offset: 0,
				history: [firstVideo],
			});

			console.log(`   ✅ Tìm thấy ${relatedTracks.length} video liên quan:`);
			relatedTracks.forEach((track, index) => {
				console.log(`   ${index + 1}. 📹 ${track.title}`);
				console.log(`      👤 Tác giả: ${track.metadata?.author}`);
				console.log(
					`      ⏱️ Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`,
				);
				console.log(`      🔗 URL: ${track.url}`);
			});
			console.log();
		}

		// Test 6: getVideoById với video ID từ URL
		console.log("6. Test getVideoById:");
		const videoId = "MWGnHCaqxdU";
		console.log(`   Video ID: ${videoId}`);

		const videoById = await plugin.getVideoById(videoId, "test_user");
		if (videoById) {
			console.log(`   ✅ Tìm thấy video:`);
			console.log(`   📹 Video: ${videoById.title}`);
			console.log(`   👤 Tác giả: ${videoById.metadata?.author}`);
			console.log(
				`   ⏱️ Thời lượng: ${Math.floor(videoById.duration / 60)}:${(videoById.duration % 60).toString().padStart(2, "0")}`,
			);
			console.log(`   👀 Lượt xem: ${videoById.metadata?.views?.toLocaleString()}`);
			console.log(`   🔗 URL: ${videoById.url}`);
		} else {
			console.log(`   ❌ Không tìm thấy video với ID: ${videoId}`);
		}
		console.log();

		// Test 7: Tìm kiếm playlist với query text
		console.log("7. Test searchPlaylist:");
		const playlistResult = await plugin.searchPlaylist("EVIL Cover", "test_user", 3);
		console.log(`   ✅ Tìm thấy ${playlistResult.tracks.length} playlist:`);

		playlistResult.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. 📋 ${track.title}`);
			console.log(`      👤 Channel: ${track.metadata?.author}`);
			console.log(`      📊 Số video: ${track.metadata?.videoCount}`);
			console.log(`      🔗 URL: ${track.url}`);
		});
		console.log();

		// Test 8: Tìm kiếm channel
		console.log("8. Test searchChannel:");
		const channelResult = await plugin.searchChannel("Camila", "test_user", 2);
		console.log(`   ✅ Tìm thấy ${channelResult.tracks.length} channel:`);

		channelResult.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. 📺 ${track.title}`);
			console.log(`      👥 Subscribers: ${track.metadata?.subscriberCount}`);
			console.log(`      🔗 URL: ${track.url}`);
		});
		console.log();

		console.log("🎉 Tất cả test đã hoàn thành thành công!");
	} catch (error) {
		console.error("❌ Lỗi trong quá trình test:", error.message);
		console.error("Stack trace:", error.stack);
	}
}

// Chạy test nếu file được thực thi trực tiếp
if (require.main === module) {
	testRealYTSRPlugin().catch(console.error);
}

module.exports = { testRealYTSRPlugin };
