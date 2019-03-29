import { getCommandResult } from "./util";

export async function isMusicPlayerActive(player: string) {
    const command = `ps cax | grep ${player} | grep -v grep | awk '{print $1}'`;
    const result = await getCommandResult(command, 1);
    console.log("player active result result: ", result);
    if (result) {
        return true;
    }
    return false;
}

export async function stopPlayer(player: string) {
    let command = `ps cax | grep ${player} | grep -v grep | awk '{print $1}'`;
    let result = await getCommandResult(command, 1);
    if (result) {
        // stop the app
        command = `kill -9 ${result}`;
        result = await getCommandResult(command, 1);
        console.log("kill result: ", result);
    }
}
