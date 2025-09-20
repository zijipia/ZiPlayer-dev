"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Play, Settings, Zap, Code, Puzzle, ArrowRight, CheckCircle } from "lucide-react";

const quickStartSteps = [
	{
		step: 1,
		title: "Cài đặt",
		description: "Cài đặt các package cần thiết",
		code: "npm install ziplayer @ziplayer/plugin",
	},
	{
		step: 2,
		title: "Tạo PlayerManager",
		description: "Khởi tạo và cấu hình PlayerManager",
		code: "const manager = new PlayerManager({ plugins: [...] });",
	},
	{
		step: 3,
		title: "Tạo Player",
		description: "Tạo player cho guild và kết nối",
		code: "const player = await manager.create(guildId);",
	},
	{
		step: 4,
		title: "Phát nhạc",
		description: "Bắt đầu phát nhạc từ các nguồn khác nhau",
		code: "await player.play('song name', userId);",
	},
];

const topics = [
	{
		icon: Play,
		title: "Player & Manager",
		description: "Tìm hiểu cách sử dụng Player và PlayerManager",
		href: "/docs/player",
		color: "from-blue-500 to-cyan-500",
	},
	{
		icon: Settings,
		title: "Queue & Controls",
		description: "Điều khiển queue và các tính năng phát nhạc",
		href: "/docs/queue",
		color: "from-purple-500 to-pink-500",
	},
	{
		icon: Zap,
		title: "Events",
		description: "Lắng nghe và xử lý các sự kiện",
		href: "/docs/events",
		color: "from-yellow-500 to-orange-500",
	},
	{
		icon: Puzzle,
		title: "Plugins",
		description: "Tạo và sử dụng plugins tùy chỉnh",
		href: "/docs/plugins",
		color: "from-green-500 to-emerald-500",
	},
	{
		icon: Code,
		title: "Extensions",
		description: "Mở rộng chức năng với extensions",
		href: "/docs/extensions",
		color: "from-red-500 to-rose-500",
	},
	{
		icon: BookOpen,
		title: "Examples",
		description: "Các ví dụ thực tế và best practices",
		href: "/docs/examples",
		color: "from-indigo-500 to-purple-500",
	},
];

export default function Docs() {
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
								<div className='flex items-center justify-center lg:justify-start gap-4 mb-6'>
									<Logo
										variant='icon'
										size='lg'
										animated={false}
									/>
									<h1 className='text-4xl lg:text-5xl font-bold'>
										<span className='text-white'>Tài liệu </span>
										<span className='gradient-text'>ZiPlayer</span>
									</h1>
								</div>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Hướng dẫn chi tiết để bắt đầu với ZiPlayer - Discord audio player mạnh mẽ với hệ thống plugin linh hoạt và hiệu
									suất cao.
								</p>
							</motion.div>

							{/* Quick Start */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-brand-500/20 to-brand-600/20'>
										<Zap className='w-6 h-6 text-brand-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Bắt đầu nhanh</h2>
								</div>

								<div className='grid md:grid-cols-2 gap-6'>
									{quickStartSteps.map((step, index) => (
										<motion.div
											key={step.step}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
											className='relative'>
											<div className='flex gap-4'>
												<div className='flex-shrink-0'>
													<div className='w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm'>
														{step.step}
													</div>
												</div>
												<div className='flex-1'>
													<h3 className='text-lg font-semibold text-white mb-2'>{step.title}</h3>
													<p className='text-white/70 mb-3'>{step.description}</p>
													<div className='bg-dark-900/50 rounded-lg p-3 border border-white/10'>
														<code className='text-brand-300 text-sm font-mono'>{step.code}</code>
													</div>
												</div>
											</div>
										</motion.div>
									))}
								</div>

								<div className='mt-8 text-center'>
									<Link
										href='/docs/getting-started'
										className='btn-primary inline-flex items-center gap-2'>
										Xem hướng dẫn chi tiết
										<ArrowRight className='w-4 h-4' />
									</Link>
								</div>
							</motion.section>

							{/* Topics Grid */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 }}>
								<h2 className='text-3xl font-bold text-white mb-8 text-center'>Khám phá các chủ đề</h2>

								<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
									{topics.map((topic, index) => (
										<motion.div
											key={topic.title}
											initial={{ opacity: 0, y: 30 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
											whileHover={{ y: -5 }}
											className='group'>
											<Link href={topic.href}>
												<div className='card-hover h-full'>
													<div className='flex flex-col h-full'>
														<div
															className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
															<topic.icon className='w-6 h-6 text-white' />
														</div>

														<h3 className='text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors duration-300'>
															{topic.title}
														</h3>

														<p className='text-white/70 group-hover:text-white/90 transition-colors duration-300 flex-1'>
															{topic.description}
														</p>

														<div className='mt-4 flex items-center text-brand-400 group-hover:text-brand-300 transition-colors duration-300'>
															<span className='text-sm font-medium'>Tìm hiểu thêm</span>
															<ArrowRight className='w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300' />
														</div>
													</div>
												</div>
											</Link>
										</motion.div>
									))}
								</div>
							</motion.section>

							{/* Features Highlight */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.6 }}
								className='glass-strong rounded-2xl p-8'>
								<h2 className='text-2xl font-bold text-white mb-6 text-center'>Tại sao chọn ZiPlayer?</h2>

								<div className='grid md:grid-cols-3 gap-6'>
									<div className='text-center'>
										<CheckCircle className='w-12 h-12 text-green-400 mx-auto mb-4' />
										<h3 className='text-lg font-semibold text-white mb-2'>Plugin-first</h3>
										<p className='text-white/70'>Thêm nguồn âm thanh như YouTube, SoundCloud, Spotify một cách dễ dàng</p>
									</div>

									<div className='text-center'>
										<CheckCircle className='w-12 h-12 text-green-400 mx-auto mb-4' />
										<h3 className='text-lg font-semibold text-white mb-2'>Ergonomics tốt</h3>
										<p className='text-white/70'>API đơn giản với Player & Manager dễ sử dụng</p>
									</div>

									<div className='text-center'>
										<CheckCircle className='w-12 h-12 text-green-400 mx-auto mb-4' />
										<h3 className='text-lg font-semibold text-white mb-2'>Production-ready</h3>
										<p className='text-white/70'>Event hooks, user data, hỗ trợ đa guild</p>
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
