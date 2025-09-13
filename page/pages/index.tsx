import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Home() {
	return (
		<Layout>
			<div className='relative'>
				<AnimatedBackground />
				<HeroSection />
				<FeaturesSection />
			</div>
		</Layout>
	);
}
