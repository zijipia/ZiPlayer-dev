const { YTSRPlugin } = require("../plugins/dist/YTSRPlugin");

/**
 * Ví dụ sử dụng YTSRPlugin để tìm kiếm nâng cao trên YouTube
 *
 * Plugin này cung cấp các tính năng tìm kiếm nâng cao mà không cần tạo stream,
 * chỉ trả về metadata của video, playlist và channel.
 */

async function demonstrateYTSRPlugin() {
	const plugin = new YTSRPlugin();

	console.log("🎵 YTSRPlugin Demo - Tìm kiếm nâng cao YouTube\n");

	try {
		// 1. Tìm kiếm video cơ bản
		console.log("1. Tìm kiếm video cơ bản:");
		const basicSearch = await plugin.search("Never Gonna Give You Up", "user123");
		console.log(`   Tìm thấy ${basicSearch.tracks.length} video:`);
		basicSearch.tracks.slice(0, 3).forEach((track, index) => {
			console.log(`   ${index + 1}. ${track.title} - ${track.metadata?.author}`);
			console.log(`      URL: ${track.url}`);
			console.log(`      Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`);
		});
		console.log();

		// 2. Tìm kiếm với tùy chọn nâng cao
		console.log("2. Tìm kiếm với tùy chọn nâng cao:");
		const advancedSearch = await plugin.search("chill music", "user123", {
			limit: 5,
			duration: "medium", // 4-20 phút
			sortBy: "viewCount", // Sắp xếp theo lượt xem
			uploadDate: "month", // Upload trong tháng qua
		});
		console.log(`   Tìm thấy ${advancedSearch.tracks.length} video với filter nâng cao:`);
		advancedSearch.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. ${track.title}`);
			console.log(`      Tác giả: ${track.metadata?.author}`);
			console.log(`      Lượt xem: ${track.metadata?.views?.toLocaleString()}`);
		});
		console.log();

		// 3. Tìm kiếm playlist
		console.log("3. Tìm kiếm playlist:");
		const playlistSearch = await plugin.searchPlaylist("lofi hip hop", "user123", 3);
		console.log(`   Tìm thấy ${playlistSearch.tracks.length} playlist:`);
		playlistSearch.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. ${track.title}`);
			console.log(`      Channel: ${track.metadata?.author}`);
			console.log(`      Số video: ${track.metadata?.videoCount}`);
			console.log(`      URL: ${track.url}`);
		});
		console.log();

		// 4. Tìm kiếm channel
		console.log("4. Tìm kiếm channel:");
		const channelSearch = await plugin.searchChannel("PewDiePie", "user123", 2);
		console.log(`   Tìm thấy ${channelSearch.tracks.length} channel:`);
		channelSearch.tracks.forEach((track, index) => {
			console.log(`   ${index + 1}. ${track.title}`);
			console.log(`      Subscribers: ${track.metadata?.subscriberCount}`);
			console.log(`      URL: ${track.url}`);
		});
		console.log();

		// 5. Tìm kiếm tất cả loại
		console.log("5. Tìm kiếm tất cả loại (video, playlist, channel):");
		const allSearch = await plugin.search("music", "user123", {
			type: "all",
			limit: 6,
		});
		console.log(`   Tìm thấy ${allSearch.tracks.length} kết quả hỗn hợp:`);
		allSearch.tracks.forEach((track, index) => {
			const type = track.metadata?.type || "video";
			console.log(`   ${index + 1}. [${type.toUpperCase()}] ${track.title}`);
			if (type === "playlist") {
				console.log(`      Video count: ${track.metadata?.videoCount}`);
			} else if (type === "channel") {
				console.log(`      Subscribers: ${track.metadata?.subscriberCount}`);
			} else {
				console.log(`      Tác giả: ${track.metadata?.author}`);
			}
		});
		console.log();

		// 6. Xử lý URL YouTube trực tiếp
		console.log("6. Xử lý URL YouTube trực tiếp:");
		const urlSearch = await plugin.search("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "user123");
		if (urlSearch.tracks.length > 0) {
			const track = urlSearch.tracks[0];
			console.log(`   Video: ${track.title}`);
			console.log(`   Tác giả: ${track.metadata?.author}`);
			console.log(`   Thời lượng: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`);
			console.log(`   Lượt xem: ${track.metadata?.views?.toLocaleString()}`);
		}
		console.log();

		// 7. Lấy video theo ID
		console.log("7. Lấy video theo ID:");
		const videoById = await plugin.getVideoById("dQw4w9WgXcQ", "user123");
		if (videoById) {
			console.log(`   Video: ${videoById.title}`);
			console.log(`   Tác giả: ${videoById.metadata?.author}`);
			console.log(`   URL: ${videoById.url}`);
		}
		console.log();

		// 8. Lấy video liên quan
		console.log("8. Lấy video liên quan:");
		const relatedTracks = await plugin.getRelatedTracks("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
			limit: 3,
			offset: 0,
		});
		console.log(`   Tìm thấy ${relatedTracks.length} video liên quan:`);
		relatedTracks.forEach((track, index) => {
			console.log(`   ${index + 1}. ${track.title}`);
			console.log(`      Tác giả: ${track.metadata?.author}`);
			console.log(`      URL: ${track.url}`);
		});
		console.log();

		// 9. Demo các tính năng không được hỗ trợ
		console.log("9. Các tính năng không được hỗ trợ:");
		console.log("   ❌ Plugin này KHÔNG hỗ trợ streaming audio");
		console.log("   ❌ Plugin này KHÔNG hỗ trợ fallback streaming");
		console.log("   ✅ Plugin này CHỈ dành cho tìm kiếm metadata");
		console.log();

		console.log("🎉 Demo hoàn thành! YTSRPlugin cung cấp tìm kiếm nâng cao cho YouTube.");
	} catch (error) {
		console.error("❌ Lỗi trong quá trình demo:", error.message);
	}
}

// Chạy demo nếu file được thực thi trực tiếp
if (require.main === module) {
	demonstrateYTSRPlugin().catch(console.error);
}

module.exports = { demonstrateYTSRPlugin };
