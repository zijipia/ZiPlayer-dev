import { VoiceConnection } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { Readable } from "stream";

export interface Track {
	id: string;
	title: string;
	url: string;
	duration: number;
	thumbnail?: string;
	requestedBy: string;
	source: string;
	metadata?: Record<string, any>;
}

export interface SearchResult {
	tracks: Track[];
	playlist?: {
		name: string;
		url: string;
		thumbnail?: string;
	};
}

export interface StreamInfo {
	stream: Readable;
	type: "webm/opus" | "ogg/opus" | "arbitrary";
	metadata?: Record<string, any>;
}

export interface PlayerOptions {
	leaveOnEnd?: boolean;
	leaveOnEmpty?: boolean;
	leaveTimeout?: number;
	volume?: number;
	quality?: "high" | "low";
	/**
	 * Timeout in milliseconds for plugin operations (search, streaming, etc.)
	 * to prevent long-running tasks from blocking the player.
	 */
	extractorTimeout?: number;
	userdata?: Record<string, any>;
}

export interface PlayerManagerOptions {
	plugins?: SourcePlugin[];
}

export interface ProgressBarOptions {
	size?: number;
	barChar?: string;
	progressChar?: string;
}

export type LoopMode = "off" | "track" | "queue";

export interface PlayerEvents {
	debug: [message: string, ...args: any[]];
	willPlay: [track: Track, upcomingTracks: Track[]];
	trackStart: [track: Track];
	trackEnd: [track: Track];
	queueEnd: [];
	playerError: [error: Error, track?: Track];
	connectionError: [error: Error];
	volumeChange: [oldVolume: number, newVolume: number];
	queueAdd: [track: Track];
	queueRemove: [track: Track, index: number];
	playerPause: [track: Track];
	playerResume: [track: Track];
	playerStop: [];
	playerDestroy: [];
}

// Plugin interfaces
export interface SourcePlugin {
	name: string;
	version: string;
	canHandle(query: string): boolean;
	search(query: string, requestedBy: string): Promise<SearchResult>;
	getStream(track: Track): Promise<StreamInfo>;
	getRelatedTracks?(track: string | number, opts?: { limit?: number; offset?: number }): Promise<Track[]>;
	validate?(url: string): boolean;
	extractPlaylist?(url: string, requestedBy: string): Promise<Track[]>;
}
