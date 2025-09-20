/**
 * Configuration file cho API Documentation Generator
 */

module.exports = {
	// Files để parse JSDoc
	files: {
		core: [
			"../core/src/structures/PlayerManager.ts",
			"../core/src/structures/Player.ts",
			"../core/src/structures/Queue.ts",
			"../core/src/types/index.ts",
		],
		extensions: ["../extension/src/lavalinkExt.ts", "../extension/src/voiceExt.ts", "../extension/src/lyricsExt.ts"],
		plugins: [
			"../plugins/src/YouTubePlugin.ts",
			"../plugins/src/SoundCloudPlugin.ts",
			"../plugins/src/SpotifyPlugin.ts",
			"../plugins/src/TTSPlugin.ts",
		],
	},

	// Output paths
	output: {
		generatedContent: "../components/GeneratedApiContent.ts",
		apiContent: "../components/ApiContent.tsx",
	},

	// JSDoc templates
	templates: {
		class: `/**
 * {description}
 * 
 * @example
 * {example}
 * 
 * @method methodName - Method description
 * @event eventName - Event description
 */`,

		method: `/**
 * {description}
 * 
 * @param {type} param - Description
 * @returns {type} Description
 * @example
 * {example}
 */`,

		interface: `/**
 * {description}
 * 
 * @example
 * {example}
 */`,

		event: `/**
 * {description}
 * 
 * @event {name}
 * @param {type} param - Description
 */`,
	},

	// Badge mapping
	badges: {
		class: ["class", "core"],
		interface: ["interface", "core"],
		extension: ["class", "extension"],
		plugin: ["class", "plugin"],
	},

	// Watch patterns
	watch: {
		patterns: ["../core/src/**/*.ts", "../extension/src/**/*.ts", "../plugins/src/**/*.ts"],
		ignored: ["node_modules", "*.test.ts", "*.spec.ts"],
	},

	// Validation rules
	validation: {
		requiredFields: ["title", "description", "badges", "code"],
		optionalFields: ["methods", "events", "properties"],
	},
};
