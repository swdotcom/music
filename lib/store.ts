export class MusicStore {
    private _spotifyAccessToken: string = "";
    private _spotifyRefreshToken: string = "";
    private _apiHeaders: any = {};
    private _connectServerAuth: string = "";
    private _spotifyClientSecret: string = "";
    private _spotifyClientId: string = "";

    private static instance: MusicStore;
    private constructor() {
        //
    }
    static getInstance() {
        if (!MusicStore.instance) {
            MusicStore.instance = new MusicStore();
        }
        return MusicStore.instance;
    }

    setCredentials(creds: any) {
        Object.keys(creds).forEach(key => {
            if (key === "clientId") {
                this.spotifyClientId = creds[key];
            } else if (key === "clientSecret") {
                this.spotifyClientSecret = creds[key];
            } else if (key === "refreshToken") {
                this.spotifyRefreshToken = creds[key];
            } else if (key === "accessToken") {
                this.spotifyAccessToken = creds[key];
            }
        });
    }

    credentialByKey(key: string): any {
        if (key === "clientId") {
            return this.spotifyClientId;
        } else if (key === "clientSecret") {
            return this.spotifyClientSecret;
        } else if (key === "refreshToken") {
            return this.spotifyRefreshToken;
        } else if (key === "accessToken") {
            return this.spotifyAccessToken;
        }
        return null;
    }

    get spotifyAccessToken(): string {
        return this._spotifyAccessToken;
    }

    set spotifyAccessToken(newAccessToken: string) {
        this._spotifyAccessToken = newAccessToken;
    }

    get spotifyClientSecret(): string {
        return this._spotifyClientSecret;
    }

    set spotifyClientSecret(newSpotifyClientSecret: string) {
        this._spotifyClientSecret = newSpotifyClientSecret;
    }

    get spotifyClientId(): string {
        return this._spotifyClientId;
    }

    set spotifyClientId(newSpotifyCliendId: string) {
        this._spotifyClientId = newSpotifyCliendId;
    }

    get connectServerAuth(): string {
        return this._connectServerAuth;
    }

    set connectServerAuth(newConnectServerAuth: string) {
        this._connectServerAuth = newConnectServerAuth;
    }

    get spotifyRefreshToken(): string {
        return this._spotifyRefreshToken;
    }

    set spotifyRefreshToken(newRefreshToken: string) {
        this._spotifyRefreshToken = newRefreshToken;
    }

    get apiHeaders(): any {
        return this._apiHeaders;
    }

    set apiHeaders(newApiHeaders) {
        this._apiHeaders = newApiHeaders;
    }
}
