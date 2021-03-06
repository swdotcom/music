import { CodyConfig } from "./models";
import { MusicUtil } from "./util";

const musicUtil = new MusicUtil();

export class MusicStore {
    private _spotifyAccessToken: string = "";
    private _spotifyRefreshToken: string = "";
    private _apiHeaders: any = {};
    private _connectServerAuth: string = "";
    private _spotifyClientSecret: string = "";
    private _spotifyClientId: string = "";
    private _spotifyUserId: string = "";
    private _itunesDesktopEnabled: boolean = true;
    private _itunesDesktopTrackingEnabled: boolean = true;
    private _spotifyDesktopEnabled: boolean = true;
    private _spotifyApiEnabled: boolean = true;
    private _itunesAccessGranted: boolean = true;
    private _debug: boolean = false;
    private _prev_volume_percent: number = 0;

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

    setConfig(config: CodyConfig) {
        this.spotifyAccessToken = config.spotifyAccessToken;
        this.spotifyClientId = config.spotifyClientId;
        this.spotifyClientSecret = config.spotifyClientSecret;
        this.spotifyRefreshToken = config.spotifyRefreshToken;
        this.itunesDesktopEnabled = config.enableItunesDesktop;
        this.itunesDesktopTrackingEnabled =
            config.enableItunesDesktopSongTracking;
        this.spotifyDesktopEnabled = config.enableSpotifyDesktop;
        this.spotifyApiEnabled = config.enableSpotifyApi;
    }

    setCredentials(creds: any) {
        Object.keys(creds).forEach((key) => {
            if (key === "clientId") {
                this.spotifyClientId = creds[key];
            } else if (key === "clientSecret") {
                this.spotifyClientSecret = creds[key];
            } else if (key === "refreshToken") {
                this.spotifyRefreshToken = creds[key];
            } else if (key === "accessToken") {
                this.spotifyAccessToken = creds[key];
            } else if (key === "debug") {
                this.debug = creds[key];
            }
        });
    }

    credentialByKey(key: string): any {
        if (key === "spotifyClientId") {
            return this.spotifyClientId;
        } else if (key === "spotifyClientSecret") {
            return this.spotifyClientSecret;
        } else if (key === "spotifyRefreshToken") {
            return this.spotifyRefreshToken;
        } else if (key === "spotifyAccessToken") {
            return this.spotifyAccessToken;
        } else if (key === "debug") {
            return this.debug;
        }
        return null;
    }

    hasSpotifyAccessToken(): boolean {
        return this._spotifyAccessToken && this._spotifyAccessToken !== ""
            ? true
            : false;
    }

    get spotifyAccessToken(): string {
        return this._spotifyAccessToken;
    }

    set spotifyAccessToken(newAccessToken: string) {
        this._spotifyAccessToken = newAccessToken;
    }

    get prevVolumePercent(): number {
        return this._prev_volume_percent;
    }

    set prevVolumePercent(percent: number) {
        this._prev_volume_percent = percent;
    }

    get itunesAccessGranted(): boolean {
        return this._itunesAccessGranted;
    }

    set itunesAccessGranted(granted: boolean) {
        this._itunesAccessGranted = granted;
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

    get spotifyUserId(): any {
        return this._spotifyUserId;
    }

    set spotifyUserId(newSpotifyUserId) {
        this._spotifyUserId = newSpotifyUserId;
    }

    get itunesDesktopEnabled(): any {
        if (this._itunesDesktopEnabled && !musicUtil.isMac()) {
            this._itunesDesktopEnabled = false;
        }
        return this._itunesDesktopEnabled;
    }

    get itunesDesktopTrackingEnabled(): any {
        if (this._itunesDesktopTrackingEnabled && !musicUtil.isMac()) {
            this._itunesDesktopTrackingEnabled = false;
        }
        return this._itunesDesktopTrackingEnabled;
    }

    set itunesDesktopTrackingEnabled(newItunesDesktopTrackingEnabled) {
        this._itunesDesktopTrackingEnabled = newItunesDesktopTrackingEnabled;
    }

    set itunesDesktopEnabled(newitunesDesktopEnabled) {
        this._itunesDesktopEnabled = newitunesDesktopEnabled;
    }

    get spotifyDesktopEnabled(): any {
        return this._spotifyDesktopEnabled;
    }

    set spotifyDesktopEnabled(newspotifyDesktopEnabled) {
        this._spotifyDesktopEnabled = newspotifyDesktopEnabled;
    }

    get spotifyApiEnabled(): any {
        return this._spotifyApiEnabled;
    }

    set spotifyApiEnabled(newspotifyApiEnabled) {
        this._spotifyApiEnabled = newspotifyApiEnabled;
    }

    get debug(): boolean {
        return this._debug;
    }

    set debug(isDebug: boolean) {
        this._debug = isDebug;
    }
}
