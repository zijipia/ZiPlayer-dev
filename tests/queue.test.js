// Node's built-in test runner
const test = require("node:test");
const assert = require("node:assert/strict");

const { Queue } = require("../core/dist");

function makeTrack(id = "t1", title = "Track 1") {
	return {
		id,
		title,
		url: `https://example.com/${id}`,
		duration: 120,
		requestedBy: "tester",
		source: "test",
	};
}

test("Queue add/remove/size basics", () => {
	const q = new Queue();
	assert.equal(q.size, 0);
	const t1 = makeTrack("a");
	q.add(t1);
	assert.equal(q.size, 1);
	const removed = q.remove(0);
	assert.deepEqual(removed, t1);
	assert.equal(q.size, 0);
});

test("Queue next, history and currentTrack", () => {
	const q = new Queue();
	const t1 = makeTrack("a");
	const t2 = makeTrack("b");
	q.addMultiple([t1, t2]);

	assert.equal(q.currentTrack, null);
	const n1 = q.next();
	assert.equal(n1.id, "a");
	assert.equal(q.currentTrack.id, "a");

	const n2 = q.next();
	assert.equal(n2.id, "b");
	assert.equal(q.previousTracks.length, 1);
	assert.equal(q.previousTracks[0].id, "a");
	assert.equal(q.nextTrack, null);
});

test("Queue loop track repeats current", () => {
	const q = new Queue();
	const t1 = makeTrack("a");
	q.add(t1);
	q.loop("track");
	const n1 = q.next();
	assert.equal(n1.id, "a");
	const n2 = q.next();
	assert.equal(n2.id, "a"); // repeats same track
});

test("Queue loop queue recycles history", () => {
	const q = new Queue();
	const t1 = makeTrack("a");
	const t2 = makeTrack("b");
	q.addMultiple([t1, t2]);
	q.loop("queue");
	q.next(); // a
	q.next(); // b
	const n3 = q.next(); // should recycle to a
	assert.equal(n3.id, "a");
});

test("Queue shuffle changes order (probabilistic)", () => {
	const q = new Queue();
	const ids = Array.from({ length: 10 }, (_, i) => `t${i}`);
	q.addMultiple(ids.map((id) => makeTrack(id)));
	const before = q
		.getTracks()
		.map((t) => t.id)
		.join(",");
	q.shuffle();
	const after = q
		.getTracks()
		.map((t) => t.id)
		.join(",");
	// It is possible to be equal, but very unlikely with 10 items
	assert.notEqual(after, before);
});

test("Queue willNextTrack setter/getter", () => {
	const q = new Queue();
	const t = makeTrack("hint");
	assert.equal(q.willNextTrack(), null);
	q.willNextTrack(t);
	assert.equal(q.willNextTrack().id, "hint");
});
