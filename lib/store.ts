//

export class MusicStore {
    private _spotifyAccessToken: string = "";
    private _spotifyRefreshToken: string =
        "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w";
    private _apiHeaders: any = {};
    private _connectServerAuth: string = "";
    private _spotifyClientSecret: string = "2b40b4975b2743189c87f4712c0cd59e";
    private _spotifyClientId: string = "eb67e22ba1c6474aad8ec8067480d9dc";

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
