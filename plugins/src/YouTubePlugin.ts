import { BasePlugin, Track, SearchResult, StreamInfo } from "ziplayer";

import { Innertube, Log } from "youtubei.js";

export class YouTubePlugin extends BasePlugin {
	name = "youtube";
	version = "1.0.0";

	private client!: Innertube;
	private searchClient!: Innertube;
	private ready: Promise<void>;

	constructor() {
		super();
		this.ready = this.init();
	}

	private async init(): Promise<void> {
		this.client = await Innertube.create({
			client_type: "ANDROID",
			retrieve_player: false,
		} as any);

		// Use a separate web client for search to avoid mobile parser issues
		this.searchClient = await Innertube.create({
			client_type: "WEB",
			retrieve_player: false,
		} as any);
		Log.setLevel(0);
	}

	canHandle(query: string): boolean {
		const q = query.toLowerCase();
		const isUrl = q.startsWith("http://") || q.startsWith("https://");
		return q.includes("youtube.com") || q.includes("youtu.be") || (!isUrl && q.includes("youtube"));
	}

	validate(url: string): boolean {
		try {
			const parsed = new URL(url);
			const allowedHosts = [
				'youtube.com',
				'www.youtube.com',
				'music.youtube.com',
				'youtu.be',
				'www.youtu.be'
			];
			return allowedHosts.includes(parsed.hostname.toLowerCase());
		} catch (e) {
			return false;
		}
	}

	async search(query: string, requestedBy: string): Promise<SearchResult> {
		await this.ready;

		if (this.validate(query)) {
			const listId = this.extractListId(query);
			if (listId) {
				try {
					const playlist: any = await (this.client as any).getPlaylist(listId);
					const videos: any[] = playlist?.videos || playlist?.items || [];

					const tracks: Track[] = videos.map((v: any) => {
						const id = v.id || v.video_id || v.videoId;
						const title = v.title?.text ?? v.title;
						const duration = toSeconds(v.duration?.text ?? v.duration);
						const thumb = v.thumbnails?.[0]?.url || v.thumbnail?.url;
						const author = v.author?.name ?? v.channel?.name;
						const views = v.view_count ?? v.views;

						return {
							id: String(id),
							title,
							url: `https://www.youtube.com/watch?v=${id}`,
							duration: Number(duration) || 0,
							thumbnail: thumb,
							requestedBy,
							source: this.name,
							metadata: { author, views, playlist: listId },
						} as Track;
					});

					return {
						tracks,
						playlist: {
							name: playlist?.title || playlist?.metadata?.title || `Playlist ${listId}`,
							url: query,
							thumbnail: playlist?.thumbnails?.[0]?.url || playlist?.thumbnail?.url,
						},
					};
				} catch {
					const withoutList = query.replace(/[?&]list=[^&]+/, "").replace(/[?&]$/, "");
					return await this.search(withoutList, requestedBy);
				}
			}

			const videoId = this.extractVideoId(query);
			if (!videoId) throw new Error("Invalid YouTube URL");

			const info = await this.client.getBasicInfo(videoId);
			const basic = (info as any).basic_info ?? {};

			const track: Track = {
				id: videoId,
				title: basic.title ?? (info as any).title ?? "Unknown title",
				url: `https://www.youtube.com/watch?v=${videoId}`,
				duration: toSeconds(basic.duration ?? (info as any).duration) ?? 0,
				thumbnail:
					basic.thumbnail?.[0]?.url || basic.thumbnail?.[basic.thumbnail?.length - 1]?.url || (info as any).thumbnails?.[0]?.url,
				requestedBy,
				source: this.name,
				metadata: {
					author: basic.author ?? (info as any).author?.name,
					views: (info as any).basic_info?.view_count ?? (info as any).view_count,
				},
			};

			return { tracks: [track] };
		}

		// Text search → return up to 10 video tracks
		const res: any = await this.searchClient.search(query, {
			type: "video" as any,
		});
		const items: any[] = res?.items || res?.videos || res?.results || [];

		const tracks: Track[] = items.slice(0, 10).map((v: any) => {
			const id = v.id || v.video_id || v.videoId || v.identifier;
			const title = v.title?.text ?? v.title ?? v.headline ?? "Unknown title";
			const duration = toSeconds(v.duration?.text ?? v.duration?.seconds ?? v.duration ?? v.length_text);
			const thumbnail = v.thumbnails?.[0]?.url || v.thumbnail?.url || v.thumbnail?.thumbnails?.[0]?.url;
			const author = v.author?.name ?? v.channel?.name ?? v.owner?.name;
			const views = v.view_count ?? v.views ?? v.short_view_count ?? v.stats?.view_count;

			const track: Track = {
				id: String(id),
				title,
				url: `https://www.youtube.com/watch?v=${id}`,
				duration: Number(duration) || 0,
				thumbnail,
				requestedBy,
				source: this.name,
				metadata: { author, views },
			};
			return track;
		});

		return { tracks };
	}

	async extractPlaylist(url: string, requestedBy: string): Promise<Track[]> {
		await this.ready;

		const listId = this.extractListId(url);
		if (!listId) return [];

		try {
			const playlist: any = await (this.client as any).getPlaylist(listId);
			const videos: any[] = playlist?.videos || playlist?.items || [];

			return videos.map((v: any) => {
				const id = v.id || v.video_id || v.videoId;
				const title = v.title?.text ?? v.title;
				const duration = toSeconds(v.duration?.text ?? v.duration);
				const thumb = v.thumbnails?.[0]?.url || v.thumbnail?.url;
				const author = v.author?.name ?? v.channel?.name;
				const views = v.view_count ?? v.views;

				const track: Track = {
					id: String(id),
					title,
					url: `https://www.youtube.com/watch?v=${id}`,
					duration: Number(duration) || 0,
					thumbnail: thumb,
					requestedBy,
					source: this.name,
					metadata: { author, views, playlist: listId },
				};
				return track;
			});
		} catch {
			// If playlist fetch fails, return empty to keep optional contract intact
			return [];
		}
	}

	async getStream(track: Track): Promise<StreamInfo> {
		await this.ready;

		const id = this.extractVideoId(track.url) || track.id;

		if (!id) throw new Error("Invalid track id");

		try {
			const stream: any = await (this.client as any).download(id, {
				type: "audio",
				quality: "best",
			});
			return {
				stream,
				type: "arbitrary",
				metadata: track.metadata,
			};
		} catch (e: any) {
			try {
				const info: any = await (this.client as any).getBasicInfo(id);

				// Prefer m4a audio-only formats first
				let format: any = info?.chooseFormat?.({
					type: "audio",
					quality: "best",
				});
				if (!format && info?.formats?.length) {
					const audioOnly = info.formats.filter((f: any) => f.mime_type?.includes("audio"));
					audioOnly.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
					format = audioOnly[0];
				}

				if (!format) throw new Error("No audio format available");

				let url: string | undefined = undefined;
				if (typeof format.decipher === "function") {
					url = format.decipher((this.client as any).session.player);
				}
				if (!url) url = format.url;

				if (!url) throw new Error("No valid URL to decipher");
				const res = await fetch(url);

				if (!res.ok || !res.body) {
					throw new Error(`HTTP ${res.status}`);
				}

				return {
					stream: res.body as any,
					type: "arbitrary",
					metadata: {
						...track.metadata,
						itag: format.itag,
						mime: format.mime_type,
					},
				};
			} catch (inner: any) {
				throw new Error(`Failed to get YouTube stream: ${inner?.message || inner}`);
			}
		}
	}

	async getRelatedTracks(trackURL: string, opts: { limit?: number; offset?: number; history?: Track[] } = {}): Promise<Track[]> {
		await this.ready;
		const videoId = this.extractVideoId(trackURL);
		const info: any = await await (this.searchClient as any).getInfo(videoId);
		const related: any[] = info?.watch_next_feed || [];
		const offset = opts.offset ?? 0;
		const limit = opts.limit ?? 5;

		const relatedfilter = related.filter((tr: any) => !(opts?.history ?? []).some((t) => t.url === tr.url));

		return relatedfilter.slice(offset, offset + limit).map((v: any) => {
			const id = v.id || v.video_id || v.videoId || v.content_id;
			const videometa = v?.metadata;
			return {
				id: String(id),
				title: videometa.title.text ?? "Unknown title",
				url: `https://www.youtube.com/watch?v=${id}`,
				duration: Number(v.length_seconds || toSeconds(v.duration)) || 0,
				thumbnail: v.thumbnails?.[0]?.url || v.thumbnail?.url || v.content_image?.image?.[0]?.url,
				requestedBy: "auto",
				source: this.name,
				metadata: { author: v.author, views: v.view_count },
			} as Track;
		});
	}

	async getFallback(track: Track): Promise<StreamInfo> {
		try {
			const result = await this.search(track.title, track.requestedBy);
			const first = result.tracks[0];
			if (!first) throw new Error("No fallback track found");
			return await this.getStream(first);
		} catch (e: any) {
			throw new Error(`YouTube fallback search failed: ${e?.message || e}`);
		}
	}

	private extractVideoId(input: string): string | null {
		try {
			const u = new URL(input);
			const allowedShortHosts = ["youtu.be"];
			const allowedLongHosts = ["youtube.com", "www.youtube.com", "music.youtube.com", "m.youtube.com"];
			if (allowedShortHosts.includes(u.hostname)) {
				return u.pathname.split("/").filter(Boolean)[0] || null;
			}
			if (allowedLongHosts.includes(u.hostname)) {
				// watch?v=, shorts/, embed/
				if (u.searchParams.get("v")) return u.searchParams.get("v");
				const path = u.pathname;
				if (path.startsWith("/shorts/")) return path.replace("/shorts/", "");
				if (path.startsWith("/embed/")) return path.replace("/embed/", "");
			}
			return null;
		} catch {
			return null;
		}
	}

	private extractListId(input: string): string | null {
		try {
			const u = new URL(input);
			return u.searchParams.get("list");
		} catch {
			return null;
		}
	}
}
function toSeconds(d: any): number | undefined {
	if (typeof d === "number") return d;
	if (typeof d === "string") {
		// mm:ss or hh:mm:ss
		const parts = d.split(":").map(Number);
		if (parts.some((n) => Number.isNaN(n))) return undefined;
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		const asNum = Number(d);
		return Number.isFinite(asNum) ? asNum : undefined;
	}
	if (d && typeof d === "object") {
		if (typeof (d as any).seconds === "number") return (d as any).seconds;
		if (typeof (d as any).milliseconds === "number") return Math.floor((d as any).milliseconds / 1000);
	}
	return undefined;
}
