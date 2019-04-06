import { MusicController } from "./lib/controller";

const SPOTIFY_NAME = "Spotify";
const ITUNES_NAME = "iTunes";

const musicCtr = new MusicController();

export async function isSpotifyRunning() {
    return await musicCtr.isMusicPlayerActive(SPOTIFY_NAME);
}

export async function isItunesRunning() {
    return await musicCtr.isMusicPlayerActive(ITUNES_NAME);
}

export async function stopSpotifyIfRunning() {
    return await musicCtr.stopPlayer(SPOTIFY_NAME);
}

export async function stopItunesIfRunning() {
    return await musicCtr.stopPlayer(ITUNES_NAME);
}

export async function startSpotifyIfNotRunning() {
    await musicCtr.startPlayer(SPOTIFY_NAME);
}

export async function startItunesIfNotRunning() {
    return await musicCtr.startPlayer(ITUNES_NAME);
}

export async function play(player: string) {
    return await musicCtr.play(player);
}

export async function pause(player: string) {
    return await musicCtr.pause(player);
}

export async function playTrackInContext(player: string, params: any[]) {
    return await musicCtr.playTrackInContext(player, params);
}

export async function getState(player: string) {
    return await musicCtr.getState(player);
}
