/**
 * Script để fix JSON trong ApiContent.tsx
 */

const fs = require("fs");
const path = require("path");

function fixJsonInFile(filePath) {
	console.log(`🔧 Fixing JSON in ${filePath}...`);

	const content = fs.readFileSync(filePath, "utf8");

	// Tìm và fix các vấn đề JSON phổ biến
	let fixedContent = content
		// Fix trailing commas
		.replace(/,(\s*[}\]])/g, "$1")
		// Fix unescaped quotes in strings
		.replace(/([^\\])"/g, '$1\\"')
		// Fix newlines in strings
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t");

	// Validate JSON
	try {
		const match = fixedContent.match(/const apiContent = ({[\s\S]*});/);
		if (match) {
			JSON.parse(match[1]);
			console.log("✅ JSON is now valid");
		}
	} catch (error) {
		console.error("❌ JSON still invalid:", error.message);
		return false;
	}

	fs.writeFileSync(filePath, fixedContent);
	return true;
}

// Fix ApiContent.tsx
const apiContentPath = path.resolve(__dirname, "../components/ApiContent.tsx");
if (fs.existsSync(apiContentPath)) {
	fixJsonInFile(apiContentPath);
} else {
	console.log("❌ ApiContent.tsx not found");
}
