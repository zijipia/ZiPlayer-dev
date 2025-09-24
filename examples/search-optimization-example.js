const { PlayerManager } = require("@ziplayer/core");
const { YouTubePlugin, TTSPlugin } = require("@ziplayer/plugins");

// Example demonstrating the new search optimization features
async function demonstrateSearchOptimization() {
	console.log("🎵 ZiPlayer Search Optimization Demo\n");

	// Create player manager with plugins
	const manager = new PlayerManager({
		plugins: [new YouTubePlugin(), new TTSPlugin({ defaultLang: "vi" })],
		extractorTimeout: 10000,
	});

	// Create a player
	const player = await manager.create("123456789", {
		leaveOnEnd: true,
		leaveTimeout: 30000,
	});

	console.log("📊 Initial Cache Stats:");
	console.log("Plugin Cache:", player.getPluginCacheStats());
	console.log("Search Cache:", player.getSearchCacheStats());

	// Test search with caching
	console.log("\n🔍 Testing search with caching...");

	const query = "phố cũ còn anh";
	console.log(`\nSearching for: "${query}"`);

	// Debug the query before searching
	const debugInfo = player.debugSearchQuery(query);
	console.log("Debug Info:", debugInfo);

	try {
		// First search (will be cached)
		console.log("\n--- First Search ---");
		const start1 = Date.now();
		const result1 = await player.search(query, "user123");
		const duration1 = Date.now() - start1;

		console.log(`✅ Found ${result1.tracks.length} tracks in ${duration1}ms`);
		console.log("First track:", result1.tracks[0]?.title);

		// Second search (should use cache)
		console.log("\n--- Second Search (Cached) ---");
		const start2 = Date.now();
		const result2 = await player.search(query, "user123");
		const duration2 = Date.now() - start2;

		console.log(`⚡ Found ${result2.tracks.length} tracks in ${duration2}ms (cached)`);
		console.log("Cache hit! Speed improvement:", `${(((duration1 - duration2) / duration1) * 100).toFixed(1)}%`);

		// Test TTS filtering
		console.log("\n--- Testing TTS Filtering ---");
		const ttsQuery = "tts: Hello world";
		const ttsDebugInfo = player.debugSearchQuery(ttsQuery);
		console.log("TTS Query Debug Info:", ttsDebugInfo);

		// Test regular search (TTS should be filtered out)
		const regularQuery = "Never Gonna Give You Up";
		const regularDebugInfo = player.debugSearchQuery(regularQuery);
		console.log("Regular Query Debug Info:", regularDebugInfo);

		// Show final cache stats
		console.log("\n📊 Final Cache Stats:");
		console.log("Plugin Cache:", player.getPluginCacheStats());
		console.log("Search Cache:", player.getSearchCacheStats());

		// Clear caches
		console.log("\n🧹 Clearing caches...");
		player.clearPluginCache();
		player.clearSearchCache();

		console.log("📊 After Clearing:");
		console.log("Plugin Cache:", player.getPluginCacheStats());
		console.log("Search Cache:", player.getSearchCacheStats());
	} catch (error) {
		console.error("❌ Search failed:", error.message);
	}

	// Cleanup
	player.destroy();
	console.log("\n✅ Demo completed!");
}

// Run the demo
demonstrateSearchOptimization().catch(console.error);
