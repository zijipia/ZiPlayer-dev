"use client";

import { motion } from "framer-motion";
import { Play, Music, Mic, Headphones, MessageSquare, Layers, ExternalLink } from "lucide-react";

const plugins = [
	{
		name: "YouTube Plugin",
		description: "Support for YouTube videos and playlists with high quality streaming.",
		icon: Play,
		color: "from-red-500 to-red-600",
		features: ["Video & Playlist", "High Quality", "Search Support"],
		code: `new YouTubePlugin()`,
	},
	{
		name: "SoundCloud Plugin",
		description: "Play music from SoundCloud with support for tracks and sets.",
		icon: Music,
		color: "from-orange-500 to-orange-600",
		features: ["Tracks & Sets", "Direct Streaming", "Metadata Rich"],
		code: `new SoundCloudPlugin()`,
	},
	{
		name: "Spotify Plugin",
		description: "Resolve metadata from Spotify and fallback to other sources.",
		icon: Music,
		color: "from-green-500 to-green-600",
		features: ["Metadata Resolution", "Playlist Support", "Fallback System"],
		code: `new SpotifyPlugin()`,
	},
	{
		name: "TTS Plugin",
		description: "Text-to-Speech with Google TTS and multi-language support.",
		icon: MessageSquare,
		color: "from-blue-500 to-blue-600",
		features: ["Multi-language", "Interrupt Mode", "Custom Voices"],
		code: `new TTSPlugin({ defaultLang: "en" })`,
	},
];

const extensions = [
	{
		name: "Voice Extension",
		description: "Speech-to-Text with Google Speech API, voice commands support.",
		icon: Mic,
		color: "from-purple-500 to-purple-600",
		features: ["Speech-to-Text", "Voice Commands", "Multi-language"],
		code: `new voiceExt(null, { lang: "en-US" })`,
	},
	{
		name: "Lavalink Extension",
		description: "Lavalink server management with load balancing and auto-reconnect.",
		icon: Headphones,
		color: "from-indigo-500 to-indigo-600",
		features: ["Node Management", "Load Balancing", "Auto-reconnect"],
		code: `new lavalinkExt(null, { nodes: [...] })`,
	},
	{
		name: "Lyrics Extension",
		description: "Search and display lyrics from multiple providers.",
		icon: Layers,
		color: "from-pink-500 to-pink-600",
		features: ["Multiple Providers", "LRC Support", "Auto-fetch"],
		code: `new lyricsExt(null, { provider: "lrclib" })`,
	},
];

export function PluginsSection() {
	return (
		<section className='py-20 relative'>
			<div className='max-w-7xl mx-auto px-4'>
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='text-center mb-16'>
					<h2 className='text-4xl lg:text-5xl font-bold mb-6'>
						<span className='text-white'>Plugins & </span>
						<span className='gradient-text'>Extensions</span>
					</h2>
					<p className='text-xl text-white/70 max-w-3xl mx-auto leading-relaxed'>
						Discover our powerful collection of plugins and extensions, ready to use or customize according to your needs.
					</p>
				</motion.div>

				{/* Plugins */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='mb-16'>
					<h3 className='text-2xl font-bold text-white mb-8 text-center'>Plugins</h3>
					<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
						{plugins.map((plugin, index) => (
							<motion.div
								key={plugin.name}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								className='group relative'>
								<div className='glass-strong rounded-xl p-6 h-full hover:scale-105 transition-transform duration-300'>
									{/* Icon */}
									<div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${plugin.color} mb-4`}>
										<plugin.icon className='w-6 h-6 text-white' />
									</div>

									{/* Content */}
									<h4 className='text-xl font-bold text-white mb-2'>{plugin.name}</h4>
									<p className='text-white/70 text-sm mb-4 leading-relaxed'>{plugin.description}</p>

									{/* Features */}
									<div className='space-y-2 mb-4'>
										{plugin.features.map((feature, idx) => (
											<div
												key={idx}
												className='flex items-center gap-2'>
												<div className='w-1.5 h-1.5 bg-brand-400 rounded-full' />
												<span className='text-xs text-white/60'>{feature}</span>
											</div>
										))}
									</div>

									{/* Code */}
									<div className='bg-black/30 rounded-lg p-3 mb-4'>
										<code className='text-xs text-brand-300'>{plugin.code}</code>
									</div>

									{/* Hover effect */}
									<div className='absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Extensions */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='mb-16'>
					<h3 className='text-2xl font-bold text-white mb-8 text-center'>Extensions</h3>
					<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{extensions.map((extension, index) => (
							<motion.div
								key={extension.name}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								className='group relative'>
								<div className='glass-strong rounded-xl p-6 h-full hover:scale-105 transition-transform duration-300'>
									{/* Icon */}
									<div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${extension.color} mb-4`}>
										<extension.icon className='w-6 h-6 text-white' />
									</div>

									{/* Content */}
									<h4 className='text-xl font-bold text-white mb-2'>{extension.name}</h4>
									<p className='text-white/70 text-sm mb-4 leading-relaxed'>{extension.description}</p>

									{/* Features */}
									<div className='space-y-2 mb-4'>
										{extension.features.map((feature, idx) => (
											<div
												key={idx}
												className='flex items-center gap-2'>
												<div className='w-1.5 h-1.5 bg-brand-400 rounded-full' />
												<span className='text-xs text-white/60'>{feature}</span>
											</div>
										))}
									</div>

									{/* Code */}
									<div className='bg-black/30 rounded-lg p-3'>
										<code className='text-xs text-brand-300'>{extension.code}</code>
									</div>

									{/* Hover effect */}
									<div className='absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Bottom CTA */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className='text-center'>
					<div className='glass-strong rounded-2xl p-8 max-w-2xl mx-auto'>
						<h3 className='text-2xl font-bold text-white mb-4'>Create Custom Plugin</h3>
						<p className='text-white/70 mb-6'>Can't find the right plugin? Create your own custom plugin with our simple API.</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<a
								href='/docs/plugins'
								className='btn-primary group inline-flex items-center gap-2'>
								View Documentation
								<ExternalLink className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
							</a>
							<a
								href='https://github.com/ZiProject/ZiPlayer/tree/main/examples'
								target='_blank'
								rel='noopener noreferrer'
								className='btn-secondary group inline-flex items-center gap-2'>
								Example Code
								<ExternalLink className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
