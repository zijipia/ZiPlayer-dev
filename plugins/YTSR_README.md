# YTSRPlugin - Plugin Tìm Kiếm Nâng Cao YouTube

YTSRPlugin là một plugin mạnh mẽ cho ZiPlayer, cung cấp khả năng tìm kiếm nâng cao trên YouTube mà không cần tạo stream. Plugin
này sử dụng thư viện `youtube-sr` để tìm kiếm và trích xuất metadata từ YouTube.

## ✨ Tính Năng

- 🔍 **Tìm kiếm video nâng cao** với nhiều tùy chọn lọc
- 📋 **Tìm kiếm playlist** và channel
- 🎯 **Hỗ trợ nhiều loại tìm kiếm**: video, playlist, channel, hoặc tất cả
- ⏱️ **Lọc theo thời lượng**: short (< 4 phút), medium (4-20 phút), long (> 20 phút)
- 📅 **Lọc theo ngày upload**: hour, today, week, month, year
- 📊 **Sắp xếp kết quả**: relevance, uploadDate, viewCount, rating
- 🔗 **Hỗ trợ URL YouTube** trực tiếp
- 📱 **Metadata phong phú**: tác giả, lượt xem, mô tả, ngày upload, v.v.
- 🔄 **Video liên quan**: Tìm kiếm video liên quan cho một video cụ thể
- 🎵 **Mix Playlist**: Hỗ trợ xử lý YouTube Mix playlists (RD)
- ⚡ **Không streaming**: Chỉ trả về metadata, không tạo stream

## 🚀 Cài Đặt

```bash
npm install youtube-sr
```

## 📖 Cách Sử Dụng

### Khởi Tạo Plugin

```javascript
const { YTSRPlugin } = require("ziplayer/plugins");
const plugin = new YTSRPlugin();
```

### Tìm Kiếm Video Cơ Bản

```javascript
// Tìm kiếm video đơn giản
const result = await plugin.search("Never Gonna Give You Up", "user123");
console.log(`Tìm thấy ${result.tracks.length} video`);

result.tracks.forEach((track) => {
	console.log(`${track.title} - ${track.metadata?.author}`);
	console.log(`URL: ${track.url}`);
	console.log(`Thời lượng: ${track.duration}s`);
});
```

### Tìm Kiếm Với Tùy Chọn Nâng Cao

```javascript
// Tìm kiếm với các filter nâng cao
const advancedResult = await plugin.search("chill music", "user123", {
	limit: 10, // Số lượng kết quả tối đa
	duration: "medium", // Thời lượng: short, medium, long, all
	sortBy: "viewCount", // Sắp xếp: relevance, uploadDate, viewCount, rating
	uploadDate: "month", // Ngày upload: hour, today, week, month, year, all
	type: "video", // Loại: video, playlist, channel, all
});
```

### Tìm Kiếm Playlist

```javascript
// Tìm kiếm playlist
const playlistResult = await plugin.searchPlaylist("lofi hip hop", "user123", 5);
playlistResult.tracks.forEach((track) => {
	console.log(`Playlist: ${track.title}`);
	console.log(`Channel: ${track.metadata?.author}`);
	console.log(`Số video: ${track.metadata?.videoCount}`);
});
```

### Tìm Kiếm Channel

```javascript
// Tìm kiếm channel
const channelResult = await plugin.searchChannel("PewDiePie", "user123", 3);
channelResult.tracks.forEach((track) => {
	console.log(`Channel: ${track.title}`);
	console.log(`Subscribers: ${track.metadata?.subscriberCount}`);
	console.log(`URL: ${track.url}`);
});
```

### Tìm Kiếm Tất Cả Loại

```javascript
// Tìm kiếm tất cả loại (video, playlist, channel)
const allResult = await plugin.search("music", "user123", {
	type: "all",
	limit: 15,
});

allResult.tracks.forEach((track) => {
	const type = track.metadata?.type || "video";
	console.log(`[${type.toUpperCase()}] ${track.title}`);
});
```

### Xử Lý URL YouTube

```javascript
// Xử lý URL YouTube trực tiếp
const urlResult = await plugin.search("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "user123");
if (urlResult.tracks.length > 0) {
	const track = urlResult.tracks[0];
	console.log(`Video: ${track.title}`);
	console.log(`Tác giả: ${track.metadata?.author}`);
}
```

### Lấy Video Theo ID

```javascript
// Lấy video theo ID cụ thể
const video = await plugin.getVideoById("dQw4w9WgXcQ", "user123");
if (video) {
	console.log(`Video: ${video.title}`);
	console.log(`Tác giả: ${video.metadata?.author}`);
	console.log(`URL: ${video.url}`);
}
```

### Lấy Video Liên Quan

```javascript
// Lấy video liên quan cho một video cụ thể
const relatedTracks = await plugin.getRelatedTracks("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
	limit: 5, // Số lượng video liên quan tối đa
	offset: 0, // Bỏ qua N video đầu tiên
	history: [currentTrack], // Loại trừ các video đã phát
});

relatedTracks.forEach((track, index) => {
	console.log(`${index + 1}. ${track.title} - ${track.metadata?.author}`);
});
```

### Xử Lý Mix Playlist (RD)

```javascript
// Xử lý YouTube Mix playlist (RD)
const mixResult = await plugin.handleMixPlaylist(
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDMWGnHCaqxdU&start_radio=1",
	"user123",
	10, // Số lượng track tối đa
);

console.log(`Mix playlist: ${mixResult.playlist?.name}`);
console.log(`Tìm thấy ${mixResult.tracks.length} track trong Mix`);

mixResult.tracks.forEach((track, index) => {
	console.log(`${index + 1}. ${track.title} - ${track.metadata?.author}`);
});
```

## 📋 API Reference

### `search(query, requestedBy, options?)`

Tìm kiếm nội dung trên YouTube với các tùy chọn nâng cao.

**Tham số:**

- `query` (string): Query tìm kiếm hoặc URL YouTube
- `requestedBy` (string): ID của user yêu cầu tìm kiếm
- `options` (object, tùy chọn):
  - `limit` (number): Số lượng kết quả tối đa (mặc định: 10)
  - `type` (string): Loại tìm kiếm - "video", "playlist", "channel", "all" (mặc định: "video")
  - `duration` (string): Lọc theo thời lượng - "short", "medium", "long", "all" (mặc định: "all")
  - `sortBy` (string): Sắp xếp - "relevance", "uploadDate", "viewCount", "rating" (mặc định: "relevance")
  - `uploadDate` (string): Lọc theo ngày upload - "hour", "today", "week", "month", "year", "all" (mặc định: "all")

**Trả về:** `Promise<SearchResult>`

### `searchPlaylist(query, requestedBy, limit?)`

Tìm kiếm playlist trên YouTube.

**Tham số:**

- `query` (string): Query tìm kiếm playlist
- `requestedBy` (string): ID của user yêu cầu
- `limit` (number, tùy chọn): Số lượng playlist tối đa (mặc định: 5)

**Trả về:** `Promise<SearchResult>`

### `searchChannel(query, requestedBy, limit?)`

Tìm kiếm channel trên YouTube.

**Tham số:**

- `query` (string): Query tìm kiếm channel
- `requestedBy` (string): ID của user yêu cầu
- `limit` (number, tùy chọn): Số lượng channel tối đa (mặc định: 5)

**Trả về:** `Promise<SearchResult>`

### `getVideoById(videoId, requestedBy)`

Lấy thông tin video theo ID cụ thể.

**Tham số:**

- `videoId` (string): ID của video YouTube
- `requestedBy` (string): ID của user yêu cầu

**Trả về:** `Promise<Track | null>`

### `getRelatedTracks(trackURL, opts?)`

Lấy các video liên quan cho một video YouTube cụ thể.

**Tham số:**

- `trackURL` (string): URL của video YouTube để lấy video liên quan
- `opts` (object, tùy chọn):
  - `limit` (number): Số lượng video liên quan tối đa (mặc định: 5)
  - `offset` (number): Số lượng video bỏ qua từ đầu (mặc định: 0)
  - `history` (Track[]): Mảng các track để loại trừ khỏi kết quả

**Trả về:** `Promise<Track[]>`

### `handleMixPlaylist(mixUrl, requestedBy, limit?)`

Xử lý YouTube Mix playlist (RD) và tạo danh sách các video liên quan.

**Tham số:**

- `mixUrl` (string): URL của playlist Mix YouTube
- `requestedBy` (string): ID của user yêu cầu
- `limit` (number, tùy chọn): Số lượng track tối đa (mặc định: 10)

**Trả về:** `Promise<SearchResult>`

### `canHandle(query)`

Kiểm tra xem plugin có thể xử lý query này không.

**Tham số:**

- `query` (string): Query để kiểm tra

**Trả về:** `boolean`

### `validate(url)`

Xác thực URL YouTube.

**Tham số:**

- `url` (string): URL để xác thực

**Trả về:** `boolean`

## ⚠️ Lưu Ý Quan Trọng

- **KHÔNG hỗ trợ streaming**: Plugin này chỉ dành cho tìm kiếm metadata, không tạo stream audio
- **KHÔNG hỗ trợ fallback**: Không có phương thức fallback streaming
- **Chỉ metadata**: Trả về thông tin về video/playlist/channel, không phải audio stream
- **Sử dụng với plugin khác**: Có thể kết hợp với YouTubePlugin để có cả tìm kiếm nâng cao và streaming

## 🔧 Tích Hợp Với Plugin Khác

```javascript
const { YTSRPlugin, YouTubePlugin } = require("ziplayer/plugins");

// Sử dụng YTSRPlugin để tìm kiếm nâng cao
const ytsrPlugin = new YTSRPlugin();
const searchResult = await ytsrPlugin.search("music", "user123", {
	duration: "medium",
	sortBy: "viewCount",
});

// Lấy video liên quan
const relatedTracks = await ytsrPlugin.getRelatedTracks(searchResult.tracks[0].url, {
	limit: 3,
	history: searchResult.tracks,
});

// Sử dụng YouTubePlugin để tạo stream
const youtubePlugin = new YouTubePlugin();
const stream = await youtubePlugin.getStream(searchResult.tracks[0]);
```

## 🧪 Testing

```bash
# Chạy test cho YTSRPlugin
npm test tests/plugins/ytsrplugin.test.js
```

## 📝 Ví Dụ Hoàn Chỉnh

Xem file `examples/ytsr-example.js` để có ví dụ chi tiết về cách sử dụng plugin.

## 🤝 Đóng Góp

Nếu bạn muốn đóng góp vào plugin này, vui lòng:

1. Fork repository
2. Tạo branch mới cho feature
3. Commit changes
4. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.
