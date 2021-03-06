export enum PlayerType {
    MacItunesDesktop = "MacItunesDesktop",
    MacSpotifyDesktop = "MacSpotifyDesktop",
    WindowsSpotifyDesktop = "WidowsSpotifyDesktop",
    WebSpotify = "WebSpotify",
    NotAssigned = "NotAssigned",
}

export enum PlayerName {
    SpotifyDesktop = "spotify",
    SpotifyWeb = "spotify-web",
    ItunesDesktop = "itunes",
}

export enum TrackStatus {
    Playing = "playing",
    Paused = "paused",
    Advertisement = "advertisement",
    NotAssigned = "notassigned",
    GrantError = "granterror",
}

export enum CodyResponseType {
    Success = "success",
    Failed = "failed",
}

export class CodyResponse {
    status: number = 200;
    state: CodyResponseType = CodyResponseType.Success;
    statusText: string = "";
    message: string = "";
    data: any = {};
    error: any = {};
    retrySeconds: number = 0;
}

// {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
export class Track {
    artist: string = "";
    artist_names: string[] = [];
    album: any;
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
    explicit: boolean = false;
    // href:"https://api.spotify.com/v1/playlists/0mwG8hCL4scWi8Nkt7jyoV/tracks"
    href: string = "";
    // "spotify", "itunes"
    type: string = "";
    artists: Artist[] = [];
    playerType: PlayerType = PlayerType.NotAssigned;
    loved: boolean = false;
    volume: number = 0;
    state: TrackStatus = TrackStatus.NotAssigned;
    error: string = "";
    progress_ms: number = 0;
    features: SpotifyAudioFeature = new SpotifyAudioFeature();
    httpStatus: number = 200;
    actions: any;
    played_at: string = "";
    played_at_utc_seconds: number = 0;
    context_uri: string = "";
    context_type: string = "";
}

export class Artist {
    followers: any = {};
    genres: string[] = [];
    id: string = "";
    uri: string = "";
    name: string = "";
    images: any[] = [];
    popularity: number = 0;
}

export class Album {
    album_type: string = "";
    artists: any[] = [];
    href: string = "";
    id: string = "";
    name: string = "";
    uri: string = "";
    images: any[] = [];
}

export class PaginationItem {
    items: any[] = [];
    limit: number = 0;
    // url to the next page
    next: string = "";
    // url to the previous page
    previous: string = "";
    total: number = 0;
    offset: number = 0;
    constructor() {
        //
    }
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

export class PlaylistTrackInfo {
    href: string = "";
    total: number = 0;
}

export class PlaylistItem {
    name: string = "";
    id: string = "";
    uri: string = "";
    playlistTypeId: number = 0;
    collaborative: boolean = false;
    public: boolean = true;
    tracks: PlaylistTrackInfo = new PlaylistTrackInfo();
    type: string = "";
    itemType: string = "";
    playerType: PlayerType = PlayerType.NotAssigned;
    tag: string = "";
    tooltip: string = "";
    state: TrackStatus = TrackStatus.NotAssigned;
    artists: string = "";
    command: string = "";
    position: number = 0;
    loved: boolean = false;
    played_count: number = 0;
    popularity: number = 0;
    artist: string = "";
    owner: any = {};
    duplicateIds: string[] = [];
}

export class CodyConfig {
    spotifyAccessToken: string = "";
    spotifyRefreshToken: string = "";
    spotifyClientSecret: string = "";
    spotifyClientId: string = "";
    enableItunesDesktop: boolean = true;
    enableItunesDesktopSongTracking: boolean = true;
    enableSpotifyDesktop: boolean = true;
    enableSpotifyApi: boolean = true;
}

export class SpotifyAuthState {
    oauthActivated: boolean = false;
    loggedIn: boolean = false;
}
