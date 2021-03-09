import { CodyResponse, Track } from "./models";
import { MusicUtil } from "./util";
import { MusicClient } from "./client";
const musicClient = MusicClient.getInstance();

const musicUtil = new MusicUtil();

export class AlbumService {
  private static instance: AlbumService;
  private constructor() {
    //
  }
  static getInstance() {
    if (!AlbumService.instance) {
      AlbumService.instance = new AlbumService();
    }
    return AlbumService.instance;
  }

  async getSpotifyAlbumTracks(albumId: string): Promise<Track[]> {
    // i.e. https://api.spotify.com/v1/albums/1xVP4eFcagXNtQMvEXfyeV/tracks?offset=0&limit=50
    const id = musicUtil.createSpotifyAlbumIdFromUri(albumId);
    const tracks: Track[] = [];

    // response: { href: <origapi>, items: [ { artists: [], available_markets, disc_number, duration_ms, explicit, external_urls, href, id, name, preview_url, track_number, type, uri } ] }
    const api = `/v1/albums/${id}/tracks`;
    const qsOptions = { offset: 0, limit: 50 };
    let codyResp: CodyResponse = await musicClient.spotifyApiGet(api, qsOptions);

    // check if the token needs to be refreshed
    if (codyResp.status === 401) {
      // refresh the token
      await musicClient.refreshSpotifyToken();
      // try again
      codyResp = await musicClient.spotifyApiGet(api, qsOptions);
    }

    if (musicUtil.isResponseOkWithData(codyResp) && codyResp.data.items) {
      codyResp.data.items.forEach((track: any) => {
        tracks.push(musicUtil.buildTrack(track));
      });
    }

    return tracks;
  }
}
