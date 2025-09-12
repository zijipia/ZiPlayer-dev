const test = require("node:test");
const assert = require("node:assert/strict");

// Avoid network by skipping constructor; prototype only.
const { SpotifyPlugin } = require("../../plugins/dist/SpotifyPlugin.js");

test("Spotify canHandle and validate URLs/URIs", () => {
	const sp = Object.create(SpotifyPlugin.prototype);
	assert.equal(sp.canHandle("spotify:track:123"), true);
	assert.equal(sp.canHandle("https://open.spotify.com/track/123"), true);
	assert.equal(sp.canHandle("https://example.com/track/123"), false);
	assert.equal(sp.validate("spotify:album:abc"), true);
	assert.equal(sp.validate("https://open.spotify.com/playlist/xyz"), true);
	assert.equal(sp.validate("not-spotify"), false);
});
