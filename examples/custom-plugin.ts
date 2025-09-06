import { BasePlugin } from "ziplayer";
import { Track, SearchResult, StreamInfo } from "ziplayer";
import { Readable } from "stream";
import fetch from "node-fetch";

export class CustomRadioPlugin extends BasePlugin {
	name = "radio";
	version = "1.0.0";

	private stations = new Map([
		["chill", { name: "Chill Radio", url: "https://example.com/chill-stream" }],
		["rock", { name: "Rock Radio", url: "https://example.com/rock-stream" }],
		["pop", { name: "Pop Radio", url: "https://example.com/pop-stream" }],
	]);

	canHandle(query: string): boolean {
		return query.startsWith("radio:") || this.stations.has(query.toLowerCase());
	}

	async search(query: string, requestedBy: string): Promise<SearchResult> {
		const stationName = query.replace("radio:", "").toLowerCase();
		const station = this.stations.get(stationName);

		if (!station) {
			throw new Error(`Radio station "${stationName}" not found`);
		}

		const track: Track = {
			id: stationName,
			title: station.name,
			url: station.url,
			duration: 0, // Live stream
			thumbnail: `https://example.com/radio-${stationName}.jpg`,
			requestedBy,
			source: this.name,
			metadata: {
				isLive: true,
				station: stationName,
			},
		};

		return { tracks: [track] };
	}

	async getStream(track: Track): Promise<StreamInfo> {
		try {
			const response = await fetch(track.url);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const stream = response.body as unknown as Readable;

			return {
				stream,
				type: "arbitrary",
				metadata: track.metadata,
			};
		} catch (error) {
			throw new Error(`Failed to get radio stream: ${error.message}`);
		}
	}
}

// Usage with custom plugin:
/*
const radioPlugin = new CustomRadioPlugin();
const manager = new PlayerManager({
  plugins: [youtubePlugin, radioPlugin]
});
const player = manager.create(guildId, { userdata: { channel } });

// Play radio station
await player.play('radio:chill', userId);
// or
await player.play('chill', userId);
*/
