import Link from "next/link";
import { useRouter } from "next/router";
import { PropsWithChildren } from "react";

export function NavLink({ href, children }: PropsWithChildren<{ href: string }>) {
	const { pathname } = useRouter();
	const active = pathname === href;
	return (
		<Link
			href={href}
			className={`block rounded px-3 py-2 text-sm transition-colors ${
				active ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
			}`}>
			{children}
		</Link>
	);
}
