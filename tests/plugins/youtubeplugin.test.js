const test = require('node:test');
const assert = require('node:assert/strict');

// Load the class without running its constructor-heavy init. We'll use the prototype directly.
const { YouTubePlugin } = require('../../plugins/dist/YouTubePlugin.js');

test('YouTube canHandle and validate basic cases', () => {
  const yt = Object.create(YouTubePlugin.prototype);

  // URLs
  assert.equal(yt.validate('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);
  assert.equal(yt.validate('https://youtu.be/dQw4w9WgXcQ'), true);
  assert.equal(yt.validate('https://example.com/watch?v=123'), false);

  // Avoid handling tts/spotify/soundcloud text
  assert.equal(yt.canHandle('tts:hi'), false);
  assert.equal(yt.canHandle('spotify:track:123'), false);
  assert.equal(yt.canHandle('https://soundcloud.com/foo/bar'), false);

  // Generic text is handled (search) by YouTube
  assert.equal(yt.canHandle('never gonna give you up'), true);
});
