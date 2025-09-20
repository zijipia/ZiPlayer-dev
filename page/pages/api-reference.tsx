import { Layout } from "@/components/Layout";
import { ApiSidebar } from "@/components/ApiSidebar";
import { ApiContent } from "@/components/ApiContent";

export default function ApiReference() {
	return (
		<Layout>
			<div className='flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
				{/* Sidebar */}
				<div className='w-80 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex-shrink-0'>
					<ApiSidebar />
				</div>

				{/* Main Content */}
				<div className='flex-1 overflow-auto bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm'>
					<ApiContent />
				</div>
			</div>
		</Layout>
	);
}
