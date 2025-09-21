"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { motion } from "framer-motion";
import { List, Play, Pause, SkipForward, Shuffle, Repeat, Volume2, CheckCircle, ArrowRight, Info, Zap } from "lucide-react";

const queueBasicsCode = `// Thêm bài hát vào queue
await player.play("Song Name", userId);
await player.play("https://youtube.com/watch?v=...", userId);

// Thêm nhiều bài hát
const songs = ["Song 1", "Song 2", "Song 3"];
for (const song of songs) {
  await player.queue.add(song, userId);
}

// Phát queue
await player.play();`;

const queueManagementCode = `// Quản lý queue
// Thêm bài hát vào cuối queue
await player.queue.add(track, userId);

// Thêm nhiều bài hát cùng lúc
await player.queue.addMultiple(tracks, userId);

// Chèn bài hát vào vị trí cụ thể (0 = bài tiếp theo)
await player.queue.insert(track, 0, userId);

// Xóa bài hát khỏi queue
const removedTrack = player.queue.remove(2); // Xóa bài ở vị trí 2

// Lấy thông tin queue
console.log("Queue size:", player.queue.size);
console.log("Is empty:", player.queue.isEmpty);
console.log("Current track:", player.queue.currentTrack);
console.log("Next track:", player.queue.nextTrack);

// Xóa toàn bộ queue
player.queue.clear();`;

const playbackControlsCode = `// Điều khiển phát nhạc
// Skip bài hiện tại
player.queue.skip();

// Bật/tắt auto play
player.queue.autoPlay(true);

// Các chế độ lặp
player.queue.loop("off");    // Không lặp
player.queue.loop("track");  // Lặp bài hiện tại
player.queue.loop("queue");  // Lặp toàn bộ queue

// Xáo trộn queue
player.queue.shuffle();

// Lấy danh sách bài hát
const allTracks = player.queue.getTracks();
const specificTrack = player.queue.getTrack(3); // Lấy bài ở vị trí 3`;

const queueEventsCode = `// Lắng nghe events của queue
player.on("queueAdd", (track) => {
  console.log("Đã thêm:", track.title);
});

player.on("queueAddList", (tracks) => {
  console.log("Đã thêm playlist:", tracks.length, "bài hát");
});

player.on("queueRemove", (track, index) => {
  console.log("Đã xóa:", track.title, "tại vị trí", index);
});

player.on("willPlay", (track, upcomingTracks) => {
  console.log("Sắp phát:", track.title);
  console.log("Còn lại:", upcomingTracks.length, "bài hát");
});

player.on("queueEnd", () => {
  console.log("Hết queue!");
});`;

const queueControlsCode = `// API Methods của Queue
player.queue:
	add(track: Track): void 
	addMultiple(tracks: Track[]): void 
	/** Insert a track at a specific upcoming position (0 = next) */
	insert(track: Track, index: number): void 
	/** Insert multiple tracks at a specific upcoming position, preserving order */
	insertMultiple(tracks: Track[], index: number): void 
	remove(index: number): Track | null 
	next(ignoreLoop = false): Track | null 
	clear(): void 
	autoPlay(value?: boolean): boolean 
	loop(mode?: LoopMode): LoopMode 
	shuffle(): void 
	get size(): number 
	get isEmpty(): boolean 
	get currentTrack(): Track | null 
	get previousTracks(): Track[] 
	get nextTrack(): Track | null 
	willNextTrack(track?: Track): Track | null 
	getTracks(): Track[] 
	getTrack(index: number): Track | null `;

const features = [
	{
		icon: List,
		title: "Queue Management",
		description: "Quản lý danh sách phát với các tính năng nâng cao",
		details: ["Add/Remove tracks", "Queue navigation", "Search & filter", "Queue info"],
	},
	{
		icon: Shuffle,
		title: "Playback Controls",
		description: "Điều khiển phát nhạc linh hoạt và mạnh mẽ",
		details: ["Skip tracks", "Shuffle mode", "Repeat modes", "Auto-play"],
	},
	{
		icon: Volume2,
		title: "Audio Controls",
		description: "Điều khiển âm thanh và chất lượng phát",
		details: ["Volume control", "Seek position", "Pause/Resume", "Stop"],
	},
];

export default function QueueDocs() {
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
									<span className='text-white'>Queue & </span>
									<span className='gradient-text'>Controls</span>
								</h1>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Tìm hiểu cách sử dụng hệ thống queue mạnh mẽ và các điều khiển phát nhạc để tạo trải nghiệm âm nhạc tuyệt vời
									cho người dùng.
								</p>
							</motion.div>

							{/* Features Overview */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className='grid md:grid-cols-3 gap-6'>
								{features.map((feature, index) => (
									<motion.div
										key={feature.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
										className='card-hover'>
										<div className='flex flex-col items-center text-center space-y-4'>
											<div className='p-4 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20'>
												<feature.icon className='w-8 h-8 text-brand-400' />
											</div>

											<div className='space-y-2'>
												<h3 className='text-xl font-bold text-white'>{feature.title}</h3>
												<p className='text-white/70 leading-relaxed'>{feature.description}</p>
												<ul className='text-sm text-white/60 space-y-1'>
													{feature.details.map((detail, idx) => (
														<li
															key={idx}
															className='flex items-center gap-2'>
															<CheckCircle className='w-3 h-3 text-green-400 flex-shrink-0' />
															{detail}
														</li>
													))}
												</ul>
											</div>
										</div>
									</motion.div>
								))}
							</motion.section>

							{/* Queue Basics */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20'>
										<List className='w-6 h-6 text-blue-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Queue Basics</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Queue là danh sách các bài hát sẽ được phát. Bạn có thể thêm, xóa, và sắp xếp lại các bài hát trong queue một
									cách dễ dàng.
								</p>

								<CodeBlock
									code={queueBasicsCode}
									language='typescript'
									className='mb-8'
								/>
							</motion.section>

							{/* Queue Management */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.5 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20'>
										<Play className='w-6 h-6 text-purple-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Queue Management</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Quản lý queue với các phương thức thêm, xóa, chèn và lấy thông tin bài hát.
								</p>

								<CodeBlock
									code={queueManagementCode}
									language='typescript'
									className='mb-8'
								/>
							</motion.section>

							{/* Playback Controls */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.6 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20'>
										<SkipForward className='w-6 h-6 text-green-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Playback Controls</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Điều khiển phát nhạc với các tính năng skip, loop, shuffle và auto-play.
								</p>

								<CodeBlock
									code={playbackControlsCode}
									language='typescript'
									className='mb-8'
								/>
							</motion.section>

							{/* Queue Events */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.7 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20'>
										<Zap className='w-6 h-6 text-orange-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Queue Events</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>Lắng nghe các sự kiện của queue để tương tác và cập nhật UI.</p>

								<CodeBlock
									code={queueEventsCode}
									language='typescript'
									className='mb-8'
								/>
							</motion.section>

							{/* API Reference */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.8 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20'>
										<Info className='w-6 h-6 text-indigo-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>API Reference</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>Tất cả các phương thức và thuộc tính có sẵn trong Queue.</p>

								<CodeBlock
									code={queueControlsCode}
									language='typescript'
								/>
							</motion.section>
						</main>
					</div>
				</div>
			</div>
		</Layout>
	);
}
