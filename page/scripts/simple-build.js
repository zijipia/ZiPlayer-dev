/**
 * Simple build script for GitHub Actions
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class SimpleBuilder {
	constructor() {
		this.rootDir = path.resolve(__dirname, "../..");
		this.pageDir = path.resolve(__dirname, "..");
	}

	async build() {
		console.log("🚀 Simple API Documentation Build\n");

		try {
			// Step 1: Add JSDoc comments
			console.log("📝 Step 1: Adding JSDoc comments...");
			execSync("node scripts/addJSDocComments.js", { cwd: this.pageDir, stdio: "inherit" });
			console.log("✅ JSDoc comments added\n");

			// Step 2: Generate API content
			console.log("🔧 Step 2: Generating API content...");
			execSync("node scripts/generateApiContent.js", { cwd: this.pageDir, stdio: "inherit" });
			console.log("✅ API content generated\n");

			// Step 3: Validate generated content
			console.log("✅ Step 3: Validating generated content...");
			this.validateGeneratedContent();
			console.log("✅ Content validated\n");

			console.log("🎉 Simple build completed successfully!");
		} catch (error) {
			console.error("❌ Build failed:", error.message);
			process.exit(1);
		}
	}

	validateGeneratedContent() {
		const generatedPath = path.join(this.pageDir, "components/GeneratedApiContent.ts");

		if (!fs.existsSync(generatedPath)) {
			throw new Error("GeneratedApiContent.ts not found");
		}

		const content = fs.readFileSync(generatedPath, "utf8");
		const match = content.match(/export const generatedApiContent = ({[\s\S]*});/);

		if (!match) {
			throw new Error("Could not parse generatedApiContent");
		}

		try {
			const apiContent = JSON.parse(match[1]);
			console.log(`   📊 Found ${Object.keys(apiContent).length} API items`);

			// Validate required fields
			const requiredFields = ["title", "description", "badges", "code"];
			let isValid = true;

			for (const [key, value] of Object.entries(apiContent)) {
				if (typeof value !== "object" || value === null) {
					console.error(`   ❌ Invalid content for ${key}: not an object`);
					isValid = false;
					continue;
				}

				for (const field of requiredFields) {
					if (!(field in value)) {
						console.error(`   ❌ Missing required field '${field}' in ${key}`);
						isValid = false;
					}
				}
			}

			if (!isValid) {
				throw new Error("Content validation failed");
			}
		} catch (error) {
			throw new Error(`JSON validation failed: ${error.message}`);
		}
	}
}

// Run build
if (require.main === module) {
	const builder = new SimpleBuilder();
	builder.build();
}

module.exports = SimpleBuilder;
