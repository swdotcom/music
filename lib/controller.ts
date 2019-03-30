import { getCommandResult } from "./util";

export class MusicController {
    async isMusicPlayerActive(player: string) {
        const command = `pgrep -x ${player}`;
        const result = await getCommandResult(command, 1);
        if (result) {
            return true;
        }
        return false;
    }

    async stopPlayer(player: string) {
        let command = `pgrep -x ${player} | xargs kill -9`;
        await getCommandResult(command, 1);
    }

    async play(player: string) {
        //
    }
}
