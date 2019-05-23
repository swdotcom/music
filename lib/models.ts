export enum PlayerType {
    MacItunesDesktop = "MacItunesDesktop",
    MacSpotifyDesktop = "MacSpotifyDesktop",
    WindowsSpotifyDesktop = "WidowsSpotifyDesktop",
    WebSpotify = "WebSpotify",
    NotAssigned = "NotAssigned"
}

export enum PlayerName {
    SpotifyDesktop = "spotify",
    SpotifyWeb = "spotify-web",
    ItunesDesktop = "itunes"
}

export enum TrackStatus {
    Playing = 1,
    Paused = 2,
    Advertisement = 3,
    NotAssigned = 4
}

export enum CodyResponseType {
    Success = "success",
    Failed = "failed"
}

export class CodyResponse {
    status: number = 200;
    state: CodyResponseType = CodyResponseType.Success;
    statusText: string = "";
    message: string = "";
    data: any = {};
    error: any = {};
}

// {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
export class Track {
    artist: string = "";
    album: string = "";
    genre: string = "";
    disc_number: number = 0;
    duration: number = 0;
    duration_ms: number = 0;
    played_count: number = 0;
    track_number: number = 0;
    popularity: number = 0;
    id: string = "";
    uri: string = "";
    name: string = "";
    state: string = "";
    explicit: boolean = false;
    // href:"https://api.spotify.com/v1/playlists/0mwG8hCL4scWi8Nkt7jyoV/tracks"
    href: string = "";
    // "spotify", "itunes"
    type: string = "";
    playerType: PlayerType = PlayerType.NotAssigned;
    loved: boolean = false;
    volume: number = 0;
    status: TrackStatus = TrackStatus.NotAssigned;
}

export class PlayerDevice {
    id: string = "";
    is_active: string = "";
    is_restricted: boolean = false;
    name: string = "";
    type: string = "";
    volume_percent: number = 0;
}

export class PlayerContext {
    timestamp: number = 0;
    device: PlayerDevice = new PlayerDevice();
    progress_ms: string = "";
    is_playing: boolean = false;
    currently_playing_type: string = "";
    actions: any = null;
    item: any = null;
    shuffle_state: boolean = false;
    repeat_state: string = "";
    context: any = null;
}

export class SpotifyAudioFeature {
    danceability: number = 0;
    energy: number = 0;
    key: number = 0;
    loudness: number = 0;
    mode: number = 0;
    speechiness: number = 0;
    acousticness: number = 0;
    instrumentalness: number = 0;
    liveness: number = 0;
    valence: number = 0;
    tempo: number = 0;
    id: string = "";
    uri: string = "";
    track_href: string = "";
    analysis_url: string = "";
    duration_ms: number = 0;
    time_signature: number = 0;
}
