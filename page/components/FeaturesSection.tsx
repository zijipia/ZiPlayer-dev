"use client";

import { motion } from "framer-motion";
import { Zap, Puzzle, Settings, Shield, Code, Users, Music, BarChart3 } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
	{
		icon: Puzzle,
		title: "Plugin System",
		description:
			"Hệ thống plugin mạnh mẽ cho phép mở rộng chức năng một cách dễ dàng với YouTube, SoundCloud, Spotify và nhiều hơn nữa.",
	},
	{
		icon: Zap,
		title: "High Performance",
		description: "Được tối ưu hóa cho hiệu suất cao với TypeScript, hỗ trợ đa guild và xử lý hàng nghìn yêu cầu đồng thời.",
	},
	{
		icon: Settings,
		title: "Rich Controls",
		description: "Điều khiển queue phong phú với auto-play, shuffle, repeat, volume control và nhiều tính năng nâng cao khác.",
	},
	{
		icon: Shield,
		title: "Production Ready",
		description: "Sẵn sàng cho production với error handling, logging, monitoring và các tính năng bảo mật hàng đầu.",
	},
	{
		icon: Code,
		title: "Developer Friendly",
		description: "API đơn giản, documentation chi tiết, TypeScript support và cộng đồng hỗ trợ tích cực.",
	},
	{
		icon: Users,
		title: "Multi-Guild Support",
		description: "Hỗ trợ đa guild với quản lý player riêng biệt cho từng server, không xung đột dữ liệu.",
	},
	{
		icon: Music,
		title: "Audio Quality",
		description: "Chất lượng âm thanh cao với hỗ trợ nhiều format, bitrate tối ưu và xử lý audio chuyên nghiệp.",
	},
	{
		icon: BarChart3,
		title: "Analytics & Monitoring",
		description: "Theo dõi hiệu suất, thống kê sử dụng và monitoring real-time để tối ưu hóa trải nghiệm người dùng.",
	},
];

export function FeaturesSection() {
	return (
		<section className='py-20 relative'>
			<div className='max-w-7xl mx-auto px-4'>
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='text-center mb-16'>
					<h2 className='text-4xl lg:text-5xl font-bold mb-6'>
						<span className='text-white'>Tại sao chọn </span>
						<span className='gradient-text'>ZiPlayer?</span>
					</h2>
					<p className='text-xl text-white/70 max-w-3xl mx-auto leading-relaxed'>
						ZiPlayer được thiết kế để mang lại trải nghiệm âm nhạc Discord tốt nhất với công nghệ tiên tiến và giao diện thân
						thiện.
					</p>
				</motion.div>

				{/* Features grid */}
				<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{features.map((feature, index) => (
						<FeatureCard
							key={feature.title}
							icon={feature.icon}
							title={feature.title}
							description={feature.description}
							delay={index * 0.1}
						/>
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
						<h3 className='text-2xl font-bold text-white mb-4'>Sẵn sàng bắt đầu?</h3>
						<p className='text-white/70 mb-6'>Khám phá tài liệu chi tiết và bắt đầu xây dựng bot Discord của bạn ngay hôm nay.</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<a
								href='/docs/getting-started'
								className='btn-primary'>
								Xem tài liệu
							</a>
							<a
								href='https://github.com/ZiProject/ZiPlayer'
								target='_blank'
								rel='noopener noreferrer'
								className='btn-secondary'>
								GitHub Repository
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
