"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { motion } from "framer-motion";
import { Download, Play, Settings, Zap, CheckCircle, ArrowRight, Copy } from "lucide-react";

const installationCode = `npm install ziplayer @ziplayer/plugin @ziplayer/extension @discordjs/voice discord.js`;

const managerCode = `import { PlayerManager } from "ziplayer";
import { SoundCloudPlugin, YouTubePlugin, SpotifyPlugin } from "@ziplayer/plugin";
import { voiceExt } from "@ziplayer/extension";

const manager = new PlayerManager({
  plugins: [
    new SoundCloudPlugin(), 
    new YouTubePlugin(), 
    new SpotifyPlugin()
  ],
  extensions: [new voiceExt(null, { lang: "vi-VN" })],
});`;

const playerCode = `const player = manager.create(guildId, {
  leaveOnEnd: true,
  leaveTimeout: 30000,
  userdata: { channel: textChannel },
  extensions: ["voiceExt"],
});

await player.connect(voiceChannel);
await player.play("Never Gonna Give You Up", userId);

// Auto play & playlists
player.queue.autoPlay(true);
await player.play("https://www.youtube.com/playlist?list=PL123", userId);`;

const eventsCode = `player.on("willPlay", (player, track) => {
  console.log("Up next:", track.title);
});

player.on("trackStart", (player, track) => {
  console.log("Now playing:", track.title);
});

player.on("trackEnd", (player, track) => {
  console.log("Finished:", track.title);
});`;

const steps = [
	{
		icon: Download,
		title: "Cài đặt packages",
		description: "Cài đặt các package cần thiết cho dự án của bạn",
		code: installationCode,
	},
	{
		icon: Settings,
		title: "Tạo PlayerManager",
		description: "Khởi tạo và cấu hình PlayerManager với các plugins",
		code: managerCode,
	},
	{
		icon: Play,
		title: "Tạo và sử dụng Player",
		description: "Tạo player cho guild và bắt đầu phát nhạc",
		code: playerCode,
	},
	{
		icon: Zap,
		title: "Xử lý Events",
		description: "Lắng nghe và xử lý các sự kiện của player",
		code: eventsCode,
	},
];

export default function GettingStarted() {
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
									<span className='text-white'>Bắt đầu nhanh</span>
								</h1>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Hướng dẫn từng bước để thiết lập ZiPlayer trong dự án Discord bot của bạn. Chỉ cần vài phút để có một music bot
									hoàn chỉnh!
								</p>
							</motion.div>

							{/* Steps */}
							<div className='space-y-8'>
								{steps.map((step, index) => (
									<motion.section
										key={step.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.6, delay: index * 0.2 }}
										className='glass-strong rounded-2xl p-8'>
										<div className='flex items-start gap-6'>
											{/* Step number and icon */}
											<div className='flex-shrink-0'>
												<div className='flex items-center gap-4'>
													{/* <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg'>
														{index + 1}
													</div> */}
													<div className='p-3 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20'>
														<step.icon className='w-6 h-6 text-brand-400' />
													</div>
												</div>
											</div>

											{/* Content */}
											<div className='flex-1 space-y-4'>
												<div>
													<h2 className='text-2xl font-bold text-white mb-2'>{step.title}</h2>
													<p className='text-white/70 text-lg'>{step.description}</p>
												</div>

												<CodeBlock
													code={step.code}
													language='typescript'
													className='mt-6'
												/>
											</div>
										</div>
									</motion.section>
								))}
							</div>

							{/* Next Steps */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.8 }}
								className='glass-strong rounded-2xl p-8'>
								<h2 className='text-2xl font-bold text-white mb-6 text-center'>Bước tiếp theo</h2>

								<div className='grid md:grid-cols-3 gap-6'>
									<div className='text-center space-y-4'>
										<div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto'>
											<Play className='w-8 h-8 text-blue-400' />
										</div>
										<h3 className='text-lg font-semibold text-white'>Player & Manager</h3>
										<p className='text-white/70 text-sm'>Tìm hiểu chi tiết về Player và PlayerManager APIs</p>
										<a
											href='/docs/player'
											className='inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors duration-200'>
											Xem tài liệu
											<ArrowRight className='w-4 h-4' />
										</a>
									</div>

									<div className='text-center space-y-4'>
										<div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto'>
											<Settings className='w-8 h-8 text-purple-400' />
										</div>
										<h3 className='text-lg font-semibold text-white'>Queue & Controls</h3>
										<p className='text-white/70 text-sm'>Khám phá các tính năng điều khiển queue và phát nhạc</p>
										<a
											href='/docs/queue'
											className='inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors duration-200'>
											Xem tài liệu
											<ArrowRight className='w-4 h-4' />
										</a>
									</div>

									<div className='text-center space-y-4'>
										<div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto'>
											<Zap className='w-8 h-8 text-green-400' />
										</div>
										<h3 className='text-lg font-semibold text-white'>Events</h3>
										<p className='text-white/70 text-sm'>Tìm hiểu cách xử lý events và tương tác với player</p>
										<a
											href='/docs/events'
											className='inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors duration-200'>
											Xem tài liệu
											<ArrowRight className='w-4 h-4' />
										</a>
									</div>
								</div>
							</motion.section>

							{/* Tips */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 1.0 }}
								className='glass-subtle rounded-2xl p-8'>
								<h2 className='text-2xl font-bold text-white mb-6 text-center'>💡 Mẹo hữu ích</h2>

								<div className='grid md:grid-cols-2 gap-6'>
									<div className='flex items-start gap-4'>
										<CheckCircle className='w-6 h-6 text-green-400 flex-shrink-0 mt-1' />
										<div>
											<h3 className='text-lg font-semibold text-white mb-2'>Sử dụng TypeScript</h3>
											<p className='text-white/70'>
												ZiPlayer được viết hoàn toàn bằng TypeScript, cung cấp type safety và IntelliSense tốt nhất.
											</p>
										</div>
									</div>

									<div className='flex items-start gap-4'>
										<CheckCircle className='w-6 h-6 text-green-400 flex-shrink-0 mt-1' />
										<div>
											<h3 className='text-lg font-semibold text-white mb-2'>Error Handling</h3>
											<p className='text-white/70'>Luôn xử lý lỗi khi kết nối voice channel và phát nhạc để tránh crash bot.</p>
										</div>
									</div>

									<div className='flex items-start gap-4'>
										<CheckCircle className='w-6 h-6 text-green-400 flex-shrink-0 mt-1' />
										<div>
											<h3 className='text-lg font-semibold text-white mb-2'>Memory Management</h3>
											<p className='text-white/70'>
												Sử dụng leaveOnEnd và leaveTimeout để tự động dọn dẹp player khi không cần thiết.
											</p>
										</div>
									</div>

									<div className='flex items-start gap-4'>
										<CheckCircle className='w-6 h-6 text-green-400 flex-shrink-0 mt-1' />
										<div>
											<h3 className='text-lg font-semibold text-white mb-2'>Performance</h3>
											<p className='text-white/70'>
												Chỉ load các plugins cần thiết để tối ưu hóa hiệu suất và giảm memory usage.
											</p>
										</div>
									</div>
								</div>
							</motion.section>
						</main>
					</div>
				</div>
			</div>
		</Layout>
	);
}
