"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Github, Star } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "./CodeBlock";
import { Logo } from "./Logo";

const exampleCode = `import { PlayerManager } from "ziplayer";
import { SoundCloudPlugin, YouTubePlugin, SpotifyPlugin, TTSPlugin } from "@ziplayer/plugin";
import { voiceExt, lavalinkExt } from "@ziplayer/extension";

const manager = new PlayerManager({
  plugins: [
    new TTSPlugin({ defaultLang: "en" }),
    new YouTubePlugin(),
    new SoundCloudPlugin(),
    new SpotifyPlugin()
  ],
  extensions: [
    new voiceExt(null, { lang: "en-US" }),
    new lavalinkExt(null, { nodes: [...] })
  ]
});

const player = await manager.create(guildId, {
  tts: { interrupt: true, volume: 1 },
  leaveOnEnd: true,
  leaveTimeout: 30000,
});

await player.connect(voiceChannel);
await player.play("Never Gonna Give You Up", userId);
await player.play("tts: Hello everyone!", userId);`;

export function HeroSection() {
	return (
		<section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
			{/* Background elements */}
			<div className='absolute inset-0 bg-hero-pattern opacity-30' />

			{/* Main content */}
			<div className='relative z-10 max-w-7xl mx-auto px-4 py-20'>
				<div className='grid lg:grid-cols-2 gap-12 items-center'>
					{/* Left side - Text content */}
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
						className='space-y-8'>
						{/* Badge */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className='inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle border border-brand-500/30'>
							<Star className='w-4 h-4 text-brand-400' />
							<span className='text-sm font-medium text-brand-300'>Discord Audio, Reimagined</span>
						</motion.div>

						{/* Logo và heading */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.3 }}
							className='text-center lg:text-left'>
							<Logo
								variant='full'
								className='mx-auto lg:mx-0'
								animated={false}
							/>

							<h1 className='text-3xl lg:text-5xl font-bold leading-tight'>
								<span className='gradient-text-animated'>Next Level</span>
								<br />
								<span className='text-white'>Discord Audio</span>
							</h1>
						</motion.div>

						{/* Subtitle */}
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
							className='text-xl text-white/80 leading-relaxed max-w-lg'>
							Modular Discord voice player with powerful plugin system, voice commands, TTS integration, Lavalink support and many
							other advanced features.
						</motion.p>

						{/* CTA Buttons */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.5 }}
							className='flex flex-col sm:flex-row gap-4'>
							<Link
								href='/docs/getting-started'
								className='btn-primary group inline-flex items-center gap-2'>
								Get Started
								<ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform duration-300' />
							</Link>

							<a
								href='https://github.com/ZiProject/ZiPlayer'
								target='_blank'
								rel='noopener noreferrer'
								className='btn-secondary group inline-flex items-center gap-2'>
								<Github className='w-5 h-5' />
								GitHub
							</a>
						</motion.div>

						{/* Stats */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.6 }}
							className='flex items-center gap-8 pt-8'>
							<div className='text-center'>
								<div className='text-2xl font-bold text-white'>100%</div>
								<div className='text-sm text-white/60'>TypeScript</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-white'>4+</div>
								<div className='text-sm text-white/60'>Plugins</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-white'>3+</div>
								<div className='text-sm text-white/60'>Extensions</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-white'>∞</div>
								<div className='text-sm text-white/60'>Possibilities</div>
							</div>
						</motion.div>
					</motion.div>

					{/* Right side - Code example */}
					<motion.div
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
						className='relative'>
						<div className='relative'>
							{/* Floating elements */}
							<motion.div
								animate={{
									y: [0, -10, 0],
									rotate: [0, 5, 0],
								}}
								transition={{
									duration: 4,
									repeat: Infinity,
									ease: "easeInOut",
								}}
								className='absolute -top-4 -right-4 w-8 h-8 bg-brand-500/20 rounded-full blur-sm'
							/>
							<motion.div
								animate={{
									y: [0, 10, 0],
									rotate: [0, -5, 0],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
									delay: 1,
								}}
								className='absolute -bottom-4 -left-4 w-6 h-6 bg-purple-500/20 rounded-full blur-sm'
							/>

							<CodeBlock
								code={exampleCode}
								language='typescript'
								className='transform hover:scale-105 transition-transform duration-500'
							/>
						</div>
					</motion.div>
				</div>
			</div>

			{/* Scroll indicator */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1, delay: 1 }}
				className='absolute bottom-8 left-1/2 transform -translate-x-1/2'>
				<motion.div
					animate={{ y: [0, 10, 0] }}
					transition={{ duration: 2, repeat: Infinity }}
					className='w-6 h-10 border-2 border-white/30 rounded-full flex justify-center'>
					<motion.div
						animate={{ y: [0, 12, 0] }}
						transition={{ duration: 2, repeat: Infinity }}
						className='w-1 h-3 bg-white/60 rounded-full mt-2'
					/>
				</motion.div>
			</motion.div>
		</section>
	);
}
