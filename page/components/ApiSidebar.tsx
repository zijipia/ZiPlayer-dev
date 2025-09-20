"use client";

import { useState } from "react";
import { ChevronDown, Search, Code, Play, Settings, Users, Music, Mic, Headphones, MessageSquare, Layers } from "lucide-react";

const apiSections = [
	{
		title: "Core Classes",
		icon: Code,
		items: ["PlayerManager", "Player", "Queue", "Track", "SearchResult", "StreamInfo", "PlayerOptions", "PlayerEvents"],
	},
	{
		title: "Plugins",
		icon: Play,
		items: ["BasePlugin", "YouTubePlugin", "SoundCloudPlugin", "SpotifyPlugin", "TTSPlugin", "PluginOptions"],
	},
	{
		title: "Extensions",
		icon: Settings,
		items: ["BaseExtension", "voiceExt", "lavalinkExt", "lyricsExt", "ExtensionContext", "ExtensionOptions"],
	},
	{
		title: "Managers",
		icon: Users,
		items: ["NodeManager", "PlayerStateManager", "WebSocketHandler", "VoiceHandler", "TrackResolver"],
	},
	{
		title: "Audio",
		icon: Music,
		items: ["AudioPlayer", "AudioResource", "VoiceConnection", "AudioFilters", "VolumeControl"],
	},
	{
		title: "Voice Features",
		icon: Mic,
		items: ["SpeechToText", "TextToSpeech", "VoiceCommands", "VoiceEvents", "SpeechOptions"],
	},
	{
		title: "Lavalink",
		icon: Headphones,
		items: ["LavalinkNode", "LavalinkPlayer", "LavalinkEvents", "NodeOptions", "LoadBalancer"],
	},
	{
		title: "Lyrics",
		icon: MessageSquare,
		items: ["LyricsProvider", "LyricsResult", "LRCFormat", "LyricsOptions", "LyricsEvents"],
	},
	{
		title: "Utilities",
		icon: Layers,
		items: ["Helpers", "Validators", "Formatters", "Constants", "Types"],
	},
];

export function ApiSidebar() {
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedSections, setExpandedSections] = useState<string[]>(["Core Classes"]);

	const toggleSection = (title: string) => {
		setExpandedSections((prev) => (prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]));
	};

	const filteredSections = apiSections
		.map((section) => ({
			...section,
			items: section.items.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase())),
		}))
		.filter((section) => section.items.length > 0);

	return (
		<div className='h-full flex flex-col bg-gradient-to-b from-gray-800/30 to-gray-900/30 backdrop-blur-sm'>
			{/* Header */}
			<div className='p-6 border-b border-gray-700/50 bg-gray-800/20 backdrop-blur-sm'>
				<h1 className='text-2xl font-bold text-white mb-2'>ziplayer</h1>
				<div className='flex gap-2 mb-4'>
					<select className='bg-gray-700/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded border border-gray-600/50 focus:outline-none focus:border-blue-500/50'>
						<option>ziplayer</option>
					</select>
					<select className='bg-gray-700/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded border border-gray-600/50 focus:outline-none focus:border-blue-500/50'>
						<option>Select a version</option>
					</select>
				</div>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
					<input
						type='text'
						placeholder='Q Search...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full bg-gray-700/50 backdrop-blur-sm text-white pl-10 pr-4 py-2 rounded border border-gray-600/50 focus:outline-none focus:border-blue-500/50'
					/>
					<span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs'>⌘K</span>
				</div>
			</div>

			{/* Navigation */}
			<div className='flex-1 overflow-y-auto'>
				{filteredSections.map((section) => (
					<div
						key={section.title}
						className='border-b border-gray-700/30'>
						<button
							onClick={() => toggleSection(section.title)}
							className='w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-700/30 backdrop-blur-sm transition-all duration-200'>
							<div className='flex items-center gap-3'>
								<section.icon className='w-4 h-4 text-green-400' />
								<span className='text-white font-medium'>{section.title}</span>
							</div>
							<ChevronDown
								className={`w-4 h-4 text-gray-400 transition-transform ${
									expandedSections.includes(section.title) ? "rotate-180" : ""
								}`}
							/>
						</button>
						{expandedSections.includes(section.title) && (
							<div className='bg-gray-800/20 backdrop-blur-sm'>
								{section.items.map((item) => (
									<a
										key={item}
										href={`#${item.toLowerCase()}`}
										className='block px-8 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/30 backdrop-blur-sm transition-all duration-200'>
										{item}
									</a>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
