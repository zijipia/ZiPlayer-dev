const fs = require("fs");
const path = require("path");

/**
 * API Content Generator
 * Tự động sinh API content từ JSDoc comments trong code
 */

class ApiContentGenerator {
	constructor() {
		this.apiContent = {};
	}

	/**
	 * Parse JSDoc comment và extract thông tin
	 */
	parseJSDoc(comment) {
		const lines = comment.split("\n").map((line) => line.trim().replace(/^\*\s?/, ""));
		const result = {
			description: "",
			example: "",
			methods: [],
			events: [],
			properties: [],
		};

		let currentSection = "description";
		let currentMethod = null;
		let currentEvent = null;
		let currentProperty = null;
		let inExample = false;
		let exampleLines = [];

		for (const line of lines) {
			// Skip empty lines and comment markers
			if (!line || line === "/**" || line === "*/") continue;

			if (line.startsWith("@example")) {
				currentSection = "example";
				inExample = true;
				const exampleText = line.replace("@example", "").trim();
				if (exampleText) {
					exampleLines.push(exampleText);
				}
				continue;
			}

			if (line.startsWith("@method")) {
				currentSection = "methods";
				inExample = false;
				const methodInfo = line.replace("@method", "").trim();
				const [name, signature] = methodInfo.split(" - ");
				currentMethod = {
					name: name?.trim() || "",
					signature: signature?.trim() || "",
					description: "",
					example: "",
				};
				result.methods.push(currentMethod);
				continue;
			}

			if (line.startsWith("@event")) {
				currentSection = "events";
				inExample = false;
				const eventInfo = line.replace("@event", "").trim();
				const [name, description] = eventInfo.split(" - ");
				currentEvent = {
					name: name?.trim() || "",
					description: description?.trim() || "",
					parameters: [],
				};
				result.events.push(currentEvent);
				continue;
			}

			if (line.startsWith("@param")) {
				if (currentMethod) {
					const paramInfo = line.replace("@param", "").trim();
					// Parse param với format {type} name - description
					const paramMatch = paramInfo.match(/\{([^}]+)\}\s+(\w+)\s*-\s*(.*)/);
					if (paramMatch) {
						if (!currentMethod.parameters) currentMethod.parameters = [];
						currentMethod.parameters.push({
							name: paramMatch[2],
							type: paramMatch[1],
							description: paramMatch[3] || "",
						});
					} else {
						// Fallback cho format cũ
						const [type, name, description] = paramInfo.split(" ");
						if (!currentMethod.parameters) currentMethod.parameters = [];
						currentMethod.parameters.push({
							name: name?.replace("{", "").replace("}", "") || "",
							type: type?.replace("{", "").replace("}", "") || "",
							description: description || "",
						});
					}
				}
				continue;
			}

			if (line.startsWith("@returns") || line.startsWith("@return")) {
				if (currentMethod) {
					currentMethod.returns = line.replace(/@returns?/, "").trim();
				}
				continue;
			}

			// Nếu đang trong example block
			if (inExample) {
				exampleLines.push(line);
				continue;
			}

			// Nếu không phải tag, thì là nội dung description
			if (line && !line.startsWith("@") && currentSection === "description") {
				result.description += (result.description ? " " : "") + line;
			} else if (currentMethod && currentSection === "methods") {
				currentMethod.description += (currentMethod.description ? " " : "") + line;
			} else if (currentEvent && currentSection === "events") {
				currentEvent.description += (currentEvent.description ? " " : "") + line;
			}
		}

		// Join example lines and clean up
		if (exampleLines.length > 0) {
			result.example = exampleLines
				.map((line) => line.replace(/^\*\s?/, "")) // Remove * and spaces
				.join("\n")
				.trim();
		}

		return result;
	}

	/**
	 * Đọc file TypeScript và extract JSDoc
	 */
	parseFile(filePath) {
		try {
			const content = fs.readFileSync(filePath, "utf8");
			const lines = content.split("\n");

			// Tìm tất cả classes và interfaces trước
			const classes = this.findClassesAndInterfaces(lines);

			// Parse JSDoc cho từng class/interface
			for (const classInfo of classes) {
				this.parseClassJSDoc(lines, classInfo, filePath);
			}
		} catch (error) {
			console.error(`Error parsing file ${filePath}:`, error);
		}
	}

	/**
	 * Tìm tất cả classes và interfaces trong file
	 */
	findClassesAndInterfaces(lines) {
		const classes = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();

			// Tìm class declaration
			if (line.includes("export class") || line.includes("class")) {
				const className = line.match(/class\s+(\w+)/)?.[1];
				if (className && className !== "for" && className !== "if" && className !== "while") {
					classes.push({
						type: "class",
						name: className,
						lineIndex: i,
						startLine: line,
					});
				}
			}
			// Tìm interface declaration
			else if (line.includes("export interface") || line.includes("interface")) {
				const interfaceName = line.match(/interface\s+(\w+)/)?.[1];
				if (interfaceName && interfaceName !== "for" && interfaceName !== "if" && interfaceName !== "while") {
					classes.push({
						type: "interface",
						name: interfaceName,
						lineIndex: i,
						startLine: line,
					});
				}
			}
		}

		return classes;
	}

	/**
	 * Parse JSDoc cho một class/interface cụ thể
	 */
	parseClassJSDoc(lines, classInfo, filePath) {
		const { type, name, lineIndex } = classInfo;

		// Tìm JSDoc comment trước class/interface
		let classJSDoc = null;
		for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 10); i--) {
			const line = lines[i].trim();
			if (line.startsWith("/**")) {
				// Tìm comment block
				let comment = line;
				for (let j = i + 1; j < lineIndex; j++) {
					comment += "\n" + lines[j];
					if (lines[j].trim().endsWith("*/")) {
						break;
					}
				}
				classJSDoc = this.parseJSDoc(comment);
				break;
			}
		}

		// Tạo class/interface entry
		if (type === "class") {
			this.addClass(name, classJSDoc || {});
		} else {
			this.addInterface(name, classJSDoc || {});
		}

		// Tìm methods trong class
		if (type === "class") {
			const methods = this.findMethodsInClass(lines, lineIndex);
			this.updateClassWithMethods(name, methods);
		}
	}

	/**
	 * Tìm tất cả methods trong một class
	 */
	findMethodsInClass(lines, classStartIndex) {
		const methods = [];
		let inClass = false;
		let braceCount = 0;

		console.log(`Looking for methods in class starting at line ${classStartIndex}`);

		for (let i = classStartIndex; i < lines.length; i++) {
			const line = lines[i].trim();

			// Bắt đầu class
			if (line.includes("{")) {
				inClass = true;
				braceCount = 1;
				console.log(`Class body started at line ${i}`);
				continue;
			}

			// Đếm braces để biết khi nào kết thúc class
			if (inClass) {
				// Chỉ log các dòng có thể là method
				if (line.includes("(") && line.includes(")")) {
					console.log(`Line ${i}: "${line}"`);
				}

				for (const char of line) {
					if (char === "{") braceCount++;
					else if (char === "}") braceCount--;
				}

				// Kết thúc class
				if (braceCount === 0) {
					console.log(`Class body ended at line ${i}`);
					break;
				}

				// Tìm JSDoc comment trước method
				if (this.isMethodDeclaration(line)) {
					console.log(`Checking method declaration: ${line}`);
					let methodJSDoc = null;

					// Tìm JSDoc comment trước method
					for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
						const prevLine = lines[j].trim();
						if (prevLine.startsWith("/**")) {
							// Tìm comment block
							let comment = prevLine;
							for (let k = j + 1; k < i; k++) {
								comment += "\n" + lines[k];
								if (lines[k].trim().endsWith("*/")) {
									break;
								}
							}
							methodJSDoc = this.parseJSDoc(comment);
							break;
						}
					}

					// Extract method info
					const methodInfo = this.extractMethodInfo(line);
					if (methodInfo) {
						console.log(`Found method: ${methodInfo.name} in class`);

						// Merge với JSDoc
						const mergedMethod = {
							...methodInfo,
							description: methodJSDoc?.description || methodInfo.description,
							example: methodJSDoc?.example || methodInfo.example,
							parameters: methodInfo.parameters.map((param) => {
								const jsdocParam = methodJSDoc?.parameters?.find((p) => p.name === param.name);
								return {
									...param,
									description: jsdocParam?.description || param.description,
								};
							}),
							returns: methodJSDoc?.returns || methodInfo.returns,
						};

						methods.push(mergedMethod);
					} else {
						console.log(`Method info extraction failed for: ${line}`);
					}
				}
			}
		}

		console.log(`Found ${methods.length} methods`);
		return methods;
	}

	/**
	 * Kiểm tra xem dòng có phải là method declaration không
	 */
	isMethodDeclaration(line) {
		// Simple approach: look for patterns that contain method signature
		const methodPatterns = [
			/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*:\s*[^{]*\s*\{/, // method(params): returnType {
			/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/, // method(params) {
			/^\s*(?:get|set)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)/, // get/set property
		];

		// Also check for method declarations without opening brace on same line
		const methodPatternsNoBrace = [
			/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*:\s*[^{]*$/, // method(params): returnType
			/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*$/, // method(params)
		];

		const isMethod =
			methodPatterns.some((pattern) => pattern.test(line)) || methodPatternsNoBrace.some((pattern) => pattern.test(line));
		if (isMethod) {
			console.log(`Detected method: ${line}`);
		}
		return isMethod;
	}

	/**
	 * Extract thông tin method từ dòng code
	 */
	extractMethodInfo(line) {
		// Tìm method name với các modifier - chỉ lấy tên method hợp lệ
		const methodMatch = line.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
		if (!methodMatch) return null;

		const methodName = methodMatch[1];

		// Bỏ qua các từ khóa không phải method
		const reservedWords = [
			"if",
			"for",
			"while",
			"switch",
			"try",
			"catch",
			"super",
			"this",
			"return",
			"throw",
			"break",
			"continue",
			"else",
			"finally",
			"import",
			"export",
			"const",
			"let",
			"var",
			"function",
			"class",
			"interface",
			"type",
			"enum",
		];
		if (reservedWords.includes(methodName)) {
			return null;
		}

		// Tìm return type - xử lý cả trường hợp có và không có opening brace
		const returnMatch = line.match(/\)\s*:\s*([^{=]+)/);
		const returnType = returnMatch ? returnMatch[1].trim() : "void";

		// Tìm parameters
		const paramMatch = line.match(/\(([^)]*)\)/);
		const parameters = [];
		if (paramMatch && paramMatch[1].trim()) {
			const paramString = paramMatch[1];
			// Xử lý parameters phức tạp hơn
			const paramParts = this.splitParameters(paramString);
			paramParts.forEach((param) => {
				const trimmed = param.trim();
				if (trimmed) {
					const paramInfo = this.parseParameter(trimmed);
					if (paramInfo) {
						parameters.push(paramInfo);
					}
				}
			});
		}

		return {
			name: methodName,
			signature: line.trim(),
			description: "",
			example: "",
			parameters: parameters,
			returns: returnType,
		};
	}

	/**
	 * Split parameters string thành array, xử lý generic types
	 */
	splitParameters(paramString) {
		const params = [];
		let current = "";
		let depth = 0;
		let inString = false;
		let stringChar = "";

		for (let i = 0; i < paramString.length; i++) {
			const char = paramString[i];

			if ((char === '"' || char === "'") && !inString) {
				inString = true;
				stringChar = char;
			} else if (char === stringChar && inString) {
				inString = false;
				stringChar = "";
			} else if (!inString) {
				if (char === "<") depth++;
				else if (char === ">") depth--;
				else if (char === "," && depth === 0) {
					params.push(current.trim());
					current = "";
					continue;
				}
			}

			current += char;
		}

		if (current.trim()) {
			params.push(current.trim());
		}

		return params;
	}

	/**
	 * Parse một parameter string thành object
	 */
	parseParameter(param) {
		// Xử lý optional parameters
		const isOptional = param.includes("?");
		const cleanParam = param.replace(/\?$/, "");

		// Tìm name và type
		const colonIndex = cleanParam.indexOf(":");
		if (colonIndex === -1) {
			// Chỉ có name, không có type
			return {
				name: cleanParam.trim(),
				type: "any",
				description: "",
				optional: isOptional,
			};
		}

		const name = cleanParam.substring(0, colonIndex).trim();
		const type = cleanParam.substring(colonIndex + 1).trim();

		return {
			name: name,
			type: type,
			description: "",
			optional: isOptional,
		};
	}

	/**
	 * Cập nhật class với methods đã tìm được
	 */
	updateClassWithMethods(className, methods) {
		const classKey = className.toLowerCase();
		if (this.apiContent[classKey]) {
			// Merge methods với JSDoc information
			const existingMethods = this.apiContent[classKey].methods || [];
			const mergedMethods = methods.map((method) => {
				// Tìm method tương ứng trong existing methods
				const existingMethod = existingMethods.find((existing) => existing.name === method.name);

				if (existingMethod) {
					// Merge thông tin từ JSDoc với thông tin từ code
					return {
						...method,
						description: existingMethod.description || method.description,
						example: existingMethod.example || method.example,
						parameters: method.parameters.map((param) => {
							const existingParam = existingMethod.parameters?.find((p) => p.name === param.name);
							return {
								...param,
								description: existingParam?.description || param.description,
							};
						}),
						returns: existingMethod.returns || method.returns,
					};
				}

				return method;
			});

			this.apiContent[classKey].methods = mergedMethods;
			console.log(`Updated class ${className} with ${mergedMethods.length} methods`);
		} else {
			console.log(`Class ${className} not found in API content`);
		}
	}

	/**
	 * Thêm class vào API content
	 */
	addClass(name, parsed) {
		this.apiContent[name.toLowerCase()] = {
			title: name,
			description: parsed.description || `The ${name} class`,
			badges: ["class", "core", name.toLowerCase()],
			code: parsed.example || `// ${name} usage example`,
			methods: parsed.methods || [],
			events: parsed.events || [],
		};
		console.log(`Added class ${name} to API content`);
	}

	/**
	 * Thêm interface vào API content
	 */
	addInterface(name, parsed) {
		this.apiContent[name.toLowerCase()] = {
			title: name,
			description: parsed.description || `The ${name} interface`,
			badges: ["interface", "core", name.toLowerCase()],
			code: parsed.example || `// ${name} usage example`,
			methods: [],
			events: [],
		};
	}

	/**
	 * Generate API content từ tất cả files
	 */
	generate() {
		// Core files
		const coreFiles = [
			"../../core/src/structures/PlayerManager.ts",
			"../../core/src/structures/Player.ts",
			"../../core/src/structures/Queue.ts",
			"../../core/src/types/index.ts",
		];

		// Extension files
		const extensionFiles = [
			"../../extension/src/lavalinkExt.ts",
			"../../extension/src/voiceExt.ts",
			"../../extension/src/lyricsExt.ts",
		];

		// Plugin files
		const pluginFiles = [
			"../../plugins/src/YouTubePlugin.ts",
			"../../plugins/src/SoundCloudPlugin.ts",
			"../../plugins/src/SpotifyPlugin.ts",
			"../../plugins/src/TTSPlugin.ts",
		];

		// Parse tất cả files
		[...coreFiles, ...extensionFiles, ...pluginFiles].forEach((file) => {
			const fullPath = path.resolve(__dirname, file);
			console.log(`Checking file: ${fullPath}`);
			if (fs.existsSync(fullPath)) {
				console.log(`Parsing file: ${fullPath}`);
				this.parseFile(fullPath);
			} else {
				console.log(`File not found: ${fullPath}`);
			}
		});

		console.log(`Generated ${Object.keys(this.apiContent).length} API items`);
		return this.apiContent;
	}

	/**
	 * Lưu generated content vào file
	 */
	save(outputPath) {
		const content = this.generate();
		const jsContent = `// Auto-generated API content
// Do not edit this file manually - it will be overwritten

export const generatedApiContent = ${JSON.stringify(content, null, 2)};`;

		fs.writeFileSync(outputPath, jsContent);
		console.log(`API content generated and saved to ${outputPath}`);
	}
}

// Chạy generator
if (require.main === module) {
	const generator = new ApiContentGenerator();
	generator.save(path.resolve(__dirname, "../components/GeneratedApiContent.ts"));
}

module.exports = ApiContentGenerator;
