"use client";

import { motion } from "framer-motion";
import {
	Zap,
	Puzzle,
	Settings,
	Shield,
	Code,
	Users,
	Music,
	BarChart3,
	Mic,
	Headphones,
	MessageSquare,
	Layers,
	Volume2,
	Brain,
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
	{
		icon: Puzzle,
		title: "Plugin System",
		description: "Powerful plugin system with YouTube, SoundCloud, Spotify, TTS and easy custom plugin creation.",
	},
	{
		icon: Zap,
		title: "High Performance",
		description:
			"Optimized for high performance with TypeScript, multi-guild support and handling thousands of concurrent requests.",
	},
	{
		icon: Settings,
		title: "Rich Controls",
		description: "Rich queue controls with auto-play, shuffle, repeat, volume control and many other advanced features.",
	},
	{
		icon: Shield,
		title: "Production Ready",
		description: "Production ready with error handling, logging, monitoring and top-tier security features.",
	},
	{
		icon: Code,
		title: "Developer Friendly",
		description: "Simple API, detailed documentation, TypeScript support and active community support.",
	},
	{
		icon: Users,
		title: "Multi-Guild Support",
		description: "Multi-guild support with separate player management for each server, no data conflicts.",
	},
	{
		icon: Music,
		title: "Audio Quality",
		description: "High audio quality with multiple format support, optimized bitrate and professional audio processing.",
	},
	{
		icon: BarChart3,
		title: "Analytics & Monitoring",
		description: "Performance tracking, usage statistics and real-time monitoring to optimize user experience.",
	},
	{
		icon: Mic,
		title: "Voice Commands",
		description: "Control bot with voice using Speech-to-Text, multi-language support and accurate recognition.",
	},
	{
		icon: Headphones,
		title: "Lavalink Support",
		description: "Lavalink server support with automatic node management, load balancing and high scalability.",
	},
	{
		icon: MessageSquare,
		title: "TTS Integration",
		description: "Text-to-Speech integration with interrupt mode, play notifications without interrupting music.",
	},
	{
		icon: Layers,
		title: "Lyrics Display",
		description: "Automatic lyrics search and display, multiple provider support and LRC format.",
	},
	{
		icon: Volume2,
		title: "Advanced Audio",
		description: "Advanced audio processing with multiple source support, automatic fallback and quality optimization.",
	},
	{
		icon: Brain,
		title: "Modular Architecture",
		description: "Modular architecture with extension system, easy to extend and customize according to needs.",
	},
];

export function FeaturesSection() {
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
						<span className='text-white'>Why choose </span>
						<span className='gradient-text'>ZiPlayer?</span>
					</h2>
					<p className='text-xl text-white/70 max-w-3xl mx-auto leading-relaxed'>
						ZiPlayer is designed to deliver the best Discord music experience with cutting-edge technology and user-friendly
						interface.
					</p>
				</motion.div>

				{/* Features grid */}
				<div className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
					{features.map((feature, index) => (
						<FeatureCard
							key={feature.title}
							icon={feature.icon}
							title={feature.title}
							description={feature.description}
							delay={index * 0.1}
						/>
					))}
				</div>

				{/* Bottom CTA */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className='text-center mt-16'>
					<div className='glass-strong rounded-2xl p-8 max-w-2xl mx-auto'>
						<h3 className='text-2xl font-bold text-white mb-4'>Ready to get started?</h3>
						<p className='text-white/70 mb-6'>Explore detailed documentation and start building your Discord bot today.</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<a
								href='/docs/getting-started'
								className='btn-primary'>
								View Documentation
							</a>
							<a
								href='https://github.com/ZiProject/ZiPlayer'
								target='_blank'
								rel='noopener noreferrer'
								className='btn-secondary'>
								GitHub Repository
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
