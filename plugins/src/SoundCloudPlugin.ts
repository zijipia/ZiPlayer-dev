import { BasePlugin, Track, SearchResult, StreamInfo } from "ziplayer";

const SoundCloud = require("@zibot/scdl");

export class SoundCloudPlugin extends BasePlugin {
	name = "soundcloud";
	version = "1.0.0";
	private client: any;
	private ready: Promise<void>;

	constructor() {
		super();
		this.ready = this.init();
	}

	private async init(): Promise<void> {
		this.client = new SoundCloud({ init: false });
		await this.client.init();
	}

	canHandle(query: string): boolean {
		return query.includes("soundcloud.com") || (!query.startsWith("http") && !query.includes("youtube"));
	}

	validate(url: string): boolean {
		return url.includes("soundcloud.com");
	}

	async search(query: string, requestedBy: string): Promise<SearchResult> {
		await this.ready;

		try {
			if (query.includes("soundcloud.com")) {
				try {
					const info = await this.client.getTrackDetails(query);
					const track: Track = {
						id: info.id.toString(),
						title: info.title,
						url: info.permalink_url || query,
						duration: info.duration,
						thumbnail: info.artwork_url,
						requestedBy,
						source: this.name,
						metadata: {
							author: info.user?.username,
							plays: info.playback_count,
						},
					};
					return { tracks: [track] };
				} catch {
					const playlist = await this.client.getPlaylistDetails(query);
					const tracks: Track[] = playlist.tracks.map((t: any) => ({
						id: t.id.toString(),
						title: t.title,
						url: t.permalink_url,
						duration: t.duration,
						thumbnail: t.artwork_url || playlist.artwork_url,
						requestedBy,
						source: this.name,
						metadata: {
							author: t.user?.username,
							plays: t.playback_count,
							playlist: playlist.id?.toString(),
						},
					}));

					return {
						tracks,
						playlist: {
							name: playlist.title,
							url: playlist.permalink_url || query,
							thumbnail: playlist.artwork_url,
						},
					};
				}
			}

			const results = await this.client.searchTracks({ query, limit: 15 });
			const tracks: Track[] = results.slice(0, 10).map((track: any) => ({
				id: track.id.toString(),
				title: track.title,
				url: track.permalink_url,
				duration: track.duration,
				thumbnail: track.artwork_url,
				requestedBy,
				source: this.name,
				metadata: {
					author: track.user?.username,
					plays: track.playback_count,
				},
			}));

			return { tracks };
		} catch (error: any) {
			throw new Error(`SoundCloud search failed: ${error?.message}`);
		}
	}

	async getStream(track: Track): Promise<StreamInfo> {
		await this.ready;

		try {
			const stream = await this.client.downloadTrack(track.url);
			if (!stream) {
				throw new Error("SoundCloud download returned null");
			}

			return {
				stream,
				type: "arbitrary",
				metadata: track.metadata,
			};
		} catch (error: any) {
			throw new Error(`Failed to get SoundCloud stream: ${error.message}`);
		}
	}

	async getRelatedTracks(
		trackURL: string | number,
		opts: { limit?: number; offset?: number; history?: Track[] } = {},
	): Promise<Track[]> {
		await this.ready;
		try {
			const tracks = await this.client.getRelatedTracks(trackURL, {
				limit: 30,
				filter: "tracks",
			});

			if (!tracks || !tracks?.length) {
				return [];
			}
			const relatedfilter = tracks.filter((tr: any) => !(opts?.history ?? []).some((t) => t.url === tr.permalink_url));

			const related = relatedfilter.slice(0, opts.limit || 1);

			return related.map((t: any) => ({
				id: t.id.toString(),
				title: t.title,
				url: t.permalink_url,
				duration: t.duration,
				thumbnail: t.artwork_url,
				requestedBy: "auto",
				source: this.name,
				metadata: {
					author: t.user?.username,
					plays: t.playback_count,
				},
			}));
		} catch {
			return [];
		}
	}

	async getFallback(track: Track): Promise<StreamInfo> {
		const trackfall = await this.search(track.title, track.requestedBy);
		const fallbackTrack = trackfall.tracks?.[0];
		if (!fallbackTrack) {
			throw new Error(`No fallback track found for ${track.title}`);
		}
		return await this.getStream(fallbackTrack);
	}

	async extractPlaylist(url: string, requestedBy: string): Promise<Track[]> {
		await this.ready;
		try {
			const playlist = await this.client.getPlaylistDetails(url);
			return playlist.tracks.map((t: any) => ({
				id: t.id.toString(),
				title: t.title,
				url: t.permalink_url,
				duration: t.duration,
				thumbnail: t.artwork_url || playlist.artwork_url,
				requestedBy,
				source: this.name,
				metadata: {
					author: t.user?.username,
					plays: t.playback_count,
					playlist: playlist.id?.toString(),
				},
			}));
		} catch {
			return [];
		}
	}
}
