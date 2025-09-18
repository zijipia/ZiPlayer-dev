import { BaseExtension, Player, PlayerManager } from "ziplayer";
import type { ExtensionContext, ExtensionPlayRequest } from "ziplayer";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { existsSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";

export type LavalinkStatus = "idle" | "starting" | "running" | "stopped" | "error";

export interface LavalinkOptions {
	jarPath?: string;
	javaPath?: string;
	configPath?: string;
	logbackPath?: string;
	workingDirectory?: string;
	javaArgs?: string[];
	args?: string[];
	env?: NodeJS.ProcessEnv;
	autoStart?: boolean;
	autoRestart?: boolean;
	restartDelayMs?: number;
	maxRestarts?: number;
	readyRegex?: RegExp;
	readyTimeoutMs?: number;
}

interface LavalinkLifecyclePayload {
	pid?: number | null;
	code?: number | null;
	signal?: NodeJS.Signals | null;
	attempt?: number;
	line?: string;
	reason?: string;
}

export class lavalinkExt extends BaseExtension {
	name = "lavalinkExt";
	version = "1.0.0";
	player: Player | null = null;
	private manager?: PlayerManager;
	private options: LavalinkOptions;
	private child: ChildProcessWithoutNullStreams | null = null;
	private status: LavalinkStatus = "idle";
	private restartCount = 0;
	private manualStopRequested = false;
	private pendingAutoStart = false;

	constructor(player: Player | null = null, opts?: Partial<LavalinkOptions>) {
		super();
		this.player = player;
		const { jarPath: incomingJar, ...restOpts } = opts ?? {};
		this.options = {
			jarPath: incomingJar ?? "",
			javaPath: "java",
			javaArgs: [],
			args: [],
			autoStart: false,
			autoRestart: false,
			restartDelayMs: 5_000,
			maxRestarts: 3,
			readyRegex: /Lavalink\s+is\s+ready|Started\s+Launcher/i,
			readyTimeoutMs: 5_000,
			...restOpts,
		};

		if (this.options.autoStart) {
			this.pendingAutoStart = true;
		}
	}

	async onRegister(context: ExtensionContext): Promise<void> {
		if (!this.manager) this.manager = context.manager;
		if (!this.player) this.player = context.player;
		if (this.pendingAutoStart) {
			await this.ensureAutoStarted();
		}
	}

	async onDestroy(): Promise<void> {
		if (!this.child) return;
		try {
			await this.stop();
		} catch (err: any) {
			this.debug(`[lavalinkExt] stop error: ${err?.message || err}`);
		}
	}

	async beforePlay(_context: ExtensionContext, _payload: ExtensionPlayRequest): Promise<void> {
		await this.ensureAutoStarted();
	}

	private async ensureAutoStarted(): Promise<void> {
		if (!this.options.autoStart) return;
		if (this.isRunning() || this.status === "starting") return;
		this.pendingAutoStart = false;
		try {
			await this.start();
		} catch (err: any) {
			this.debug(`[lavalinkExt] auto-start failed: ${err?.message || err}`);
		}
	}

	active(alas: any): boolean {
		if (alas?.player && !this.player) this.player = alas.player;
		const manager = alas?.manager as PlayerManager | undefined;
		if (manager) this.manager = manager;

		if (!this.player && !this.manager) return false;

		if (this.pendingAutoStart && !this.child) {
			void this.ensureAutoStarted();
		}

		return true;
	}

	configure(opts: Partial<LavalinkOptions>): void {
		this.mergeOptions(opts);
	}

	getStatus(): LavalinkStatus {
		return this.status;
	}

	get pid(): number | null {
		return this.child?.pid ?? null;
	}

	isRunning(): boolean {
		return !!this.child && !this.child.killed && this.status === "running";
	}

	async start(overrides?: Partial<LavalinkOptions>): Promise<void> {
		const cfg = this.mergeOptions(overrides);
		if (this.child) throw new Error("Lavalink process is already running");
		if (!cfg.jarPath) throw new Error("lavalinkExt.start requires a jarPath");

		const baseCwd = cfg.workingDirectory ? this.resolvePath(process.cwd(), cfg.workingDirectory) : process.cwd();
		const jarPath = this.resolvePath(baseCwd, cfg.jarPath);
		const resolvedCwd = cfg.workingDirectory ? baseCwd : dirname(jarPath);

		if (!existsSync(jarPath)) {
			throw new Error(`Lavalink jar not found at ${jarPath}`);
		}

		const javaBinary = cfg.javaPath || "java";
		const javaArgs = [...(cfg.javaArgs ?? [])];
		const extraArgs = [...(cfg.args ?? [])];
		const spawnArgs = [...javaArgs, "-jar", jarPath, ...extraArgs];
		const env: NodeJS.ProcessEnv = { ...process.env, ...(cfg.env ?? {}) };

		if (cfg.configPath) {
			const resolvedConfig = this.resolvePath(resolvedCwd, cfg.configPath);
			env.LAVALINK_SERVER_CONFIG = resolvedConfig;
			if (!existsSync(resolvedConfig)) {
				this.debug(`Config file not found at ${resolvedConfig}`);
			}
		}

		if (cfg.logbackPath) {
			const resolvedLogback = this.resolvePath(resolvedCwd, cfg.logbackPath);
			env.LAVALINK_LOGBACK = resolvedLogback;
			if (!existsSync(resolvedLogback)) {
				this.debug(`Logback file not found at ${resolvedLogback}`);
			}
		}

		this.status = "starting";
		this.emitEvent("lavalinkStart", { pid: null, reason: "spawn", line: `${javaBinary} ${spawnArgs.join(" ")}` });

		return new Promise<void>((resolve, reject) => {
			try {
				this.child = spawn(javaBinary, spawnArgs, {
					cwd: resolvedCwd,
					env,
				});
			} catch (err) {
				this.status = "error";
				this.emitEvent("lavalinkError", { pid: null, reason: "spawn", line: (err as Error)?.message });
				return reject(err as Error);
			}

			const child = this.child as ChildProcessWithoutNullStreams;
			let settled = false;
			const readyPattern = cfg.readyRegex ?? /Lavalink\s+is\s+ready|Started\s+Launcher/i;
			const readyTimeoutMs = cfg.readyTimeoutMs ?? 5_000;
			const readyTimer = setTimeout(() => {
				if (settled) return;
				settled = true;
				this.status = "running";
				this.restartCount = 0;
				this.emitEvent("lavalinkReady", { pid: child.pid, reason: "timeout" });
				resolve();
			}, readyTimeoutMs);

			const handleLine = (source: "stdout" | "stderr", line: string) => {
				const trimmed = line.trim();
				if (!trimmed) return;
				const prefix = source === "stdout" ? "[lavalink]" : "[lavalink][err]";
				this.debug(`${prefix} ${trimmed}`);
				if (!settled && source === "stdout" && readyPattern.test(trimmed)) {
					settled = true;
					clearTimeout(readyTimer);
					this.status = "running";
					this.restartCount = 0;
					this.emitEvent("lavalinkReady", { pid: child.pid, line: trimmed, reason: "regex" });
					resolve();
				}
			};

			child.stdout.on("data", (chunk: Buffer) => {
				chunk
					.toString()
					.replace(/\r/g, "")
					.split("\n")
					.forEach((line) => handleLine("stdout", line));
			});

			child.stderr.on("data", (chunk: Buffer) => {
				chunk
					.toString()
					.replace(/\r/g, "")
					.split("\n")
					.forEach((line) => handleLine("stderr", line));
			});

			const handleError = (error: Error) => {
				if (!settled) {
					settled = true;
					clearTimeout(readyTimer);
					this.status = "error";
					reject(error);
				}
				this.emitEvent("lavalinkError", { pid: child.pid, reason: "error", line: error.message });
			};

			child.once("error", handleError);

			child.once("exit", (code, signal) => {
				clearTimeout(readyTimer);
				this.child = null;
				const wasManual = this.manualStopRequested;
				this.manualStopRequested = false;

				if (!settled) {
					settled = true;
					this.status = wasManual ? "stopped" : "error";
					const err = new Error(`Lavalink exited before ready (code=${code ?? "null"}, signal=${signal ?? "null"})`);
					reject(err);
					if (!wasManual) {
						this.emitEvent("lavalinkError", { pid: null, reason: "early-exit", line: err.message });
					}
				}

				this.status = "stopped";
				this.emitEvent("lavalinkExit", { pid: child.pid, code, signal });

				if (!wasManual) {
					this.scheduleRestart(cfg);
				}
			});
		});
	}

	async stop(graceMs = 5_000): Promise<void> {
		if (!this.child) return;
		const child = this.child;
		this.manualStopRequested = true;
		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				if (!child.killed) {
					this.debug("[lavalinkExt] Force killing Lavalink process");
					try {
						child.kill("SIGKILL");
					} catch {
						child.kill();
					}
				}
			}, Math.max(graceMs, 1_000));

			child.once("exit", () => {
				clearTimeout(timeout);
				this.child = null;
				this.status = "stopped";
				this.restartCount = 0;
				this.manualStopRequested = false;
				this.emitEvent("lavalinkStop", { pid: child.pid, reason: "manual" });
				resolve();
			});

			if (!child.kill("SIGTERM")) {
				clearTimeout(timeout);
				resolve();
			}
		});
	}

	async restart(overrides?: Partial<LavalinkOptions>): Promise<void> {
		await this.stop();
		await this.start(overrides);
	}

	private scheduleRestart(cfg: LavalinkOptions): void {
		if (!cfg.autoRestart) {
			this.restartCount = 0;
			return;
		}

		if (cfg.maxRestarts !== undefined && this.restartCount >= cfg.maxRestarts) {
			this.emitEvent("lavalinkError", {
				pid: null,
				reason: "max-restart",
				line: `Max Lavalink restarts reached (${cfg.maxRestarts})`,
			});
			return;
		}

		const delay = cfg.restartDelayMs ?? 5_000;
		this.restartCount += 1;
		this.debug(`[lavalinkExt] Scheduling Lavalink restart #${this.restartCount} in ${delay}ms`);
		setTimeout(() => {
			this.emitEvent("lavalinkRestart", { pid: null, attempt: this.restartCount, reason: "auto" });
			void this.start().catch((err) => this.debug(`Auto-restart failed: ${err?.message || err}`));
		}, delay);
	}

	private mergeOptions(overrides?: Partial<LavalinkOptions>): LavalinkOptions {
		if (!overrides) return this.options;
		const { jarPath: nextJar, env: nextEnv, javaArgs, args, readyRegex, readyTimeoutMs, ...rest } = overrides;
		const next: LavalinkOptions = {
			...this.options,
			...rest,
			jarPath: nextJar ?? this.options.jarPath,
			javaArgs: javaArgs ?? this.options.javaArgs,
			args: args ?? this.options.args,
			env: nextEnv ? { ...(this.options.env ?? {}), ...nextEnv } : this.options.env,
			readyRegex: readyRegex ?? this.options.readyRegex,
			readyTimeoutMs: readyTimeoutMs ?? this.options.readyTimeoutMs,
		};
		this.options = next;
		return next;
	}

	private resolvePath(base: string, target: string): string {
		return isAbsolute(target) ? target : resolve(base, target);
	}

	private emitEvent(event: string, payload: LavalinkLifecyclePayload): void {
		const data = { ...payload, status: this.status } as Record<string, any>;
		if (this.manager && typeof (this.manager as any).emit === "function") {
			(this.manager as any).emit(event, this.player, data);
		} else {
			(this.player as any)?.emit?.(event, data);
		}
	}

	private debug(message: string, ...args: any[]): void {
		if (this.manager && this.manager.listenerCount("debug") > 0) {
			this.manager.emit("debug", `[lavalinkExt] ${message}`, ...args);
		}
		(this.player as any)?.emit?.("debug", `[lavalinkExt] ${message}`, ...args);
	}
}
