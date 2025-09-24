import { BasePlugin, Track, SearchResult } from "ziplayer";
import YouTube, { Video, Playlist, Channel } from "youtube-sr";

/**
 * Plugin YTSR để tìm kiếm nâng cao trên YouTube mà không cần tạo stream.
 *
 * Plugin này cung cấp các tính năng tìm kiếm nâng cao cho YouTube bao gồm:
 * - Tìm kiếm video với nhiều tùy chọn lọc
 * - Tìm kiếm playlist và channel
 * - Hỗ trợ các loại tìm kiếm khác nhau (video, playlist, channel)
 * - Không tạo stream, chỉ trả về metadata
 *
 * @example
 * const ytsrPlugin = new YTSRPlugin();
 *
 * // Tìm kiếm video
 * const videoResult = await ytsrPlugin.search("Never Gonna Give You Up", "user123");
 *
 * // Tìm kiếm playlist
 * const playlistResult = await ytsrPlugin.searchPlaylist("chill music playlist", "user123");
 *
 * // Tìm kiếm channel
 * const channelResult = await ytsrPlugin.searchChannel("PewDiePie", "user123");
 *
 * @since 1.0.0
 */
export class YTSRPlugin extends BasePlugin {
	name = "ytsr";
	version = "1.0.0";

	/**
	 * Tạo một instance mới của YTSRPlugin.
	 *
	 * Plugin này không cần khởi tạo bất kỳ client nào vì sử dụng youtube-sr
	 * để tìm kiếm thông tin từ YouTube.
	 *
	 * @example
	 * const plugin = new YTSRPlugin();
	 * // Plugin sẵn sàng sử dụng ngay lập tức
	 */
	constructor() {
		super();
	}

	/**
	 * Xác định xem plugin có thể xử lý query này không.
	 *
	 * @param query - Query tìm kiếm hoặc URL để kiểm tra
	 * @returns `true` nếu plugin có thể xử lý query, `false` nếu không
	 *
	 * @example
	 * plugin.canHandle("Never Gonna Give You Up"); // true
	 * plugin.canHandle("https://www.youtube.com/watch?v=dQw4w9WgXcQ"); // true
	 * plugin.canHandle("spotify:track:123"); // false
	 */
	canHandle(query: string): boolean {
		const q = (query || "").trim().toLowerCase();

		// Tránh xử lý các pattern rõ ràng cho các extractor khác
		if (q.startsWith("tts:") || q.startsWith("say ")) return false;
		if (q.startsWith("spotify:") || q.includes("open.spotify.com")) return false;
		if (q.includes("soundcloud")) return false;

		// Xử lý URL YouTube
		if (q.startsWith("http://") || q.startsWith("https://")) {
			try {
				const parsed = new URL(query);
				const allowedHosts = ["youtube.com", "www.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"];
				return allowedHosts.includes(parsed.hostname.toLowerCase());
			} catch (e) {
				return false;
			}
		}

		// Xử lý tất cả text khác như tìm kiếm YouTube
		return true;
	}

	/**
	 * Xác thực xem URL có phải là URL YouTube hợp lệ không.
	 *
	 * @param url - URL để xác thực
	 * @returns `true` nếu URL hợp lệ, `false` nếu không
	 *
	 * @example
	 * plugin.validate("https://www.youtube.com/watch?v=dQw4w9WgXcQ"); // true
	 * plugin.validate("https://youtu.be/dQw4w9WgXcQ"); // true
	 * plugin.validate("https://spotify.com/track/123"); // false
	 */
	validate(url: string): boolean {
		try {
			const parsed = new URL(url);
			const allowedHosts = ["youtube.com", "www.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be", "m.youtube.com"];
			return allowedHosts.includes(parsed.hostname.toLowerCase());
		} catch (e) {
			return false;
		}
	}

	/**
	 * Tìm kiếm video trên YouTube với các tùy chọn nâng cao.
	 *
	 * @param query - Query tìm kiếm
	 * @param requestedBy - ID của user yêu cầu tìm kiếm
	 * @param options - Tùy chọn tìm kiếm nâng cao
	 * @param options.limit - Số lượng kết quả tối đa (mặc định: 10)
	 * @param options.type - Loại tìm kiếm: "video", "playlist", "channel", "all" (mặc định: "video")
	 * @param options.duration - Lọc theo thời lượng: "short", "medium", "long", "all" (mặc định: "all")
	 * @param options.sortBy - Sắp xếp theo: "relevance", "uploadDate", "viewCount", "rating" (mặc định: "relevance")
	 * @param options.uploadDate - Lọc theo ngày upload: "hour", "today", "week", "month", "year", "all" (mặc định: "all")
	 * @returns SearchResult chứa các track được tìm thấy
	 *
	 * @example
	 * // Tìm kiếm video cơ bản
	 * const result = await plugin.search("Never Gonna Give You Up", "user123");
	 *
	 * // Tìm kiếm với tùy chọn nâng cao
	 * const advancedResult = await plugin.search("chill music", "user123", {
	 *   limit: 5,
	 *   duration: "medium",
	 *   sortBy: "viewCount",
	 *   uploadDate: "month"
	 * });
	 */
	async search(
		query: string,
		requestedBy: string,
		options: {
			limit?: number;
			type?: "video" | "playlist" | "channel" | "all";
			duration?: "short" | "medium" | "long" | "all";
			sortBy?: "relevance" | "uploadDate" | "viewCount" | "rating";
			uploadDate?: "hour" | "today" | "week" | "month" | "year" | "all";
		} = {},
	): Promise<SearchResult> {
		const { limit = 10, type = "video", duration = "all", sortBy = "relevance", uploadDate = "all" } = options;

		try {
			// Nếu là URL YouTube, xử lý như video đơn lẻ hoặc playlist Mix
			if (this.validate(query)) {
				const listId = this.extractListId(query);
				if (listId && this.isMixListId(listId)) {
					// Xử lý playlist Mix (RD)
					return await this.handleMixPlaylistInternal(query, requestedBy, limit);
				}

				const videoId = this.extractVideoId(query);
				if (videoId) {
					const video = await this.getVideoByIdInternal(videoId);
					if (video) {
						return {
							tracks: [this.buildTrackFromVideo(video, requestedBy)],
						};
					}
				}
			}

			// Tìm kiếm với youtube-sr
			const searchOptions: any = {
				limit,
				type: type === "all" ? "all" : type,
				safeSearch: false,
			};

			// Thêm các filter nâng cao
			if (duration !== "all") {
				searchOptions.duration = duration;
			}
			if (sortBy !== "relevance") {
				searchOptions.sortBy = sortBy;
			}
			if (uploadDate !== "all") {
				searchOptions.uploadDate = uploadDate;
			}

			const results = await YouTube.search(query, searchOptions);

			const tracks: Track[] = [];

			// Xử lý kết quả dựa trên loại tìm kiếm
			if (type === "video" || type === "all") {
				const videos = results.filter((item: any): item is Video => item instanceof Video);
				tracks.push(...videos.slice(0, limit).map((video: Video) => this.buildTrackFromVideo(video, requestedBy)));
			}

			if (type === "playlist" || type === "all") {
				const playlists = results.filter((item: any): item is Playlist => item instanceof Playlist);
				// Chuyển đổi playlist thành tracks
				playlists.slice(0, Math.floor(limit / 2)).forEach((playlist: any) => {
					tracks.push(this.buildTrackFromPlaylist(playlist, requestedBy));
				});
			}

			if (type === "channel" || type === "all") {
				const channels = results.filter((item: any): item is Channel => item instanceof Channel);
				// Chuyển đổi channel thành tracks (lấy video mới nhất)
				channels.slice(0, Math.floor(limit / 3)).forEach((channel: any) => {
					tracks.push(this.buildTrackFromChannel(channel, requestedBy));
				});
			}

			return { tracks: tracks.slice(0, limit) };
		} catch (error: any) {
			throw new Error(`YTSR search failed: ${error?.message || error}`);
		}
	}

	/**
	 * Tìm kiếm playlist trên YouTube.
	 *
	 * @param query - Query tìm kiếm playlist
	 * @param requestedBy - ID của user yêu cầu tìm kiếm
	 * @param limit - Số lượng playlist tối đa (mặc định: 5)
	 * @returns SearchResult chứa các playlist được tìm thấy
	 *
	 * @example
	 * const playlists = await plugin.searchPlaylist("chill music playlist", "user123", 3);
	 * console.log(`Tìm thấy ${playlists.tracks.length} playlist`);
	 */
	async searchPlaylist(query: string, requestedBy: string, limit: number = 5): Promise<SearchResult> {
		return this.search(query, requestedBy, { type: "playlist", limit });
	}

	/**
	 * Tìm kiếm channel trên YouTube.
	 *
	 * @param query - Query tìm kiếm channel
	 * @param requestedBy - ID của user yêu cầu tìm kiếm
	 * @param limit - Số lượng channel tối đa (mặc định: 5)
	 * @returns SearchResult chứa các channel được tìm thấy
	 *
	 * @example
	 * const channels = await plugin.searchChannel("PewDiePie", "user123", 3);
	 * console.log(`Tìm thấy ${channels.tracks.length} channel`);
	 */
	async searchChannel(query: string, requestedBy: string, limit: number = 5): Promise<SearchResult> {
		return this.search(query, requestedBy, { type: "channel", limit });
	}

	/**
	 * Tìm kiếm video theo ID cụ thể.
	 *
	 * @param videoId - ID của video YouTube
	 * @param requestedBy - ID của user yêu cầu
	 * @returns Track object của video
	 *
	 * @example
	 * const video = await plugin.getVideoById("dQw4w9WgXcQ", "user123");
	 * console.log(video.title);
	 */
	async getVideoById(videoId: string, requestedBy: string): Promise<Track | null> {
		try {
			const video = await this.getVideoByIdInternal(videoId);
			return video ? this.buildTrackFromVideo(video, requestedBy) : null;
		} catch (error: any) {
			throw new Error(`Failed to get video by ID: ${error?.message || error}`);
		}
	}

	/**
	 * Lấy thông tin chi tiết của video từ ID.
	 *
	 * @param videoId - ID của video YouTube
	 * @returns Video object hoặc null nếu không tìm thấy
	 */
	private async getVideoByIdInternal(videoId: string): Promise<Video | null> {
		try {
			const results = await YouTube.search(`https://www.youtube.com/watch?v=${videoId}`, { limit: 1, type: "video" });
			const video = results.find((item: any): item is Video => item instanceof Video);
			return video || null;
		} catch {
			return null;
		}
	}

	/**
	 * Xây dựng Track object từ Video object của youtube-sr.
	 *
	 * @param video - Video object từ youtube-sr
	 * @param requestedBy - ID của user yêu cầu
	 * @returns Track object
	 */
	private buildTrackFromVideo(video: Video, requestedBy: string): Track {
		// Xử lý duration một cách an toàn
		let duration = 0;
		if (video.duration) {
			if (typeof video.duration === "number") {
				duration = video.duration;
			} else if (typeof video.duration === "object" && video.duration !== null) {
				// Nếu duration là object, thử lấy seconds
				duration = (video.duration as any)?.seconds || (video.duration as any)?.totalSeconds || 0;
			}
		}

		// youtube-sr trả về duration theo milliseconds, chuyển thành seconds
		if (duration > 0) {
			// Nếu duration lớn hơn 1000, có thể là milliseconds
			if (duration > 1000) {
				duration = Math.floor(duration / 1000);
			}
		}

		return {
			id: video.id,
			title: video.title,
			url: video.url,
			duration: Math.max(0, duration), // Đảm bảo duration không âm
			thumbnail: video.thumbnail?.url || (video as any).thumbnails?.[0]?.url,
			requestedBy,
			source: this.name,
			metadata: {
				author: video.channel?.name,
				views: video.views,
				description: video.description,
				publishedAt: video.uploadedAt,
				channelUrl: video.channel?.url,
				channelId: video.channel?.id,
			},
		} as Track;
	}

	/**
	 * Xây dựng Track object từ Playlist object của youtube-sr.
	 *
	 * @param playlist - Playlist object từ youtube-sr
	 * @param requestedBy - ID của user yêu cầu
	 * @returns Track object
	 */
	private buildTrackFromPlaylist(playlist: Playlist, requestedBy: string): Track {
		return {
			id: playlist.id,
			title: playlist.title,
			url: playlist.url,
			duration: 0, // Playlist không có duration cố định
			thumbnail: playlist.thumbnail?.url || (playlist as any).thumbnails?.[0]?.url,
			requestedBy,
			source: this.name,
			metadata: {
				author: playlist.channel?.name,
				views: playlist.views,
				description: (playlist as any).description,
				publishedAt: (playlist as any).uploadedAt,
				channelUrl: playlist.channel?.url,
				channelId: playlist.channel?.id,
				videoCount: playlist.videoCount,
				type: "playlist",
			},
		} as Track;
	}

	/**
	 * Xây dựng Track object từ Channel object của youtube-sr.
	 *
	 * @param channel - Channel object từ youtube-sr
	 * @param requestedBy - ID của user yêu cầu
	 * @returns Track object
	 */
	private buildTrackFromChannel(channel: Channel, requestedBy: string): Track {
		return {
			id: channel.id,
			title: channel.name,
			url: channel.url,
			duration: 0, // Channel không có duration
			thumbnail: (channel as any).thumbnail?.url || (channel as any).thumbnails?.[0]?.url,
			requestedBy,
			source: this.name,
			metadata: {
				author: channel.name,
				views: channel.subscribers,
				description: (channel as any).description,
				publishedAt: (channel as any).joinedAt,
				channelUrl: channel.url,
				channelId: channel.id,
				subscriberCount: channel.subscribers,
				type: "channel",
			},
		} as Track;
	}

	/**
	 * Xử lý playlist Mix (RD) của YouTube (internal).
	 *
	 * @param url - URL của playlist Mix
	 * @param requestedBy - ID của user yêu cầu
	 * @param limit - Số lượng track tối đa
	 * @returns SearchResult chứa các track từ Mix
	 */
	private async handleMixPlaylistInternal(url: string, requestedBy: string, limit: number): Promise<SearchResult> {
		try {
			const videoId = this.extractVideoId(url);
			if (!videoId) {
				throw new Error("Không thể trích xuất video ID từ URL Mix");
			}

			// Lấy thông tin video gốc
			const anchorVideo = await this.getVideoByIdInternal(videoId);
			if (!anchorVideo) {
				throw new Error("Không thể lấy thông tin video gốc");
			}

			// Tìm kiếm các video liên quan để tạo Mix
			const searchQuery = `${anchorVideo.title} ${anchorVideo.channel?.name || ""}`;
			const searchResult = await this.search(searchQuery, requestedBy, {
				limit: limit + 5, // Lấy thêm để có thể lọc
				type: "video",
			});

			// Lọc và sắp xếp kết quả để tạo Mix
			const mixTracks = searchResult.tracks
				.filter((track) => track.id !== videoId) // Loại bỏ video gốc
				.slice(0, limit);

			// Thêm video gốc vào đầu Mix
			const anchorTrack = this.buildTrackFromVideo(anchorVideo, requestedBy);
			mixTracks.unshift(anchorTrack);

			return {
				tracks: mixTracks.slice(0, limit),
				playlist: {
					name: `YouTube Mix - ${anchorVideo.title}`,
					url: url,
					thumbnail: anchorVideo.thumbnail?.url || (anchorVideo as any).thumbnails?.[0]?.url,
				},
			};
		} catch (error: any) {
			throw new Error(`Failed to handle Mix playlist: ${error?.message || error}`);
		}
	}

	/**
	 * Kiểm tra xem listId có phải là Mix playlist không.
	 *
	 * @param listId - ID của playlist
	 * @returns true nếu là Mix playlist
	 */
	private isMixListId(listId: string): boolean {
		// YouTube Mix playlists thường bắt đầu với 'RD'
		return typeof listId === "string" && listId.toUpperCase().startsWith("RD");
	}

	/**
	 * Trích xuất playlist ID từ URL YouTube.
	 *
	 * @param input - URL chứa playlist ID
	 * @returns Playlist ID hoặc null nếu không tìm thấy
	 */
	private extractListId(input: string): string | null {
		try {
			const u = new URL(input);
			return u.searchParams.get("list");
		} catch {
			return null;
		}
	}

	/**
	 * Trích xuất video ID từ URL YouTube.
	 *
	 * @param input - URL hoặc string chứa video ID
	 * @returns Video ID hoặc null nếu không tìm thấy
	 */
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

	/**
	 * Plugin này không hỗ trợ tạo stream, chỉ dành cho tìm kiếm metadata.
	 *
	 * @param track - Track object
	 * @throws Error vì plugin này không hỗ trợ streaming
	 */
	async getStream(track: Track): Promise<any> {
		throw new Error("YTSRPlugin không hỗ trợ streaming. Plugin này chỉ dành cho tìm kiếm metadata.");
	}

	/**
	 * Xử lý playlist Mix (RD) của YouTube.
	 *
	 * @param mixUrl - URL của playlist Mix YouTube
	 * @param requestedBy - ID của user yêu cầu
	 * @param limit - Số lượng track tối đa (mặc định: 10)
	 * @returns SearchResult chứa các track từ Mix playlist
	 *
	 * @example
	 * const mixResult = await plugin.handleMixPlaylist(
	 *   "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDMWGnHCaqxdU&start_radio=1",
	 *   "user123",
	 *   15
	 * );
	 * console.log(`Mix playlist: ${mixResult.playlist?.name}`);
	 * console.log(`Tìm thấy ${mixResult.tracks.length} track trong Mix`);
	 */
	async handleMixPlaylist(mixUrl: string, requestedBy: string, limit: number = 10): Promise<SearchResult> {
		return this.handleMixPlaylistInternal(mixUrl, requestedBy, limit);
	}

	/**
	 * Lấy các video liên quan cho một video YouTube cụ thể.
	 *
	 * @param trackURL - URL của video YouTube để lấy video liên quan
	 * @param opts - Tùy chọn cho việc lọc và giới hạn kết quả
	 * @param opts.limit - Số lượng video liên quan tối đa (mặc định: 5)
	 * @param opts.offset - Số lượng video bỏ qua từ đầu (mặc định: 0)
	 * @param opts.history - Mảng các track để loại trừ khỏi kết quả
	 * @returns Mảng các Track object liên quan
	 *
	 * @example
	 * const related = await plugin.getRelatedTracks(
	 *   "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	 *   { limit: 3, history: [currentTrack] }
	 * );
	 * console.log(`Tìm thấy ${related.length} video liên quan`);
	 */
	async getRelatedTracks(trackURL: string, opts: { limit?: number; offset?: number; history?: Track[] } = {}): Promise<Track[]> {
		const { limit = 5, offset = 0, history = [] } = opts;

		try {
			const videoId = this.extractVideoId(trackURL);
			if (!videoId) {
				throw new Error("Không thể trích xuất video ID từ URL");
			}

			// Tìm kiếm video liên quan bằng cách tìm kiếm với title của video hiện tại
			const currentVideo = await this.getVideoByIdInternal(videoId);
			if (!currentVideo) {
				throw new Error("Không thể lấy thông tin video hiện tại");
			}

			// Tìm kiếm các video liên quan dựa trên title và channel
			const searchQuery = `${currentVideo.title} ${currentVideo.channel?.name || ""}`;
			const searchResult = await this.search(searchQuery, "auto", {
				limit: limit + offset + history.length,
				type: "video",
			});

			// Lọc ra video hiện tại và các video trong history
			const filteredTracks = searchResult.tracks.filter((track) => {
				// Loại bỏ video hiện tại
				if (track.id === videoId) return false;

				// Loại bỏ các video trong history
				if (history.some((h) => h.id === track.id || h.url === track.url)) return false;

				return true;
			});

			// Áp dụng offset và limit
			return filteredTracks.slice(offset, offset + limit);
		} catch (error: any) {
			throw new Error(`Failed to get related tracks: ${error?.message || error}`);
		}
	}

	/**
	 * Plugin này không hỗ trợ fallback stream.
	 *
	 * @param track - Track object
	 * @throws Error vì plugin này không hỗ trợ streaming
	 */
	async getFallback(track: Track): Promise<any> {
		throw new Error("YTSRPlugin không hỗ trợ fallback streaming. Plugin này chỉ dành cho tìm kiếm metadata.");
	}
}
