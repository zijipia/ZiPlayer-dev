"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
	code: string;
	language?: string;
	showLineNumbers?: boolean;
	className?: string;
}

export function CodeBlock({ code, language = "typescript", showLineNumbers = true, className = "" }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={`relative group ${className}`}>
			<div className='absolute top-4 right-4 z-10'>
				<button
					onClick={handleCopy}
					className='flex items-center gap-2 px-3 py-2 bg-dark-800/80 hover:bg-dark-700/80 text-white/70 hover:text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20'>
					{copied ?
						<>
							<Check size={16} />
							<span className='text-sm'>Copied!</span>
						</>
					:	<>
							<Copy size={16} />
							<span className='text-sm'>Copy</span>
						</>
					}
				</button>
			</div>

			<div className='glass-strong rounded-xl overflow-hidden'>
				<SyntaxHighlighter
					language={language}
					style={oneDark}
					showLineNumbers={showLineNumbers}
					customStyle={{
						margin: 0,
						padding: "1.5rem",
						// background: "transparent",
						fontSize: "0.875rem",
						lineHeight: "1.6",
					}}
					lineNumberStyle={{
						color: "#64748b",
						marginRight: "1rem",
						minWidth: "2rem",
					}}>
					{code}
				</SyntaxHighlighter>
			</div>
		</div>
	);
}
