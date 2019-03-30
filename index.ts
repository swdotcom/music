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
    await musicCtr.stopPlayer(SPOTIFY_NAME);
}

export async function stopItunesIfRunning() {
    await musicCtr.stopPlayer(ITUNES_NAME);
}
