"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { motion } from "framer-motion";
import { Zap, Mic, Volume2, MessageSquare, CheckCircle, ArrowRight, Music, Code } from "lucide-react";

const extensionExampleCode = `import { BaseExtension } from "@ziplayer/extension";

export class CustomExtension extends BaseExtension {
  name = "custom-extension";
  
  async active({ manager, player }) {
    // Khởi tạo extension khi player được tạo
    console.log("Custom extension activated for player:", player.guildId);
    
    // Lắng nghe events
    player.on("trackStart", (track) => {
      this.handleTrackStart(track);
    });
  }
  
  async inactive() {
    // Cleanup khi extension bị vô hiệu hóa
    console.log("Custom extension deactivated");
  }
  
  private handleTrackStart(track) {
    // Logic tùy chỉnh khi bắt đầu phát nhạc
    console.log("Custom logic for track:", track.title);
  }
}`;

const voiceExtensionCode = `import { voiceExt, lyricsExt, lavalinkExt } from "@ziplayer/extension";

const lrc = new lyricsExt(null, {
	includeSynced: true,
	autoFetchOnTrackStart: true,
	sanitizeTitle: true,
});

const lavalink = new lavalinkExt(null, {
	// Lavalink configuration
});

const manager = new PlayerManager({
  extensions: [
    lrc,
    new voiceExt(null, { client, lang: "en-US", minimalVoiceMessageDuration: 1 }),
    lavalink
  ]
});

const player = await manager.create(message.guild.id, {
	userdata: {
		channel: message.channel,
	},
	extensions: ["lyricsExt", "voiceExt", "lavalinkExt"],
});

// Khi destroy player, lavalink extension sẽ:
// 1. Ngắt kết nối hoàn toàn với Lavalink server
// 2. Không tự động kết nối lại
// 3. Cleanup tất cả resources
// 4. Gọi onDestroy() lifecycle method

player.destroy(); // Lavalink extension tự động cleanup

manager.on("lyricsCreate", (_player, track, result) => {
	if (result.synced) {
		console.log("[LRC]\n" + result.synced.slice(0, 256) + (result.synced.length > 256 ? "..." : ""));
	} else if (result.text) {
		console.log("[TEXT]\n" + result.text.slice(0, 256) + (result.text.length > 256 ? "..." : ""));
	} else {
		console.log("No lyrics found");
	}
});

manager.on("lyricsChange", async (_player, track, result) => {
	// Per-line update when synced lyrics available
	if (result.current) {
		console.log(\`[LINE \${result.lineIndex}] \${result.current}\`);
	} else if (result.text) {
		// Fallback plain text chunk
	}
});

manager.on("voiceCreate", async (plr, evt) => {
	const userTag = evt.user?.tag || evt.userId;
	const lowerContent = evt.content.toLowerCase();
	console.log(lowerContent);
});
`;

const availableExtensions = [
	{
		icon: Mic,
		title: "Voice Extension",
		description: "Speech recognizers với nhiều ngôn ngữ và giọng nói",
		features: ["Multi-language TTS", "Voice selection", "Ignore Bots", "Auto attach connection"],
		color: "from-blue-500 to-cyan-500",
	},
	{
		icon: Volume2,
		title: "Lyrics Extension",
		description: "Hiển thị lyrics tự động cho bài hát",
		features: ["Auto-fetch lyrics", "Multiple sources", "Language support", "Embed display"],
		color: "from-purple-500 to-pink-500",
	},
	{
		icon: Music,
		title: "Lavalink Extension",
		description: "Kết nối với Lavalink server cho chất lượng âm thanh cao",
		features: ["High quality audio", "Auto cleanup on destroy", "No auto-reconnect", "Resource management"],
		color: "from-green-500 to-emerald-500",
	},
	{
		icon: Zap,
		title: "Custom Extensions",
		description: "Tạo extensions tùy chỉnh cho chức năng riêng",
		features: ["Custom logic", "Event handling", "API integration", "Database support"],
		color: "from-orange-500 to-red-500",
	},
];

export default function ExtensionsDocs() {
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
									<span className='text-white'>Extensions & </span>
									<span className='gradient-text'>Add-ons</span>
								</h1>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Mở rộng chức năng player với hệ thống extensions mạnh mẽ. Thêm TTS, lyrics, và các tính năng tùy chỉnh.
								</p>
							</motion.div>

							{/* Available Extensions */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className='grid md:grid-cols-2 gap-6'>
								{availableExtensions.map((extension, index) => (
									<motion.div
										key={extension.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
										className='card-hover'>
										<div className='flex flex-col h-full'>
											<div
												className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${extension.color} flex items-center justify-center mb-4`}>
												<extension.icon className='w-8 h-8 text-white' />
											</div>

											<div className='flex-1 space-y-3'>
												<h3 className='text-xl font-bold text-white'>{extension.title}</h3>
												<p className='text-white/70 leading-relaxed'>{extension.description}</p>
												<ul className='text-sm text-white/60 space-y-1'>
													{extension.features.map((feature, idx) => (
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

							{/* Voice Extension */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20'>
										<Mic className='w-6 h-6 text-blue-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Voice Extension</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Thêm khả năng Text-to-Speech vào player để thông báo và tương tác với người dùng.
								</p>

								<CodeBlock
									code={voiceExtensionCode}
									language='typescript'
									className='mb-8'
								/>

								<div className='grid md:grid-cols-2 gap-6'>
									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Configuration Options</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>
													<code className='text-brand-300'>lang</code> - Ngôn ngữ TTS
												</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>
													<code className='text-brand-300'>voice</code> - Giọng nói cụ thể
												</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>
													<code className='text-brand-300'>speed</code> - Tốc độ nói (0.5-2.0)
												</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>
													<code className='text-brand-300'>pitch</code> - Cao độ (-20 đến 20)
												</span>
											</li>
										</ul>
									</div>

									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Use Cases</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Thông báo bài hát mới</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Hướng dẫn sử dụng</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Thông báo lỗi</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Tương tác với người dùng</span>
											</li>
										</ul>
									</div>
								</div>
							</motion.section>

							{/* Lavalink Extension */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.6 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20'>
										<Music className='w-6 h-6 text-green-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Lavalink Extension</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									Lavalink extension cung cấp chất lượng âm thanh cao và quản lý kết nối tự động.
								</p>

								<CodeBlock
									code={voiceExtensionCode}
									language='typescript'
									className='mb-8'
								/>

								<div className='grid md:grid-cols-2 gap-6'>
									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Tính năng chính</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Chất lượng âm thanh cao</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Tự động cleanup khi destroy</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Không tự động kết nối lại</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Quản lý resources hiệu quả</span>
											</li>
										</ul>
									</div>

									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Destroy Behavior</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Ngắt kết nối hoàn toàn với Lavalink server</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Cleanup tất cả players và connections</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Không tự động kết nối lại</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Gọi onDestroy() lifecycle method</span>
											</li>
										</ul>
									</div>
								</div>
							</motion.section>

							{/* Creating Custom Extensions */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.8 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20'>
										<Code className='w-6 h-6 text-orange-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Tạo Custom Extension</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>Tạo extension tùy chỉnh để thêm chức năng riêng cho player.</p>

								<CodeBlock
									code={extensionExampleCode}
									language='typescript'
								/>
							</motion.section>

							{/* Next Steps */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.8 }}
								className='glass-strong rounded-2xl p-8 text-center'>
								<h2 className='text-2xl font-bold text-white mb-4'>Tiếp theo: Examples</h2>
								<p className='text-white/70 mb-6'>Xem các ví dụ thực tế và best practices để sử dụng ZiPlayer hiệu quả.</p>
								<a
									href='/docs/examples'
									className='btn-primary inline-flex items-center gap-2'>
									Xem Examples
									<ArrowRight className='w-4 h-4' />
								</a>
							</motion.section>
						</main>
					</div>
				</div>
			</div>
		</Layout>
	);
}
