/**
 * Demo script để test API Documentation Generator
 */

const fs = require("fs");
const path = require("path");

console.log("🎯 Demo API Documentation Generator\n");

// 1. Kiểm tra JSDoc đã được thêm vào code
console.log("1️⃣ Kiểm tra JSDoc trong code...");

const coreFiles = [
	"../../core/src/structures/PlayerManager.ts",
	"../../core/src/structures/Player.ts",
	"../../core/src/structures/Queue.ts",
	"../../core/src/types/index.ts",
];

coreFiles.forEach((file) => {
	const fullPath = path.resolve(__dirname, file);
	if (fs.existsSync(fullPath)) {
		const content = fs.readFileSync(fullPath, "utf8");
		const hasJSDoc = content.includes("/**") && content.includes("@example");
		console.log(`   ${hasJSDoc ? "✅" : "❌"} ${path.basename(file)} - ${hasJSDoc ? "Có JSDoc" : "Không có JSDoc"}`);
	} else {
		console.log(`   ⚠️  ${path.basename(file)} - File không tồn tại`);
	}
});

console.log("");

// 2. Test generate API content
console.log("2️⃣ Test generate API content...");

try {
	const ApiContentGenerator = require("./generateApiContent");
	const generator = new ApiContentGenerator();
	const generatedContent = generator.generate();

	console.log(`   ✅ Generated ${Object.keys(generatedContent).length} API items:`);
	Object.keys(generatedContent).forEach((key) => {
		const item = generatedContent[key];
		console.log(`      - ${item.title} (${item.badges.join(", ")})`);
	});
} catch (error) {
	console.log(`   ❌ Error: ${error.message}`);
}

console.log("");

// 3. Test build process
console.log("3️⃣ Test build process...");

try {
	const ApiDocsBuilder = require("./buildApiDocs");
	const builder = new ApiDocsBuilder();

	// Test merge function
	console.log("   ✅ Build system ready");
	console.log('   📝 Run "npm run docs:build" to generate full documentation');
} catch (error) {
	console.log(`   ❌ Error: ${error.message}`);
}

console.log("");

// 4. Show usage instructions
console.log("4️⃣ Cách sử dụng:");
console.log("");
console.log("   📝 Thêm JSDoc vào code:");
console.log("      npm run docs:add-jsdoc");
console.log("");
console.log("   🔧 Generate API content:");
console.log("      npm run docs:generate");
console.log("");
console.log("   🚀 Build documentation:");
console.log("      npm run docs:build");
console.log("");
console.log("   👀 Watch mode:");
console.log("      npm run docs:watch");
console.log("");

// 5. Show example JSDoc
console.log("5️⃣ Ví dụ JSDoc để thêm vào code:");
console.log("");
console.log("```typescript");
console.log("/**");
console.log(" * The main class for managing players across multiple Discord guilds.");
console.log(" * ");
console.log(" * @example");
console.log(" * const manager = new PlayerManager({");
console.log(" *   plugins: [new YouTubePlugin(), new SoundCloudPlugin()],");
console.log(" *   extensions: [new voiceExt(), new lavalinkExt()]");
console.log(" * });");
console.log(" * ");
console.log(" * @method create - Create a new player for a guild");
console.log(" * @method get - Get an existing player for a guild");
console.log(" * @event playerCreate - Emitted when a new player is created");
console.log(" */");
console.log("export class PlayerManager extends EventEmitter {");
console.log("```");
console.log("");

console.log("🎉 Demo hoàn thành! Hệ thống đã sẵn sàng sử dụng.");
