"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Search, Code, Play, Settings, Users, Music, Mic, Headphones, MessageSquare, Layers } from "lucide-react";
import { generatedApiContent } from "./GeneratedApiContent";

const apiSections = [
	{
		title: "Core Classes",
		icon: Code,
		items: ["playermanager", "player", "queue"],
	},
	{
		title: "Core Interfaces",
		icon: Settings,
		items: [
			"track",
			"searchresult",
			"streaminfo",
			"playeroptions",
			"playermanageroptions",
			"progressbaroptions",
			"playerevents",
			"speechoptions",
			"lyricsoptions",
			"lyricsresult",
			"ttsconfig",
		],
	},
	{
		title: "Extensions",
		icon: Headphones,
		items: [
			"lavalinkext",
			"voiceext",
			"lyricsext",
			"extensioncontext",
			"extensionplayrequest",
			"extensionplayresponse",
			"extensionafterplaypayload",
			"extensionstreamrequest",
			"extensionsearchrequest",
		],
	},
	{
		title: "Plugins",
		icon: Play,
		items: [
			"youtubeplugin",
			"soundcloudplugin",
			"spotifyplugin",
			"ttsplugin",
			"sourceplugin",
			"sourceextension",
			"ttspluginoptions",
		],
	},
];

interface ApiSidebarProps {
	activeSection?: string;
	onSectionChange?: (section: string) => void;
}

export function ApiSidebar({ activeSection, onSectionChange }: ApiSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedSections, setExpandedSections] = useState<string[]>(["Core Classes"]);

	// Auto-expand section containing active item
	useEffect(() => {
		if (activeSection) {
			const sectionContainingItem = apiSections.find((section) => section.items.includes(activeSection));
			if (sectionContainingItem && !expandedSections.includes(sectionContainingItem.title)) {
				setExpandedSections((prev) => [...prev, sectionContainingItem.title]);
			}
		}
	}, [activeSection, expandedSections]);

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
								{section.items.map((item) => {
									const apiItem = generatedApiContent[item as keyof typeof generatedApiContent];
									const displayName = apiItem?.title || item;
									const isActive = activeSection === item;
									return (
										<button
											key={item}
											onClick={() => {
												if (onSectionChange) {
													onSectionChange(item);
												} else {
													// Fallback to custom event
													const event = new CustomEvent("sidebarItemClick", { detail: item });
													window.dispatchEvent(event);
												}
											}}
											className={`block w-full text-left px-8 py-2 text-sm backdrop-blur-sm transition-all duration-200 ${
												isActive
													? "text-white bg-blue-600/30 border-r-2 border-blue-500"
													: "text-gray-300 hover:text-white hover:bg-gray-700/30"
											}`}>
											{displayName}
										</button>
									);
								})}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
