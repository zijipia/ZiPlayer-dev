/**
 * Test script for GitHub Actions workflows
 *
 * This script simulates the GitHub Actions environment locally
 * to test documentation generation workflows
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class GitHubActionsTester {
	constructor() {
		this.rootDir = path.resolve(__dirname, "../..");
		this.pageDir = path.resolve(__dirname, "..");
	}

	/**
	 * Test the generate API documentation workflow
	 */
	async testGenerateWorkflow() {
		console.log("🧪 Testing Generate API Documentation Workflow\n");

		try {
			// Step 1: Checkout code (simulated)
			console.log("1️⃣ Simulating checkout...");
			console.log("   ✅ Code already available locally");

			// Step 2: Setup Node.js (simulated)
			console.log("2️⃣ Simulating Node.js setup...");
			console.log("   ✅ Node.js already available");

			// Step 3: Install dependencies
			console.log("3️⃣ Installing dependencies...");
			execSync("npm ci", { cwd: this.pageDir, stdio: "inherit" });
			console.log("   ✅ Dependencies installed");

			// Step 4: Generate API Documentation
			console.log("4️⃣ Generating API documentation...");
			execSync("npm run docs:build", { cwd: this.pageDir, stdio: "inherit" });
			console.log("   ✅ Documentation generated");

			// Step 5: Check for changes
			console.log("5️⃣ Checking for changes...");
			const status = execSync("git status --porcelain", { encoding: "utf8" });
			if (status.trim()) {
				console.log("   ✅ Changes detected:");
				console.log(status);
			} else {
				console.log("   ℹ️  No changes detected");
			}

			console.log("\n✅ Generate workflow test completed successfully!");
		} catch (error) {
			console.error("❌ Generate workflow test failed:", error.message);
			throw error;
		}
	}

	/**
	 * Test the validate API documentation workflow
	 */
	async testValidateWorkflow() {
		console.log("🧪 Testing Validate API Documentation Workflow\n");

		try {
			// Step 1: Check if GeneratedApiContent.ts exists
			console.log("1️⃣ Checking for GeneratedApiContent.ts...");
			const generatedPath = path.join(this.pageDir, "components/GeneratedApiContent.ts");
			if (!fs.existsSync(generatedPath)) {
				throw new Error("GeneratedApiContent.ts not found");
			}
			console.log("   ✅ GeneratedApiContent.ts exists");

			// Step 2: Validate JSON structure
			console.log("2️⃣ Validating JSON structure...");
			const content = fs.readFileSync(generatedPath, "utf8");
			const match = content.match(/export const generatedApiContent = ({[\s\S]*});/);

			if (!match) {
				throw new Error("Could not parse generatedApiContent");
			}

			const apiContent = JSON.parse(match[1]);
			console.log("   ✅ JSON structure is valid");

			// Step 3: Validate required fields
			console.log("3️⃣ Validating required fields...");
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

			if (isValid) {
				console.log("   ✅ All API content validation passed");
				console.log(`   📊 Found ${Object.keys(apiContent).length} API items`);
			} else {
				throw new Error("API content validation failed");
			}

			// Step 4: Test documentation generation
			console.log("4️⃣ Testing documentation generation...");
			execSync("npm run docs:generate", { cwd: this.pageDir, stdio: "inherit" });
			console.log("   ✅ Documentation generation test passed");

			// Step 5: Check for JSDoc comments
			console.log("5️⃣ Checking for JSDoc comments...");
			this.checkJSDocComments();

			console.log("\n✅ Validate workflow test completed successfully!");
		} catch (error) {
			console.error("❌ Validate workflow test failed:", error.message);
			throw error;
		}
	}

	/**
	 * Check for JSDoc comments in source files
	 */
	checkJSDocComments() {
		const sourceDirs = ["core/src/structures", "core/src/types", "extension/src", "plugins/src"];

		for (const dir of sourceDirs) {
			const fullPath = path.join(this.rootDir, dir);
			if (fs.existsSync(fullPath)) {
				const files = fs.readdirSync(fullPath).filter((file) => file.endsWith(".ts"));
				for (const file of files) {
					const filePath = path.join(fullPath, file);
					const content = fs.readFileSync(filePath, "utf8");
					if (content.includes("/**") && content.includes("@example")) {
						console.log(`   ✅ ${dir}/${file} has JSDoc comments`);
					} else {
						console.log(`   ⚠️  ${dir}/${file} missing JSDoc comments`);
					}
				}
			}
		}
	}

	/**
	 * Test the update documentation workflow
	 */
	async testUpdateWorkflow() {
		console.log("🧪 Testing Update Documentation Workflow\n");

		try {
			// Step 1: Generate documentation
			console.log("1️⃣ Generating documentation...");
			execSync("npm run docs:build", { cwd: this.pageDir, stdio: "inherit" });
			console.log("   ✅ Documentation generated");

			// Step 2: Check for changes
			console.log("2️⃣ Checking for changes...");
			const status = execSync("git status --porcelain", { encoding: "utf8" });
			if (status.trim()) {
				console.log("   ✅ Changes detected:");
				console.log(status);
			} else {
				console.log("   ℹ️  No changes detected");
			}

			// Step 3: Simulate commit (dry run)
			console.log("3️⃣ Simulating commit...");
			if (status.trim()) {
				console.log("   📝 Would commit changes:");
				console.log("   git add page/components/GeneratedApiContent.ts");
				console.log("   git commit -m '🤖 Auto-update API documentation'");
			} else {
				console.log("   ℹ️  No changes to commit");
			}

			console.log("\n✅ Update workflow test completed successfully!");
		} catch (error) {
			console.error("❌ Update workflow test failed:", error.message);
			throw error;
		}
	}

	/**
	 * Run all tests
	 */
	async runAllTests() {
		console.log("🚀 Running All GitHub Actions Tests\n");

		try {
			await this.testGenerateWorkflow();
			console.log("");
			await this.testValidateWorkflow();
			console.log("");
			await this.testUpdateWorkflow();

			console.log("\n🎉 All tests completed successfully!");
			console.log("✅ GitHub Actions workflows are ready to use");
		} catch (error) {
			console.error("\n❌ Some tests failed:", error.message);
			process.exit(1);
		}
	}
}

// CLI interface
if (require.main === module) {
	const tester = new GitHubActionsTester();
	const command = process.argv[2];

	switch (command) {
		case "generate":
			tester.testGenerateWorkflow();
			break;
		case "validate":
			tester.testValidateWorkflow();
			break;
		case "update":
			tester.testUpdateWorkflow();
			break;
		case "all":
		default:
			tester.runAllTests();
			break;
	}
}

module.exports = GitHubActionsTester;
