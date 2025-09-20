"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { motion } from "framer-motion";
import { Play, Music, Bot, Zap, CheckCircle, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

const basicBotCode = `import { Client, GatewayIntentBits } from "discord.js";
import { PlayerManager } from "ziplayer";
import { YouTubePlugin, SoundCloudPlugin } from "@ziplayer/plugin";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});

const manager = new PlayerManager({
  plugins: [
    new YouTubePlugin(),
    new SoundCloudPlugin()
  ]
});

client.on("ready", () => {
  console.log("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith("!play")) {
    const query = message.content.slice(6);
    const player = await manager.create(message.guild.id);
    
    try {
      await player.connect(message.member.voice.channel);
      await player.play(query, message.author.id);
      
      message.reply(\`Đang phát: \${query}\`);
    } catch (error) {
      message.reply("Không thể phát nhạc: " + error.message);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);`;

const advancedBotCode = `import { Client, GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import { PlayerManager } from "ziplayer";
import { YouTubePlugin, SoundCloudPlugin, SpotifyPlugin } from "@ziplayer/plugin";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});

const manager = new PlayerManager({
  plugins: [
    new YouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY }),
    new SoundCloudPlugin({ clientId: process.env.SOUNDCLOUD_CLIENT_ID }),
    new SpotifyPlugin({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    })
  ]
});

// Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Phát nhạc")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Tên bài hát hoặc URL")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Bỏ qua bài hiện tại"),
  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Xem danh sách phát"),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Dừng phát nhạc")
];

client.on("ready", async () => {
  console.log("Bot is ready!");
  await client.application.commands.set(commands);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const player = await manager.create(interaction.guild.id);
  
  switch (interaction.commandName) {
    case "play":
      const query = interaction.options.getString("query");
      
      try {
        await player.connect(interaction.member.voice.channel);
        await player.play(query, interaction.user.id);
        
        await interaction.reply(\`🎵 Đang phát: \${query}\`);
      } catch (error) {
        await interaction.reply("❌ Không thể phát nhạc: " + error.message);
      }
      break;
      
    case "skip":
      if (player.queue.length > 0) {
        player.queue.skip();
        await interaction.reply("⏭️ Đã bỏ qua bài hiện tại");
      } else {
        await interaction.reply("❌ Không có bài nào trong queue");
      }
      break;
      
    case "queue":
      const queue = player.queue;
      if (queue.length === 0) {
        await interaction.reply("📝 Queue trống");
        return;
      }
      
      const queueList = queue.map((track, index) => 
        \`\${index + 1}. \${track.title}\`
      ).join("\\n");
      
      await interaction.reply(\`📝 Danh sách phát:\\n\${queueList}\`);
      break;
      
    case "stop":
      player.stop();
      await interaction.reply("⏹️ Đã dừng phát nhạc");
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);`;

const examples = [
	{
		icon: Bot,
		title: "Basic Bot",
		description: "Bot Discord cơ bản với chức năng phát nhạc",
		features: ["Play command", "Error handling", "Voice channel support"],
		color: "from-blue-500 to-cyan-500",
	},
	{
		icon: Music,
		title: "Advanced Bot",
		description: "Bot với slash commands và nhiều tính năng",
		features: ["Slash commands", "Queue management", "Volume control", "Shuffle"],
		color: "from-purple-500 to-pink-500",
	},
	{
		icon: Zap,
		title: "Full Featured Bot",
		link: "https://github.com/ZiProject/Ziji-bot-discord",
		description: "Bot hoàn chỉnh với TTS, lyrics và UI đẹp",
		features: ["TTS notifications", "Lyrics display", "Rich embeds", "Error recovery"],
		color: "from-green-500 to-emerald-500",
	},
];

export default function ExamplesDocs() {
	return (
		<Layout>
			<div className='min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900'>
				<div className='max-w-7xl mx-auto px-4 py-8'>
					<div className='grid lg:grid-cols-4 gap-8'>
						{/* Sidebar */}
						<aside className='lg:col-span-1'>
							<Sidebar />
						</aside>

						{/* Main content */}
						<main className='lg:col-span-3 space-y-12'>
							{/* Header */}
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
								className='text-center lg:text-left'>
								<h1 className='text-4xl lg:text-5xl font-bold mb-6'>
									<span className='text-white'>Examples & </span>
									<span className='gradient-text'>Templates</span>
								</h1>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Các ví dụ thực tế và templates để bắt đầu xây dựng Discord music bot với ZiPlayer một cách nhanh chóng và hiệu
									quả.
								</p>
							</motion.div>

							{/* Examples Overview */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className='grid md:grid-cols-3 gap-6'>
								{examples.map((example, index) => (
									<motion.div
										key={example.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
										className='card-hover'>
										<div className='flex flex-col h-full'>
											<div
												className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${example.color} flex items-center justify-center mb-4`}>
												<example.icon className='w-8 h-8 text-white' />
											</div>

											<div className='flex-1 space-y-3'>
												{example?.link && (
													<Link href={example?.link}>
														<h3 className='text-xl font-bold text-white'>{example.title}</h3>
													</Link>
												)}
												{!example?.link && <h3 className='text-xl font-bold text-white'>{example.title}</h3>}
												<p className='text-white/70 leading-relaxed'>{example.description}</p>
												<ul className='text-sm text-white/60 space-y-1'>
													{example.features.map((feature, idx) => (
														<li
															key={idx}
															className='flex items-center gap-2'>
															<CheckCircle className='w-3 h-3 text-green-400 flex-shrink-0' />
															{feature}
														</li>
													))}
												</ul>
											</div>
										</div>
									</motion.div>
								))}
							</motion.section>

							{/* Basic Bot Example */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20'>
										<Bot className='w-6 h-6 text-blue-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Basic Music Bot</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>Bot Discord cơ bản với chức năng phát nhạc từ YouTube và SoundCloud.</p>

								<CodeBlock
									code={basicBotCode}
									language='typescript'
									className='mb-8'
								/>

								<div className='grid md:grid-cols-2 gap-6'>
									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Tính năng</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Lệnh !play để phát nhạc</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Hỗ trợ YouTube và SoundCloud</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Xử lý lỗi cơ bản</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Auto-connect voice channel</span>
											</li>
										</ul>
									</div>

									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Setup</h3>
										<ol className='space-y-2 text-white/70 text-sm list-decimal list-inside'>
											<li>Cài đặt dependencies</li>
											<li>Tạo Discord bot token</li>
											<li>Thêm bot vào server</li>
											<li>Chạy bot và test</li>
										</ol>
									</div>
								</div>
							</motion.section>

							{/* Advanced Bot Example */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.6 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20'>
										<Music className='w-6 h-6 text-purple-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Advanced Music Bot</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Bot với slash commands, queue management và nhiều tính năng nâng cao.
								</p>

								<CodeBlock
									code={advancedBotCode}
									language='typescript'
									className='mb-8'
								/>

								<div className='grid md:grid-cols-2 gap-6'>
									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Slash Commands</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>/play - Phát nhạc</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>/skip - Bỏ qua bài</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>/queue - Xem danh sách</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>/stop - Dừng phát</span>
											</li>
										</ul>
									</div>

									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Features</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Rich embeds</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Error handling</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Event notifications</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Multi-plugin support</span>
											</li>
										</ul>
									</div>
								</div>
							</motion.section>

							{/* Getting Started */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.8 }}
								className='glass-strong rounded-2xl p-8 text-center'>
								<h2 className='text-2xl font-bold text-white mb-4'>🚀 Bắt đầu ngay!</h2>
								<p className='text-white/70 mb-6'>Chọn một trong các ví dụ trên và bắt đầu xây dựng music bot của bạn.</p>
								<div className='flex flex-col sm:flex-row gap-4 justify-center'>
									<a
										href='/docs/getting-started'
										className='btn-primary inline-flex items-center gap-2'>
										Hướng dẫn cài đặt
										<ArrowRight className='w-4 h-4' />
									</a>
									<a
										href='https://github.com/ZiProject/ZiPlayer'
										target='_blank'
										rel='noopener noreferrer'
										className='btn-secondary inline-flex items-center gap-2'>
										GitHub Repository
										<ArrowRight className='w-4 h-4' />
									</a>
								</div>
							</motion.section>
						</main>
					</div>
				</div>
			</div>
		</Layout>
	);
}
