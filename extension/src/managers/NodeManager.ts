import axios, { AxiosInstance } from "axios";
import type { InternalNode, LavalinkNodeOptions, LavalinkExtOptions } from "../types/lavalink";
import { WebSocketHandler } from "../handlers/WebSocketHandler";

export class NodeManager {
	private nodes: InternalNode[] = [];
	private wsHandler: WebSocketHandler;
	private debug: (message: string, ...optional: any[]) => void;

	constructor(options: LavalinkExtOptions) {
		this.debug = (message: string, ...optional: any[]) => {
			if (!options.debug) return;
			const formatted = `[NodeManager] ${message}`;
			console.log(formatted, ...optional);
		};
		this.wsHandler = new WebSocketHandler(options.debug ?? false);
		this.initializeNodes(options);
	}

	private initializeNodes(options: LavalinkExtOptions): void {
		for (const config of options.nodes) {
			this.nodes.push(this.createNode(config, options));
		}
	}

	private createNode(config: LavalinkNodeOptions, options: LavalinkExtOptions): InternalNode {
		const secure = config.secure ?? true;
		const port = config.port ?? (secure ? 443 : 2333);
		const identifier = config.identifier ?? `${config.host}:${port}`;
		const protocol = secure ? "https" : "http";
		const baseURL = `${protocol}://${config.host}:${port}`;
		const headers: Record<string, string> = {
			Authorization: config.password,
			"Client-Name": options.clientName ?? `ziplayer-extension/1.0.0`,
		};
		const rest = axios.create({
			baseURL,
			timeout: options.requestTimeoutMs ?? 10_000,
			headers,
		});
		return {
			...config,
			identifier,
			port,
			secure,
			rest,
			connected: false,
			wsConnected: false,
			lastPing: undefined,
			players: new Set<string>(),
			wsReconnectAttempts: 0,
			maxReconnectAttempts: 5,
		};
	}

	async initializeConnections(userId: string, clientName: string): Promise<void> {
		this.debug("Initializing node connections");

		await Promise.all(
			this.nodes.map((node) =>
				this.testNodeConnection(node, userId, clientName).catch((error) =>
					this.debug(`Failed to test node ${node.identifier}`, error),
				),
			),
		);
	}

	private async testNodeConnection(node: InternalNode, userId: string, clientName: string): Promise<void> {
		try {
			const response = await node.rest.get("/version");
			node.connected = true;
			this.debug(`Node ${node.identifier} connected successfully`);

			// Connect WebSocket to get sessionId
			await this.wsHandler.connectWebSocket(node, userId, clientName);
		} catch (error) {
			node.connected = false;
			this.debug(`Node ${node.identifier} connection failed`, error);
		}
	}

	selectNode(nodeSort: "players" | "cpu" | "memory" | "random" = "players"): InternalNode | null {
		const connected = this.nodes.filter((node) => node.connected && node.wsConnected && node.sessionId);
		if (connected.length === 0) return null;

		switch (nodeSort) {
			case "cpu":
				connected.sort((a, b) => {
					const aLoad = a.stats?.cpu?.systemLoad ?? Number.POSITIVE_INFINITY;
					const bLoad = b.stats?.cpu?.systemLoad ?? Number.POSITIVE_INFINITY;
					return aLoad - bLoad;
				});
				break;
			case "memory":
				connected.sort((a, b) => {
					const aMem = a.stats?.memory?.used ?? Number.POSITIVE_INFINITY;
					const bMem = b.stats?.memory?.used ?? Number.POSITIVE_INFINITY;
					return aMem - bMem;
				});
				break;
			case "random":
				return connected[Math.floor(Math.random() * connected.length)];
			case "players":
			default:
				connected.sort((a, b) => a.players.size - b.players.size);
		}
		return connected[0] ?? null;
	}

	getNode(identifier: string): InternalNode | undefined {
		return this.nodes.find((node) => node.identifier === identifier);
	}

	getAllNodes(): InternalNode[] {
		return [...this.nodes];
	}

	async loadTracks(node: InternalNode, identifier: string): Promise<any> {
		this.debug(`Loading tracks from node ${node.identifier} identifier=${identifier}`);
		const res = await node.rest.get(`/v4/loadtracks`, { params: { identifier } }).catch((error: any) => {
			this.debug(`loadTracks request failed for ${node.identifier} id=${identifier}`, error);
			throw error;
		});
		this.debug(`loadTracks response for ${node.identifier} id=${identifier} loadType=${res.data?.loadType}`);
		return res.data;
	}

	async updatePlayer(node: InternalNode, guildId: string, payload: Record<string, any>): Promise<void> {
		try {
			await node.rest.patch(`/v4/sessions/${node.sessionId}/players/${guildId}`, payload);
		} catch (error: any) {
			// Don't throw if the connection is already closed or player doesn't exist
			if (error.response?.status === 404 || error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
				this.debug(`Player ${guildId} not found or connection closed, skipping update`);
				return;
			}
			throw error;
		}
	}

	async destroyPlayer(node: InternalNode, guildId: string): Promise<void> {
		try {
			await node.rest.delete(`/v4/sessions/${node.sessionId}/players/${guildId}`);
		} catch (error: any) {
			// Don't log as error if the player doesn't exist or connection is closed
			if (error.response?.status === 404 || error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
				this.debug(`Player ${guildId} already destroyed or connection closed`);
			} else {
				this.debug(`Failed to destroy Lavalink player for ${guildId}`, error);
			}
		} finally {
			node.players.delete(guildId);
		}
	}

	async getPlayerInfo(node: InternalNode, guildId: string): Promise<any> {
		const response = await node.rest.get(`/v4/sessions/${node.sessionId}/players/${guildId}`);
		return response.data;
	}

	closeAllConnections(): void {
		this.wsHandler.closeAllWebSockets(this.nodes);
	}

	destroy(): void {
		this.closeAllConnections();
		this.nodes = [];
	}
}
