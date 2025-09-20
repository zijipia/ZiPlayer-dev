"use client";

import { motion } from "framer-motion";
import { Mic, MessageSquare, Volume2, Brain, Zap, Headphones } from "lucide-react";

const voiceFeatures = [
	{
		icon: Mic,
		title: "Speech-to-Text",
		description: "Convert speech to text with high accuracy",
		details: [
			"Multi-language support (en-US, vi-VN, ja-JP, ...)",
			"Google Speech API v2 integration",
			"Automatic detection when user stops speaking",
			"Filter bot users and focus on specific users",
			"Configurable silence delay and duration",
		],
		code: `// Voice extension setup
const voiceExt = new voiceExt(null, {
  lang: "en-US",
  minimalVoiceMessageDuration: 1,
  postSilenceDelayMs: 2000,
  ignoreBots: true,
  profanityFilter: false,
});

// Listen to voice events
manager.on("voiceCreate", (player, evt) => {
  console.log(\`User \${evt.userId} said: \${evt.content}\`);
  // Process voice command here
});`,
	},
	{
		icon: MessageSquare,
		title: "Text-to-Speech",
		description: "Convert text to speech with high quality",
		details: [
			"Google TTS integration with multiple voices",
			"Interrupt mode - doesn't interrupt music",
			"Multi-language and speech rate support",
			"Custom TTS provider support",
			"Separate volume control for TTS",
		],
		code: `// TTS setup with interrupt mode
const player = await manager.create(guildId, {
  tts: {
    createPlayer: true,
    interrupt: true,
    volume: 1,
  },
});

// Play TTS
await player.play("tts: Hello everyone!", userId);
await player.play("tts:en:1:Have a great day everyone!", userId);

// TTS events
manager.on("ttsStart", (plr, { track }) => {
  console.log("TTS started:", track?.title);
});
manager.on("ttsEnd", (plr) => {
  console.log("TTS ended, resuming music");
});`,
	},
	{
		icon: Brain,
		title: "Voice Commands",
		description: "Control bot with natural voice commands",
		details: [
			"Automatic voice command processing",
			"Integration with player controls",
			"Custom command recognition",
			"Multi-language command support",
			"Context-aware responses",
		],
		code: `// Voice command handler
manager.on("voiceCreate", (player, evt) => {
  const command = evt.content.toLowerCase();
  
  switch (command) {
    case "play":
      // Resume music
      player.resume();
      break;
    case "pause":
      // Pause music
      player.pause();
      break;
    case "skip":
      // Skip current track
      player.skip();
      break;
    case "volume up":
      // Increase volume
      player.setVolume(Math.min(player.volume + 0.1, 2));
      break;
    case "volume down":
      // Decrease volume
      player.setVolume(Math.max(player.volume - 0.1, 0));
      break;
  }
});`,
	},
];

const audioFeatures = [
	{
		icon: Volume2,
		title: "Advanced Audio Processing",
		description: "Advanced audio processing with multiple options",
		details: [
			"Volume control 0-200%",
			"Audio quality optimization",
			"Multiple format support",
			"Stream processing",
			"Error handling & recovery",
		],
	},
	{
		icon: Headphones,
		title: "Lavalink Integration",
		description: "Lavalink integration for high performance",
		details: ["Automatic node management", "Load balancing", "Auto-reconnect", "Performance monitoring", "Scalable architecture"],
	},
	{
		icon: Zap,
		title: "Real-time Processing",
		description: "Real-time processing with low latency",
		details: [
			"Low-latency audio",
			"Real-time voice processing",
			"Instant command response",
			"Optimized performance",
			"Memory efficient",
		],
	},
];

export function VoiceFeaturesSection() {
	return (
		<section className='py-20 relative bg-gradient-to-b from-black/20 to-transparent'>
			<div className='max-w-7xl mx-auto px-4'>
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='text-center mb-16'>
					<h2 className='text-4xl lg:text-5xl font-bold mb-6'>
						<span className='text-white'>Voice & </span>
						<span className='gradient-text'>Audio</span>
					</h2>
					<p className='text-xl text-white/70 max-w-3xl mx-auto leading-relaxed'>
						Advanced voice and audio experience with AI features and real-time processing.
					</p>
				</motion.div>

				{/* Voice Features */}
				<div className='space-y-16 mb-20'>
					{voiceFeatures.map((feature, index) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: index * 0.2 }}
							className='grid lg:grid-cols-2 gap-12 items-center'>
							{/* Feature info */}
							<div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
								<div className='flex items-center gap-4 mb-6'>
									<div className='p-4 rounded-2xl bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/30'>
										<feature.icon className='w-8 h-8 text-brand-400' />
									</div>
									<div>
										<h3 className='text-3xl font-bold text-white mb-2'>{feature.title}</h3>
										<p className='text-white/70 text-lg'>{feature.description}</p>
									</div>
								</div>

								{/* Details */}
								<ul className='space-y-3 mb-8'>
									{feature.details.map((detail, idx) => (
										<li
											key={idx}
											className='flex items-start gap-3'>
											<div className='w-2 h-2 bg-brand-400 rounded-full mt-2 flex-shrink-0' />
											<span className='text-white/80'>{detail}</span>
										</li>
									))}
								</ul>
							</div>

							{/* Code example */}
							<div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
								<div className='relative'>
									<div className='absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-2xl blur-xl' />
									<div className='relative bg-black/50 rounded-2xl p-6 border border-white/10'>
										<div className='flex items-center gap-2 mb-4'>
											<div className='w-3 h-3 bg-red-500 rounded-full' />
											<div className='w-3 h-3 bg-yellow-500 rounded-full' />
											<div className='w-3 h-3 bg-green-500 rounded-full' />
											<span className='text-sm text-white/60 ml-4'>Voice Features</span>
										</div>
										<pre className='text-sm text-white/90 overflow-x-auto'>
											<code>{feature.code}</code>
										</pre>
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Audio Features Grid */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='mb-16'>
					<h3 className='text-2xl font-bold text-white mb-8 text-center'>Audio Processing</h3>
					<div className='grid md:grid-cols-3 gap-6'>
						{audioFeatures.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								className='glass-strong rounded-xl p-6 hover:scale-105 transition-transform duration-300'>
								<div className='flex items-center gap-4 mb-4'>
									<div className='p-3 rounded-lg bg-gradient-to-r from-brand-500/20 to-purple-500/20'>
										<feature.icon className='w-6 h-6 text-brand-400' />
									</div>
									<h4 className='text-xl font-bold text-white'>{feature.title}</h4>
								</div>
								<p className='text-white/70 mb-4'>{feature.description}</p>
								<ul className='space-y-2'>
									{feature.details.map((detail, idx) => (
										<li
											key={idx}
											className='flex items-start gap-2'>
											<div className='w-1.5 h-1.5 bg-brand-400 rounded-full mt-2 flex-shrink-0' />
											<span className='text-sm text-white/60'>{detail}</span>
										</li>
									))}
								</ul>
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
						<h3 className='text-2xl font-bold text-white mb-4'>Get Started with Voice Features</h3>
						<p className='text-white/70 mb-6'>Explore detailed documentation about voice commands, TTS and audio processing.</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<a
								href='/docs/voice-commands'
								className='btn-primary'>
								Voice Commands
							</a>
							<a
								href='/docs/tts'
								className='btn-secondary'>
								TTS Integration
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
