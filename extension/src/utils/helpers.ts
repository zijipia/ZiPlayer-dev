import type { Track } from "ziplayer";

export const isTrack = (value: any): value is Track => value && typeof value === "object" && typeof value.title === "string";

export const isUrl = (value: string): boolean => /^(https?:\/\/|wss?:\/\/)/i.test(value);

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getEncoded = (track: Track | null | undefined): string | null => {
	if (!track) return null;
	const encoded = (track as any)?.metadata?.lavalink?.encoded;
	return typeof encoded === "string" ? encoded : null;
};

export const createDebugLogger = (debug: boolean, prefix: string) => {
	return (message: string, ...optional: any[]) => {
		if (!debug) return;
		const formatted = `[${prefix}] ${message}`;
		console.log(formatted, ...optional);
	};
};
