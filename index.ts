import { isMusicPlayerActive, stopPlayer } from "./lib/controller";

export async function isSpotifyRunning() {
    return await isMusicPlayerActive("spotify");
}

export async function isItunesRunning() {
    return await isMusicPlayerActive("itunes");
}

export async function stopSpotifyIfRunning() {
    await stopPlayer("spotify");
}

export async function stopItunesIfRunning() {
    await stopPlayer("itunes");
}
