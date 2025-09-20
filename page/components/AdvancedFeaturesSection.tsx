"use client";

import { motion } from "framer-motion";
import { Mic, Headphones, MessageSquare, Layers, Code2, Zap } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const advancedFeatures = [
	{
		icon: Mic,
		title: "Voice Commands",
		description: "Control bot with voice using Speech-to-Text, multi-language support and accurate recognition.",
		code: `// Voice extension with Google Speech API
const voiceExt = new voiceExt(null, {
  lang: "en-US",
  minimalVoiceMessageDuration: 1,
  postSilenceDelayMs: 2000,
});

// Listen to voice commands
manager.on("voiceCreate", (player, evt) => {
  console.log(\`User \${evt.userId} said: \${evt.content}\`);
});`,
	},
	{
		icon: Headphones,
		title: "Lavalink Support",
		description: "Lavalink server support with automatic node management, load balancing and high scalability.",
		code: `// Lavalink extension with node management
const lavalink = new lavalinkExt(null, {
  nodes: [{
    identifier: "main",
    password: "youshallnotpass",
    host: "localhost",
    port: 2333,
    secure: false,
  }],
  client: client,
  searchPrefix: "scsearch",
});`,
	},
	{
		icon: MessageSquare,
		title: "TTS Integration",
		description: "Text-to-Speech integration with interrupt mode, play notifications without interrupting music.",
		code: `// TTS with interrupt mode
const player = await manager.create(guildId, {
  tts: {
    createPlayer: true,
    interrupt: true,
    volume: 1,
  },
});

// Play TTS without interrupting music
await player.play("tts: Hello everyone!", userId);`,
	},
	{
		icon: Layers,
		title: "Lyrics Display",
		description: "Automatic lyrics search and display, multiple provider support and LRC format.",
		code: `// Lyrics extension
const lyricsExt = new lyricsExt(null, {
  provider: "lrclib",
  includeSynced: true,
  autoFetchOnTrackStart: true,
});

// Get lyrics
const lyrics = await lyricsExt.getLyrics(track);
console.log(lyrics.text);`,
	},
	{
		icon: Code2,
		title: "Modular Architecture",
		description: "Modular architecture with extension system, easy to extend and customize according to needs.",
		code: `// Create custom extension
class MyExtension extends BaseExtension {
  name = "myExtension";
  version = "1.0.0";
  
  async onRegister(context) {
    // Initialization logic
  }
  
  async beforePlay(request) {
    // Pre-play processing
  }
}`,
	},
	{
		icon: Zap,
		title: "High Performance",
		description: "Performance optimized with TypeScript, multi-guild support and handling thousands of concurrent requests.",
		code: `// Manage multiple guilds
const players = new Map();

guilds.forEach(guild => {
  const player = manager.create(guild.id, {
    leaveOnEnd: true,
    leaveTimeout: 30000,
  });
  players.set(guild.id, player);
});`,
	},
];

export function AdvancedFeaturesSection() {
	return (
		<section className='py-20 relative bg-gradient-to-b from-transparent to-black/20'>
			<div className='max-w-7xl mx-auto px-4'>
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='text-center mb-16'>
					<h2 className='text-4xl lg:text-5xl font-bold mb-6'>
						<span className='text-white'>Advanced </span>
						<span className='gradient-text'>Features</span>
					</h2>
					<p className='text-xl text-white/70 max-w-3xl mx-auto leading-relaxed'>
						Discover powerful features that make ZiPlayer the most complete Discord audio solution.
					</p>
				</motion.div>

				{/* Advanced features grid */}
				<div className='space-y-12'>
					{advancedFeatures.map((feature, index) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: index * 0.1 }}
							className='grid lg:grid-cols-2 gap-8 items-center'>
							{/* Feature info */}
							<div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
								<div className='flex items-center gap-4 mb-4'>
									<div className='p-3 rounded-xl bg-brand-500/20 border border-brand-500/30'>
										<feature.icon className='w-8 h-8 text-brand-400' />
									</div>
									<h3 className='text-2xl font-bold text-white'>{feature.title}</h3>
								</div>
								<p className='text-white/70 text-lg leading-relaxed mb-6'>{feature.description}</p>
							</div>

							{/* Code example */}
							<div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
								<div className='relative'>
									<div className='absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-xl blur-xl' />
									<div className='relative bg-black/50 rounded-xl p-6 border border-white/10'>
										<pre className='text-sm text-white/90 overflow-x-auto'>
											<code>{feature.code}</code>
										</pre>
									</div>
								</div>
							</div>
						</motion.div>
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
						<h3 className='text-2xl font-bold text-white mb-4'>Ready to explore?</h3>
						<p className='text-white/70 mb-6'>Start building your Discord bot with advanced features today.</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<a
								href='/docs/getting-started'
								className='btn-primary'>
								Get Started
							</a>
							<a
								href='https://github.com/ZiProject/ZiPlayer'
								target='_blank'
								rel='noopener noreferrer'
								className='btn-secondary'>
								View on GitHub
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
