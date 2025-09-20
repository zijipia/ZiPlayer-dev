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
	 * Clean code string - remove trailing slash and fix formatting
	 */
	cleanCode(code) {
		if (!code) return "";
		return code.replace(/\/$/, "").trim();
	}

	/**
	 * Get code value - always return a value, even if long
	 */
	getCodeValue(example, fallback = "") {
		if (!example) return fallback;
		return this.cleanCode(example) || fallback;
	}

	/**
	 * Parse JSDoc comment và extract thông tin
	 */
	parseJSDoc(comment) {
		const lines = comment.split("\n").map((line) => line.trim().replace(/^\*\s?/, ""));
		const result = {
			description: "",
			summary: "",
			example: "",
			methods: [],
			events: [],
			properties: [],
			params: [],
			returns: null,
		};

		let currentSection = "description";
		let currentMethod = null;
		let currentEvent = null;
		let currentProperty = null;
		let currentParam = null;
		let currentThrow = null;
		let inExample = false;
		let inCodeBlock = false;
		let exampleLines = [];
		let codeBlockLines = [];

		for (const line of lines) {
			// Skip empty lines and comment markers
			if (!line || line === "/**" || line === "*/") continue;

			// End example block if we encounter any @ tag (except @example, @method, @event)
			if (
				inExample &&
				line.startsWith("@") &&
				!line.startsWith("@example") &&
				!line.startsWith("@method") &&
				!line.startsWith("@event")
			) {
				inExample = false;
			}

			// Handle code blocks
			if (line.startsWith("```")) {
				if (inCodeBlock) {
					// End of code block
					inCodeBlock = false;
					if (exampleLines.length > 0) {
						result.example = codeBlockLines.join("\n").trim();
						codeBlockLines = [];
					}
				} else {
					// Start of code block
					inCodeBlock = true;
					const language = line.replace("```", "").trim();
					if (language) {
						codeBlockLines.push(`// ${language}`);
					}
				}
				continue;
			}

			if (inCodeBlock) {
				codeBlockLines.push(line);
				continue;
			}

			// Handle @example
			if (line.startsWith("@example")) {
				currentSection = "example";
				inExample = true;
				const exampleText = line.replace("@example", "").trim();
				if (exampleText) {
					exampleLines.push(exampleText);
				}
				continue;
			}

			// Nếu đang trong example block và không phải tag khác
			if (inExample && !line.startsWith("@")) {
				exampleLines.push(line);
				continue;
			}

			// Handle @summary
			if (line.startsWith("@summary")) {
				result.summary = line.replace("@summary", "").trim();
				continue;
			}

			// Handle @param
			if (line.startsWith("@param")) {
				const paramInfo = line.replace("@param", "").trim();
				// Parse param với format {type} name - description
				const paramMatch = paramInfo.match(/\{([^}]+)\}\s+(\w+)\s*-\s*(.*)/);
				if (paramMatch) {
					currentParam = {
						name: paramMatch[2],
						type: paramMatch[1],
						description: paramMatch[3] || "",
						optional: false,
						default: "",
						variation: "",
					};
					result.params.push(currentParam);
				} else {
					// Fallback cho format cũ
					const parts = paramInfo.split(" ");
					if (parts.length >= 2) {
						currentParam = {
							name: parts[1]?.replace("{", "").replace("}", "") || "",
							type: parts[0]?.replace("{", "").replace("}", "") || "any",
							description: parts.slice(2).join(" ") || "",
							optional: false,
							default: "",
							variation: "",
						};
						result.params.push(currentParam);
					}
				}
				continue;
			}

			// Handle @param properties
			if (line.startsWith("@param.") && currentParam) {
				const propInfo = line.replace("@param.", "").trim();
				const [prop, value] = propInfo.split(" ");
				if (prop === "optional") {
					currentParam.optional = true;
				} else if (prop === "default") {
					currentParam.default = value || "";
				} else if (prop === "variation") {
					currentParam.variation = value || "";
				}
				continue;
			}

			// Handle @returns/@return
			if (line.startsWith("@returns") || line.startsWith("@return")) {
				const returnInfo = line.replace(/@returns?/, "").trim();
				const returnMatch = returnInfo.match(/\{([^}]+)\}\s*(.*)/);
				if (returnMatch) {
					result.returns = {
						type: returnMatch[1],
						description: returnMatch[2] || "",
					};
				} else {
					result.returns = {
						type: "any",
						description: returnInfo,
					};
				}
				continue;
			}

			// Handle @method
			if (line.startsWith("@method")) {
				currentSection = "methods";
				inExample = false;
				const methodInfo = line.replace("@method", "").trim();
				const [name, description] = methodInfo.split(" - ");
				currentMethod = {
					name: name?.trim() || "",
					signature: "",
					description: description?.trim() || "",
					example: "",
					code: "",
					parameters: [],
					returns: null,
				};
				result.methods.push(currentMethod);
				continue;
			}

			// Handle @event
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

			// Handle @property
			if (line.startsWith("@property")) {
				currentSection = "properties";
				inExample = false;
				const propInfo = line.replace("@property", "").trim();
				const propMatch = propInfo.match(/\{([^}]+)\}\s+(\w+)\s*-\s*(.*)/);
				if (propMatch) {
					currentProperty = {
						name: propMatch[2],
						type: propMatch[1],
						description: propMatch[3] || "",
						optional: false,
						default: "",
					};
					result.properties.push(currentProperty);
				}
				continue;
			}

			// Handle @property properties
			if (line.startsWith("@property.") && currentProperty) {
				const propInfo = line.replace("@property.", "").trim();
				const [prop, value] = propInfo.split(" ");
				if (prop === "optional") {
					currentProperty.optional = true;
				} else if (prop === "default") {
					currentProperty.default = value || "";
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
			} else if (currentProperty && currentSection === "properties") {
				currentProperty.description += (currentProperty.description ? " " : "") + line;
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

			// Tìm file overview JSDoc
			const fileOverview = this.findFileOverviewJSDoc(lines);
			if (fileOverview) {
				this.addFileOverview(filePath, fileOverview);
			}

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
	 * Tìm file overview JSDoc ở đầu file
	 */
	findFileOverviewJSDoc(lines) {
		for (let i = 0; i < Math.min(20, lines.length); i++) {
			const line = lines[i].trim();
			if (line.startsWith("/**") && line.includes("@fileoverview")) {
				// Tìm comment block
				let comment = line;
				for (let j = i + 1; j < lines.length; j++) {
					comment += "\n" + lines[j];
					if (lines[j].trim().endsWith("*/")) {
						break;
					}
				}
				return this.parseJSDoc(comment);
			}
		}
		return null;
	}

	/**
	 * Thêm file overview vào API content
	 */
	addFileOverview(filePath, parsed) {
		const fileName = path.basename(filePath, ".ts");
		const moduleName = fileName.toLowerCase();

		const badges = ["module"];
		if (parsed.kind) badges.push(parsed.kind);
		if (parsed.scope) badges.push(parsed.scope);
		if (parsed.deprecated) badges.push("deprecated");
		if (parsed.internal) badges.push("internal");

		// Add module badges based on file path
		if (filePath.includes("plugin")) badges.push("plugin");
		else if (filePath.includes("extension")) badges.push("extension");
		else badges.push("core");

		badges.push(moduleName);

		this.apiContent[`${moduleName}_overview`] = {
			title: `${fileName} Module`,
			description: parsed.description || `The ${fileName} module`,
			summary: parsed.summary || "",
			badges: badges,
			code: this.getCodeValue(parsed.example, `// ${fileName} module usage example`),
			methods: [],
			events: [],
			properties: [],
			params: parsed.params || [],
			returns: parsed.returns,
		};
		console.log(`Added file overview for ${fileName} module`);
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
		for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 50); i--) {
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
			// Debug: log methods và events từ JSDoc đầu class
			if (classJSDoc && (classJSDoc.methods?.length > 0 || classJSDoc.events?.length > 0)) {
				console.log(
					`${name} has ${classJSDoc.methods?.length || 0} methods and ${classJSDoc.events?.length || 0} events from class JSDoc`,
				);
			}
		} else {
			this.addInterface(name, classJSDoc || {});
		}

		// Tìm methods từ code thực tế
		if (type === "class") {
			console.log(`Searching for methods in ${name} class...`);
			const methods = this.findMethodsInClass(lines, lineIndex, name);
			console.log(`Found ${methods.length} methods in ${name} class`);

			// Cập nhật class với methods từ code
			if (methods.length > 0) {
				const classKey = name.toLowerCase();
				if (this.apiContent[classKey]) {
					this.apiContent[classKey].methods = methods;
					console.log(`Updated ${name} with ${methods.length} methods from code`);
				}
			}
		}
	}

	/**
	 * Tìm tất cả methods trong một class
	 */
	findMethodsInClass(lines, classStartIndex, className = "Unknown") {
		const methods = [];
		let inClass = false;
		let braceCount = 0;

		// Tìm dòng class declaration đầu tiên
		let classDeclarationLine = -1;
		for (let j = classStartIndex; j < Math.min(classStartIndex + 5, lines.length); j++) {
			const line = lines[j].trim();
			if (line.includes("class") || line.includes("interface")) {
				classDeclarationLine = j;
				// console.log(`Found class declaration at line ${j}: "${line}"`);
				break;
			}
		}

		for (let i = classDeclarationLine >= 0 ? classDeclarationLine : classStartIndex; i < lines.length; i++) {
			const line = lines[i].trim();

			// Bắt đầu class - chỉ khi gặp dòng có { sau class declaration
			if (!inClass && i >= classDeclarationLine && line.includes("{")) {
				inClass = true;
				braceCount = 1;
				// console.log(`Started class body at line ${i}: "${line}"`);
				continue;
			}

			// Đếm braces để biết khi nào kết thúc class
			if (inClass) {
				const oldBraceCount = braceCount;
				for (const char of line) {
					if (char === "{") braceCount++;
					else if (char === "}") braceCount--;
				}

				// Debug log cho brace count
				// if (line.includes("{") || line.includes("}")) {
				// 	console.log(`Line ${i}: "${line}" - Brace count: ${oldBraceCount} -> ${braceCount}`);
				// }

				// Kết thúc class
				if (braceCount === 0) {
					// console.log(`Class body ended at line ${i}: "${line}"`);
					break;
				}

				// Skip empty lines
				if (!line) {
					continue;
				}

				// Debug: log các dòng có thể là method
				if (line.includes("(") && line.includes(")") && !line.startsWith("//") && !line.startsWith("*")) {
					console.log(`Checking potential method in ${className}: "${line}"`);
				}

				// Tìm JSDoc comment trước method
				if (this.isMethodDeclaration(line)) {
					console.log(`Found method declaration in ${className}: ${line}`);
					let methodJSDoc = null;

					// Extract method info first
					const methodInfo = this.extractMethodInfo(line);
					if (methodInfo) {
						// Tìm JSDoc comment trước method
						for (let j = i - 1; j >= Math.max(0, i - 50); j--) {
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
						// Merge với JSDoc
						const mergedMethod = {
							...methodInfo,
							description: methodJSDoc?.description || methodInfo.description,
							example: methodJSDoc?.example || methodInfo.example || "",
							code: this.getCodeValue(methodJSDoc?.example || methodInfo.example, ""),
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
						// console.log(`Failed to extract method info from: ${line}`);
					}
				}
			}
		}

		return methods;
	}

	/**
	 * Kiểm tra xem dòng có phải là method declaration không
	 */
	isMethodDeclaration(line) {
		// Skip comments, empty lines, và variable declarations
		if (!line || line.startsWith("//") || line.startsWith("*") || line.startsWith("/**") || line.startsWith("*/")) {
			return false;
		}

		// Skip variable declarations (const, let, var, private, public, protected)
		if (line.match(/^\s*(?:const|let|var|private|public|protected)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:]/)) {
			return false;
		}

		// Skip getter/setter properties
		if (line.match(/^\s*(?:get|set)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*[=:]/)) {
			return false;
		}

		// Skip constructor
		if (line.includes("constructor(")) {
			return false;
		}

		// Method patterns - nhận diện các methods có JSDoc hoặc là public methods
		const methodPatterns = [
			// async method(params): returnType {
			/^\s*(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*:\s*[^{]*\s*\{/,
			// async method(params) {
			/^\s*(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/,
			// method(params): returnType
			/^\s*(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*:\s*[^{]*$/,
			// method(params)
			/^\s*(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*$/,
		];

		const isMethod = methodPatterns.some((pattern) => pattern.test(line));

		// Chỉ lấy những methods quan trọng
		if (isMethod) {
			const methodName = line.match(/(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)?.[1];
			const importantMethods = [
				// Core methods
				"create",
				"get",
				"getPlayer",
				"getall",
				"delete",
				"has",
				"destroy",
				"search",
				"play",
				"pause",
				"resume",
				"skip",
				"stop",
				"setVolume",
				"connect",
				"add",
				"remove",
				"clear",
				"shuffle",
				"setLoopMode",
				"autoPlay",
				// Plugin methods
				"canHandle",
				"validate",
				"getStream",
				"extractPlaylist",
				// Extension methods
				"active",
				"onDestroy",
				"beforePlay",
				"provideSearch",
				"provideStream",
				"afterPlay",
				"onRegister",
				"onUnregister",
				"fetch",
				"resolveSpeech",
				"attach",
			];

			const isImportant = importantMethods.includes(methodName);
			// if (isImportant) {
			// 	console.log(`Found important method: ${methodName}`);
			// }
			return isImportant;
		}

		return false;
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

		// Clean signature - remove trailing { and fix formatting
		let cleanSignature = line.trim();
		if (cleanSignature.endsWith(" {")) {
			cleanSignature = cleanSignature.slice(0, -2);
		}

		return {
			name: methodName,
			signature: cleanSignature,
			description: "",
			example: "",
			code: "",
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
				default: "",
				variation: "",
			};
		}

		const name = cleanParam.substring(0, colonIndex).trim();
		const type = cleanParam.substring(colonIndex + 1).trim();

		return {
			name: name,
			type: type,
			description: "",
			optional: isOptional,
			default: "",
			variation: "",
		};
	}

	/**
	 * Cập nhật class với methods đã tìm được
	 */
	updateClassWithMethods(className, methods) {
		const classKey = className.toLowerCase();
		if (this.apiContent[classKey]) {
			// Chỉ lấy những methods có JSDoc description hoặc là public methods quan trọng
			const importantMethods = methods.filter((method) => {
				// Lấy methods có JSDoc description
				if (method.description && method.description.trim()) {
					return true;
				}

				// Lấy những public methods quan trọng (không phải private/internal)
				const importantMethodNames = [
					// Core methods
					"create",
					"get",
					"getPlayer",
					"getall",
					"delete",
					"has",
					"destroy",
					"search",
					"play",
					"pause",
					"resume",
					"skip",
					"stop",
					"setVolume",
					"connect",
					"add",
					"remove",
					"clear",
					"shuffle",
					"setLoopMode",
					"autoPlay",
					// Plugin methods
					"canHandle",
					"validate",
					"getStream",
					"extractPlaylist",
					// Extension methods
					"active",
					"onDestroy",
					"beforePlay",
					"provideSearch",
					"provideStream",
					"afterPlay",
					"onRegister",
					"onUnregister",
				];

				return importantMethodNames.includes(method.name);
			});

			// Merge methods với JSDoc information
			const existingMethods = this.apiContent[classKey].methods || [];
			const mergedMethods = importantMethods.map((method) => {
				// Tìm method tương ứng trong existing methods
				const existingMethod = existingMethods.find((existing) => existing.name === method.name);

				if (existingMethod) {
					// Merge thông tin từ JSDoc với thông tin từ code
					return {
						...method,
						description: existingMethod.description || method.description,
						example: existingMethod.example || method.example || "",
						code: this.getCodeValue(existingMethod.example || method.example, ""),
						parameters: method.parameters.map((param) => {
							const existingParam = existingMethod.parameters?.find((p) => p.name === param.name);
							return {
								...param,
								description: existingParam?.description || param.description,
								optional: existingParam?.optional || param.optional || false,
								default: existingParam?.default || param.default || "",
								variation: existingParam?.variation || param.variation || "",
							};
						}),
						returns: existingMethod.returns || method.returns,
					};
				}

				return method;
			});

			// Chỉ update methods nếu có methods quan trọng từ code
			if (mergedMethods.length > 0) {
				this.apiContent[classKey].methods = mergedMethods;
				console.log(`Updated ${className} with ${mergedMethods.length} important methods`);
			} else {
				console.log(`No important methods found for ${className}, keeping ${existingMethods.length} methods from JSDoc`);
			}
		} else {
			console.log(`Class ${className} not found in API content`);
		}
	}

	/**
	 * Thêm class vào API content
	 */
	addClass(name, parsed) {
		const badges = ["class"];

		// Add type-specific badges
		if (parsed.kind) badges.push(parsed.kind);
		if (parsed.scope) badges.push(parsed.scope);
		if (parsed.deprecated) badges.push("deprecated");
		if (parsed.abstract) badges.push("abstract");
		if (parsed.readonly) badges.push("readonly");
		if (parsed.internal) badges.push("internal");

		// Add module badges based on file path
		if (name.toLowerCase().includes("plugin")) badges.push("plugin");
		else if (name.toLowerCase().includes("ext")) badges.push("extension");
		else badges.push("core");

		badges.push(name.toLowerCase());

		this.apiContent[name.toLowerCase()] = {
			title: name,
			description: parsed.description || `The ${name} class`,
			summary: parsed.summary || "",
			badges: badges,
			code: this.getCodeValue(parsed.example, `// ${name} usage example`),
			methods: parsed.methods || [],
			events: parsed.events || [],
			properties: parsed.properties || [],
			params: parsed.params || [],
			returns: parsed.returns,
		};
		console.log(`Added class ${name} to API content with ${Object.keys(parsed).length} properties`);
	}

	/**
	 * Thêm interface vào API content
	 */
	addInterface(name, parsed) {
		const badges = ["interface"];

		// Add type-specific badges
		if (parsed.kind) badges.push(parsed.kind);
		if (parsed.scope) badges.push(parsed.scope);
		if (parsed.deprecated) badges.push("deprecated");
		if (parsed.readonly) badges.push("readonly");
		if (parsed.internal) badges.push("internal");

		// Add module badges based on file path
		if (name.toLowerCase().includes("plugin")) badges.push("plugin");
		else if (name.toLowerCase().includes("ext")) badges.push("extension");
		else badges.push("core");

		badges.push(name.toLowerCase());

		this.apiContent[name.toLowerCase()] = {
			title: name,
			description: parsed.description || `The ${name} interface`,
			summary: parsed.summary || "",
			badges: badges,
			code: this.getCodeValue(parsed.example, `// ${name} usage example`),
			methods: [],
			events: [],
			properties: parsed.properties || [],
			params: parsed.params || [],
			returns: parsed.returns,
		};
		console.log(`Added interface ${name} to API content with ${Object.keys(parsed).length} properties`);
	}

	/**
	 * Generate API content từ tất cả files
	 */
	generate() {
		// Chỉ parse những files quan trọng cho API reference
		const importantFiles = [
			"../../core/src/structures/PlayerManager.ts",
			"../../core/src/structures/Player.ts",
			"../../core/src/structures/Queue.ts",
			"../../core/src/types/index.ts",
			"../../extension/src/lavalinkExt.ts",
			"../../extension/src/voiceExt.ts",
			"../../extension/src/lyricsExt.ts",
			"../../plugins/src/YouTubePlugin.ts",
			"../../plugins/src/SoundCloudPlugin.ts",
			"../../plugins/src/SpotifyPlugin.ts",
			"../../plugins/src/TTSPlugin.ts",
		];

		// Parse chỉ những files quan trọng
		importantFiles.forEach((file) => {
			const fullPath = path.resolve(__dirname, file);
			if (fs.existsSync(fullPath)) {
				console.log(`Parsing file: ${path.basename(fullPath)}`);
				this.parseFile(fullPath);
			} else {
				console.log(`File not found: ${fullPath}`);
			}
		});

		console.log(`Generated ${Object.keys(this.apiContent).length} API items`);
		return this.apiContent;
	}

	/**
	 * Tạo summary report về API content đã generate
	 */
	generateSummary() {
		const summary = {
			totalItems: Object.keys(this.apiContent).length,
			byType: {},
			byModule: {},
			withJSDoc: 0,
			withExamples: 0,
			withReturns: 0,
			withParams: 0,
		};

		for (const [key, item] of Object.entries(this.apiContent)) {
			// Count by type
			const type = item.badges?.[0] || "unknown";
			summary.byType[type] = (summary.byType[type] || 0) + 1;

			// Count by module
			const module = item.badges?.find((b) => ["core", "plugin", "extension", "module"].includes(b)) || "unknown";
			summary.byModule[module] = (summary.byModule[module] || 0) + 1;

			// Count JSDoc features
			if (
				item.description &&
				item.description !== `The ${item.title} class` &&
				item.description !== `The ${item.title} interface`
			) {
				summary.withJSDoc++;
			}
			if (item.example) {
				summary.withExamples++;
			}
			if (item.returns) {
				summary.withReturns++;
			}
			if (item.params && item.params.length > 0) {
				summary.withParams++;
			}
		}

		return summary;
	}

	/**
	 * Lưu generated content vào file
	 */
	save(outputPath) {
		const content = this.generate();
		const summary = this.generateSummary();

		const jsContent = `// Auto-generated API content
// Do not edit this file manually - it will be overwritten

export const generatedApiContent = ${JSON.stringify(content, null, 2)};

export const apiContentSummary = ${JSON.stringify(summary, null, 2)};

// Summary:
// - Total items: ${summary.totalItems}
// - Classes: ${summary.byType.class || 0}
// - Interfaces: ${summary.byType.interface || 0}
// - Modules: ${summary.byType.module || 0}
// - Core: ${summary.byModule.core || 0}
// - Plugins: ${summary.byModule.plugin || 0}
// - Extensions: ${summary.byModule.extension || 0}
// - With JSDoc: ${summary.withJSDoc}
// - With Examples: ${summary.withExamples}
// - With @returns: ${summary.withReturns}
// - With @param: ${summary.withParams}
`;

		fs.writeFileSync(outputPath, jsContent);
		console.log(`API content generated and saved to ${outputPath}`);
		console.log(
			`Summary: ${summary.totalItems} items (${summary.byType.class || 0} classes, ${summary.byType.interface || 0} interfaces, ${
				summary.byType.module || 0
			} modules)`,
		);
		console.log(`JSDoc coverage: ${summary.withJSDoc}/${summary.totalItems} items have descriptions`);
	}
}

// Chạy generator
if (require.main === module) {
	const generator = new ApiContentGenerator();
	generator.save(path.resolve(__dirname, "../components/GeneratedApiContent.ts"));
}

module.exports = ApiContentGenerator;
