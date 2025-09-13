"use client";

import { useEffect, useState } from "react";

interface Particle {
	id: number;
	x: number;
	y: number;
	size: number;
	speed: number;
	opacity: number;
	color: string;
}

export function AnimatedBackground() {
	const [particles, setParticles] = useState<Particle[]>([]);

	useEffect(() => {
		const colors = ["#0dbaf2", "#3bd3ff", "#6366f1", "#8b5cf6"];
		const newParticles: Particle[] = [];

		for (let i = 0; i < 50; i++) {
			newParticles.push({
				id: i,
				x: Math.random() * window.innerWidth,
				y: Math.random() * window.innerHeight,
				size: Math.random() * 4 + 1,
				speed: Math.random() * 0.5 + 0.1,
				opacity: Math.random() * 0.5 + 0.1,
				color: colors[Math.floor(Math.random() * colors.length)],
			});
		}

		setParticles(newParticles);

		const animate = () => {
			setParticles((prev) =>
				prev
					.map((particle) => ({
						...particle,
						y: particle.y - particle.speed,
						x: particle.x + Math.sin(particle.y * 0.01) * 0.5,
						opacity: Math.sin(particle.y * 0.01) * 0.3 + 0.2,
					}))
					.filter((particle) => particle.y > -50),
			);
		};

		const interval = setInterval(animate, 50);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='fixed inset-0 overflow-hidden pointer-events-none'>
			{particles.map((particle) => (
				<div
					key={particle.id}
					className='absolute rounded-full animate-float'
					style={{
						left: particle.x,
						top: particle.y,
						width: particle.size,
						height: particle.size,
						backgroundColor: particle.color,
						opacity: particle.opacity,
						animationDuration: `${6 + Math.random() * 4}s`,
						animationDelay: `${Math.random() * 2}s`,
					}}
				/>
			))}

			{/* Gradient orbs */}
			<div className='absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow' />
			<div
				className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow'
				style={{ animationDelay: "1s" }}
			/>
			<div
				className='absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow'
				style={{ animationDelay: "2s" }}
			/>
		</div>
	);
}

