# API Documentation Generator

Hệ thống tự động sinh API documentation từ JSDoc comments trong code.

## 🚀 Cách sử dụng

### 1. Thêm JSDoc comments vào code

Chỉ cần thêm JSDoc comments vào code của bạn:

```typescript
/**
 * The main class for managing players across multiple Discord guilds.
 *
 * @example
 * const manager = new PlayerManager({
 *   plugins: [new YouTubePlugin(), new SoundCloudPlugin()],
 *   extensions: [new voiceExt(), new lavalinkExt()]
 * });
 *
 * @method create - Create a new player for a guild
 * @method get - Get an existing player for a guild
 * @method destroy - Destroy a player and clean up resources
 * @event playerCreate - Emitted when a new player is created
 * @event playerDestroy - Emitted when a player is destroyed
 */
export class PlayerManager extends EventEmitter {
	/**
	 * Create a new player for a guild
	 *
	 * @param {string | {id: string}} guildOrId - Guild ID or guild object
	 * @param {PlayerOptions} options - Player configuration options
	 * @returns {Promise<Player>} The created player instance
	 * @example
	 * const player = await manager.create(guildId, {
	 *   tts: { interrupt: true, volume: 1 },
	 *   leaveOnEnd: true,
	 *   leaveTimeout: 30000
	 * });
	 */
	async create(guildOrId: string | { id: string }, options?: PlayerOptions): Promise<Player> {
		// implementation
	}
}
```

### 2. Chạy generator

```bash
# Build documentation một lần
npm run docs:build

# Watch mode - tự động rebuild khi có thay đổi
npm run docs:watch

# Chỉ thêm JSDoc comments vào code
npm run docs:add-jsdoc

# Chỉ generate API content
npm run docs:generate
```

## 📁 Cấu trúc files

```
page/scripts/
├── README.md                 # Hướng dẫn này
├── addJSDocComments.js      # Script thêm JSDoc vào code
├── generateApiContent.js    # Script sinh API content
└── buildApiDocs.js         # Script build chính
```

## 🔧 JSDoc Tags được hỗ trợ

### Class/Interface Tags

- `@example` - Code example
- `@method` - Method description
- `@event` - Event description

### Method Tags

- `@param {type} name - Description`
- `@returns {type} Description`
- `@example` - Method example

### Event Tags

- `@event name - Description`
- `@param {type} name - Description`

## 📝 Ví dụ JSDoc

### Class với methods và events

```typescript
/**
 * Represents a music player for a specific Discord guild.
 *
 * @example
 * const player = await manager.create(guildId, {
 *   tts: { interrupt: true, volume: 1 },
 *   leaveOnEnd: true,
 *   leaveTimeout: 30000
 * });
 *
 * @method connect - Connect to a voice channel
 * @method play - Play a track or search query
 * @method pause - Pause the current track
 * @event trackStart - Emitted when a track starts playing
 * @event trackEnd - Emitted when a track ends
 */
export class Player {
	/**
	 * Connect to a voice channel
	 *
	 * @param {VoiceChannel} channel - Discord voice channel
	 * @returns {Promise<void>}
	 * @example
	 * await player.connect(voiceChannel);
	 */
	async connect(channel: VoiceChannel): Promise<void> {
		// implementation
	}
}
```

### Interface với properties

```typescript
/**
 * Represents a music track with metadata and streaming information.
 *
 * @example
 * const track: Track = {
 *   id: "dQw4w9WgXcQ",
 *   title: "Never Gonna Give You Up",
 *   url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
 *   duration: 212000,
 *   requestedBy: "123456789",
 *   source: "youtube"
 * };
 */
export interface Track {
	id: string;
	title: string;
	url: string;
	duration: number;
	requestedBy: string;
	source: string;
}
```

## 🎯 Workflow

1. **Thêm JSDoc** vào code của bạn
2. **Chạy `npm run docs:build`** để sinh documentation
3. **Kiểm tra** file `GeneratedApiContent.ts` được tạo
4. **Sử dụng** trong `ApiContent.tsx` nếu cần

## 🔄 Watch Mode

Sử dụng `npm run docs:watch` để tự động rebuild khi có thay đổi trong:

- `core/src/**/*.ts`
- `extension/src/**/*.ts`
- `plugins/src/**/*.ts`

## ⚙️ Tùy chỉnh

### Thêm file mới vào generator

Chỉnh sửa `generateApiContent.js`:

```javascript
const coreFiles = [
	"../core/src/structures/PlayerManager.ts",
	"../core/src/structures/Player.ts",
	"../core/src/structures/Queue.ts",
	"../core/src/types/index.ts",
	// Thêm file mới ở đây
	"../core/src/your-new-file.ts",
];
```

### Tùy chỉnh JSDoc templates

Chỉnh sửa `addJSDocComments.js`:

```javascript
this.templates = {
	class: `/**
 * {description}
 * 
 * @example
 * {example}
 */`,
	// Thêm template mới
};
```

## 🐛 Troubleshooting

### Lỗi "Cannot find module"

```bash
npm install
```

### JSDoc không được parse

Kiểm tra format JSDoc có đúng không:

- Bắt đầu với `/**`
- Kết thúc với `*/`
- Mỗi dòng bắt đầu với ` *`

### Generated content không đúng

1. Kiểm tra JSDoc format
2. Chạy `npm run docs:add-jsdoc` để thêm JSDoc mẫu
3. Chạy `npm run docs:generate` để test

## 📚 Tài liệu tham khảo

- [JSDoc Documentation](https://jsdoc.app/)
- [TypeScript JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
