import { BaseExtension, Player, PlayerManager, Track } from "ziplayer";

export class lavalinkExt extends BaseExtension {
	name = "lavalinkExt";
	version = "1.0.0";
	player: Player | null = null;
	private manager?: PlayerManager;

	active(alas: any): boolean {
		return true;
	}
}
