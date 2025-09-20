/**
 * Example usage của API Documentation Generator
 *
 * File này demo cách sử dụng hệ thống tự động sinh API documentation
 */

const ApiDocsBuilder = require("./buildApiDocs");
const JSDocAdder = require("./addJSDocComments");
const ApiContentGenerator = require("./generateApiContent");

async function exampleUsage() {
	console.log("🎯 Example Usage của API Documentation Generator\n");

	// 1. Thêm JSDoc comments vào code
	console.log("1️⃣ Thêm JSDoc comments vào code...");
	const jsdocAdder = new JSDocAdder();
	jsdocAdder.run();
	console.log("✅ JSDoc comments đã được thêm vào code\n");

	// 2. Generate API content từ code
	console.log("2️⃣ Generate API content từ code...");
	const generator = new ApiContentGenerator();
	const generatedContent = generator.generate();
	console.log("✅ Generated content:", Object.keys(generatedContent));
	console.log("");

	// 3. Build documentation hoàn chỉnh
	console.log("3️⃣ Build documentation hoàn chỉnh...");
	const builder = new ApiDocsBuilder();
	await builder.build();
	console.log("✅ Documentation đã được build thành công\n");

	// 4. Demo watch mode
	console.log("4️⃣ Demo watch mode (chạy 5 giây rồi dừng)...");
	console.log("   - Thay đổi file trong core/, extension/, plugins/");
	console.log("   - Documentation sẽ tự động rebuild");
	console.log("   - Nhấn Ctrl+C để dừng\n");

	// Chạy watch mode trong 5 giây
	const watchPromise = new Promise((resolve) => {
		const builder = new ApiDocsBuilder();
		builder.watch();

		// Dừng sau 5 giây
		setTimeout(() => {
			console.log("\n⏰ Demo watch mode kết thúc");
			resolve();
		}, 5000);
	});

	await watchPromise;
}

// Chạy example
if (require.main === module) {
	exampleUsage().catch(console.error);
}

module.exports = { exampleUsage };
