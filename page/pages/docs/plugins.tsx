"use client";

import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { motion } from "framer-motion";
import { Puzzle, Youtube, Music, Headphones, CheckCircle, ArrowRight, Info, Code, Settings } from "lucide-react";

const pluginExampleCode = `import { BasePlugin } from "@ziplayer/plugin";

export class CustomPlugin extends BasePlugin {
  name = "custom-plugin";
  
  async search(query: string) {
    // Tìm kiếm bài hát từ nguồn tùy chỉnh
    const results = await this.fetchFromAPI(query);
    return results.map(item => ({
      title: item.name,
      url: item.streamUrl,
      duration: item.duration,
      thumbnail: item.cover
    }));
  }
  
  async getStream(url: string) {
    // Lấy stream URL để phát
    return await this.resolveStream(url);
  }
  
  private async fetchFromAPI(query: string) {
    // Logic tìm kiếm tùy chỉnh
    const response = await fetch(\`https://api.example.com/search?q=\${query}\`);
    return response.json();
  }
}`;

const pluginUsageCode = `import { PlayerManager } from "ziplayer";
import { CustomPlugin } from "./CustomPlugin";

const manager = new PlayerManager({
  plugins: [
    new CustomPlugin(),
    // Các plugins khác...
  ]
});

// Plugin sẽ tự động được sử dụng khi tìm kiếm
const player = await manager.create(guildId);
await player.play("tên bài hát", userId);`;

const builtinPluginsCode = `import { 
  YouTubePlugin, 
  SoundCloudPlugin, 
  SpotifyPlugin,
  TTSPlugin 
} from "@ziplayer/plugin";

const manager = new PlayerManager({
  plugins: [
   	new TTSPlugin({ defaultLang: "vi" }),
    new YouTubePlugin(),
		new SoundCloudPlugin(),
		new SpotifyPlugin()
  ]
});`;

const pluginMethodsCode = `// Các methods có sẵn trong BasePlugin
class MyPlugin extends BasePlugin {
  name = "my-plugin";
  
  // Bắt buộc: Tìm kiếm bài hát
  async search(query: string): Promise<Track[]> {
    // Trả về danh sách bài hát
  }
  
  // Bắt buộc: Lấy stream URL
  async getStream(url: string): Promise<string> {
    // Trả về URL stream
  }
  
  // Tùy chọn: Xử lý playlist
  async getPlaylist(url: string): Promise<Track[]> {
    // Trả về danh sách bài hát từ playlist
  }
  
  // Tùy chọn: Lấy thông tin chi tiết
  async getInfo(url: string): Promise<TrackInfo> {
    // Trả về thông tin chi tiết bài hát
  }
}`;

const availablePlugins = [
	{
		icon: Youtube,
		title: "YouTube Plugin",
		description: "Hỗ trợ tìm kiếm và phát nhạc từ YouTube",
		features: ["Video search", "Playlist support", "Live streams", "High quality audio"],
		color: "from-red-500 to-pink-500",
	},
	{
		icon: Music,
		title: "SoundCloud Plugin",
		description: "Tích hợp với SoundCloud cho âm nhạc độc lập",
		features: ["Track search", "User playlists", "Comments support", "Waveform data"],
		color: "from-orange-500 to-yellow-500",
	},
	{
		icon: Headphones,
		title: "Spotify Plugin",
		description: "Kết nối với Spotify cho trải nghiệm âm nhạc phong phú",
		features: ["Spotify search", "Playlist import", "Artist albums", "Recommendations"],
		color: "from-green-500 to-emerald-500",
	},
	{
		icon: Puzzle,
		title: "Custom Plugins",
		description: "Tạo plugins tùy chỉnh cho nguồn âm nhạc riêng",
		features: ["Custom APIs", "Local files", "Radio streams", "Database integration"],
		color: "from-purple-500 to-indigo-500",
	},
];

export default function PluginsDocs() {
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
									<span className='text-white'>Plugins & </span>
									<span className='gradient-text'>Extensions</span>
								</h1>
								<p className='text-xl text-white/70 leading-relaxed max-w-3xl'>
									Mở rộng chức năng của ZiPlayer với hệ thống plugin mạnh mẽ. Hỗ trợ YouTube, SoundCloud, Spotify và tạo plugins
									tùy chỉnh.
								</p>
							</motion.div>

							{/* Available Plugins */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className='grid md:grid-cols-2 gap-6'>
								{availablePlugins.map((plugin, index) => (
									<motion.div
										key={plugin.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
										className='card-hover'>
										<div className='flex flex-col h-full'>
											<div
												className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plugin.color} flex items-center justify-center mb-4`}>
												<plugin.icon className='w-8 h-8 text-white' />
											</div>

											<div className='flex-1 space-y-3'>
												<h3 className='text-xl font-bold text-white'>{plugin.title}</h3>
												<p className='text-white/70 leading-relaxed'>{plugin.description}</p>
												<ul className='text-sm text-white/60 space-y-1'>
													{plugin.features.map((feature, idx) => (
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

							{/* Built-in Plugins */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.4 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20'>
										<Settings className='w-6 h-6 text-blue-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Built-in Plugins</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>
									ZiPlayer đi kèm với các plugins phổ biến nhất, sẵn sàng sử dụng ngay.
								</p>

								<CodeBlock
									code={builtinPluginsCode}
									language='typescript'
									className='mb-8'
								/>

								<div className='grid md:grid-cols-3 gap-6'>
									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>YouTube</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Hỗ trợ video và audio</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Playlist và live streams</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Chất lượng cao</span>
											</li>
										</ul>
									</div>

									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>SoundCloud</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Âm nhạc độc lập</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Playlist người dùng</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Metadata phong phú</span>
											</li>
										</ul>
									</div>

									<div className='space-y-4'>
										<h3 className='text-lg font-semibold text-white'>Spotify</h3>
										<ul className='space-y-2 text-white/70 text-sm'>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Thư viện lớn</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Playlist và albums</span>
											</li>
											<li className='flex items-start gap-2'>
												<CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
												<span>Gợi ý thông minh</span>
											</li>
										</ul>
									</div>
								</div>
							</motion.section>

							{/* Creating Custom Plugins */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.6 }}
								className='glass-strong rounded-2xl p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20'>
										<Code className='w-6 h-6 text-purple-400' />
									</div>
									<h2 className='text-2xl font-bold text-white'>Tạo Custom Plugin</h2>
								</div>

								<p className='text-white/70 mb-6 text-lg'>Tạo plugin tùy chỉnh để tích hợp với nguồn âm nhạc riêng của bạn.</p>

								<h3 className='text-xl font-semibold text-white mb-4'>Plugin Structure</h3>
								<CodeBlock
									code={pluginMethodsCode}
									language='typescript'
									className='mb-8'
								/>

								<h3 className='text-xl font-semibold text-white mb-4'>Example Implementation</h3>
								<CodeBlock
									code={pluginExampleCode}
									language='typescript'
									className='mb-8'
								/>

								<h3 className='text-xl font-semibold text-white mb-4'>Using Your Plugin</h3>
								<CodeBlock
									code={pluginUsageCode}
									language='typescript'
								/>
							</motion.section>

							{/* Next Steps */}
							<motion.section
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 1.0 }}
								className='glass-strong rounded-2xl p-8 text-center'>
								<h2 className='text-2xl font-bold text-white mb-4'>Tiếp theo: Extensions</h2>
								<p className='text-white/70 mb-6'>Tìm hiểu cách sử dụng extensions để mở rộng chức năng player.</p>
								<a
									href='/docs/extensions'
									className='btn-primary inline-flex items-center gap-2'>
									Xem Extensions
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
