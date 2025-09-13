"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
	delay?: number;
	className?: string;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0, className = "" }: FeatureCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{
				duration: 0.6,
				delay,
				ease: [0.25, 0.46, 0.45, 0.94],
			}}
			whileHover={{
				y: -8,
				transition: { duration: 0.3 },
			}}
			className={`group card-hover ${className}`}>
			<div className='flex flex-col items-center text-center space-y-4'>
				<div className='p-4 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 group-hover:from-brand-400/30 group-hover:to-brand-500/30 transition-all duration-300'>
					<Icon
						size={32}
						className='text-brand-400 group-hover:text-brand-300 transition-colors duration-300'
					/>
				</div>

				<div className='space-y-2'>
					<h3 className='text-xl font-bold text-white group-hover:text-brand-300 transition-colors duration-300'>{title}</h3>
					<p className='text-white/70 group-hover:text-white/90 transition-colors duration-300 leading-relaxed'>{description}</p>
				</div>
			</div>
		</motion.div>
	);
}

