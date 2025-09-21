"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { motion } from "framer-motion";
import { Zap, Play, Pause, SkipForward, Volume2, AlertTriangle, CheckCircle, ArrowRight, Info } from "lucide-react";

const basicEventsCode = `// Lắng nghe các events cơ bản
player.on("trackStart", (track) => {
  console.log("Bắt đầu phát:", track.title);
});

player.on("trackEnd", (track) => {
  console.log("Kết thúc:", track.title);
});

player.on("queueEnd", () => {
  console.log("Hết queue, tự động thoát...");
});

player.on("playerPause", (track) => {
  console.log("Tạm dừng:", track.title);
});

player.on("playerResume", (track) => {
  console.log("Tiếp tục:", track.title);
});`;

const queueEventsCode = `// Events liên quan đến queue
player.on("queueAdd", (track) => {
  console.log("Thêm vào queue:", track.title);
});

player.on("queueAddList", (tracks) => {
  console.log("Thêm playlist:", tracks.length, "bài hát");
});

player.on("queueRemove", (track, index) => {
  console.log("Xóa khỏi queue:", track.title, "tại vị trí", index);
});

player.on("willPlay", (track, tracks) => {
  console.log("Sắp phát:", track.title);
  console.log("Còn lại:", tracks.length, "bài hát");
});`;

const errorEventsCode = `// Xử lý lỗi
player.on("playerError", (error, track) => {
  console.error("Lỗi phát nhạc:", error.message);
  console.error("Bài hát:", track?.title || "Unknown");
  
  // Có thể thử phát bài tiếp theo
  if (player.queue.length > 0) {
    player.queue.skip();
  }
});

player.on("connectionError", (error) => {
  console.error("Lỗi kết nối:", error.message);
  
  // Thử kết nối lại sau 5 giây
  setTimeout(() => {
    player.connect(voiceChannel).catch(console.error);
  }, 5000);
});`;

const eventTypes = [
	{
		icon: Play,
		title: "Playback Events",
		description: "Theo dõi trạng thái phát nhạc",
		events: ["trackStart", "trackEnd", "playerPause", "playerResume", "playerStop"],
		color: "from-blue-500 to-cyan-500",
	},
	{
		icon: SkipForward,
		title: "Queue Events",
		description: "Quản lý danh sách phát",
		events: ["queueAdd", "queueRemove", "queueAddList", "willPlay", "queueEnd"],
		color: "from-purple-500 to-pink-500",
	},
	{
		icon: Volume2,
		title: "Control Events",
		description: "Điều khiển player",
		events: ["volumeChange", "playerDestroy"],
		color: "from-green-500 to-emerald-500",
	},
	{
		icon: AlertTriangle,
		title: "Error Events",
		description: "Xử lý lỗi và sự cố",
		events: ["playerError", "connectionError"],
		color: "from-red-500 to-orange-500",
	},
];

export default function EventsDocs() {
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
									<span className='text-white'>Events & </span>
									<span className='gradient-text'>Listeners</span>
								</h1>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Tìm hiểu cách sử dụng hệ thống events mạnh mẽ của ZiPlayer để tương tác với player và tạo trải nghiệm người dùng
									phong phú.
								</p>
							</motion.div>

							{/* Event Types Overview */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
								{eventTypes.map((type, index) => (
									<motion.div
										key={type.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
										className='card-hover'>
										<div className='flex flex-col items-center text-center space-y-4'>
											<div className={`p-4 rounded-2xl bg-gradient-to-br ${type.color}/20`}>
												<type.icon className='w-8 h-8 text-white' />
											</div>

											<div className='space-y-2'>
												<h3 className='text-xl font-bold text-white'>{type.title}</h3>
												<p className='text-white/70 leading-relaxed text-sm'>{type.description}</p>
												<ul className='text-xs text-white/60 space-y-1'>
													{type.events.map((event, idx) => (
														<li
															key={idx}
															className='flex items-center gap-2'>
															<CheckCircle className='w-3 h-3 text-green-400 flex-shrink-0' />
															{event}
														</li>
													))}
												</ul>
											</div>
										</div>
									</motion.div>
								))}
							</motion.section>

							{/* Basic Events */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20'>
										<Play className='w-6 h-6 text-blue-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Events Cơ Bản</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Các events cơ bản để theo dõi trạng thái phát nhạc và tương tác với player.
								</p>

								<CodeBlock
									code={basicEventsCode}
									language='typescript'
									className='mb-8'
								/>

								<CodeBlock
									code={queueEventsCode}
									language='typescript'
									className='mb-8'
								/>

								<CodeBlock
									code={errorEventsCode}
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
