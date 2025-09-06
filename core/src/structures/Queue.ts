import { Track, LoopMode } from "../types";

export class Queue {
	private tracks: Track[] = [];
	private current: Track | null = null;
	private history: Track[] = [];
	private _autoPlay = false;
	private _loop: LoopMode = "off";
	private willnext: Track | null = null;

	add(track: Track): void {
		this.tracks.push(track);
	}

	addMultiple(tracks: Track[]): void {
		this.tracks.push(...tracks);
	}

	remove(index: number): Track | null {
		if (index < 0 || index >= this.tracks.length) return null;
		return this.tracks.splice(index, 1)[0];
	}

	next(ignoreLoop = false): Track | null {
		if (this.current) {
			if (this._loop === "track" && !ignoreLoop) {
				return this.current;
			}
			this.history.push(this.current);
			if (this.history.length > 200) {
				this.history.shift();
			}
		}
		this.current = this.tracks.shift() || null;
		if (!this.current && this._loop === "queue" && this.history.length > 0 && !ignoreLoop) {
			this.tracks = [...this.history];
			this.history = [];
			this.current = this.tracks.shift() || null;
		}
		return this.current;
	}

	clear(): void {
		this.tracks = [];
	}

	autoPlay(value?: boolean): boolean {
		if (typeof value !== "undefined") {
			this._autoPlay = value;
		}
		return this._autoPlay;
	}

	loop(mode?: LoopMode): LoopMode {
		if (mode) {
			this._loop = mode;
		}
		return this._loop;
	}

	shuffle(): void {
		for (let i = this.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
		}
	}

	get size(): number {
		return this.tracks.length;
	}

	get isEmpty(): boolean {
		return this.tracks.length === 0;
	}

	get currentTrack(): Track | null {
		return this.current;
	}

	get previousTracks(): Track[] {
		return [...this.history];
	}

	get nextTrack(): Track | null {
		return this.tracks[0] || null;
	}

	willNextTrack(track?: Track): Track | null {
		if (track) {
			this.willnext = track;
			return this.willnext;
		}
		return this.willnext;
	}

	getTracks(): Track[] {
		return [...this.tracks];
	}

	getTrack(index: number): Track | null {
		return this.tracks[index] || null;
	}
}
