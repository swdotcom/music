const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import {
    PlayerName,
    PlaylistItem,
    Track,
    CodyResponse
} from "../../lib/models";
import { UserProfile, SpotifyUser } from "../../lib/profile";
import { create } from "domain";

const userProfile = UserProfile.getInstance();

const testUtil = new TestUtil();

const trackId = "4iV5W9uYEdYUVa79Axb7Rh";

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify playlist tests", () => {
    before(async () => {
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        await CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
        });

        await CodyMusic.removeFromSpotifyLiked([trackId]);
    });

    after("clean up spotify playlist testing", done => {
        done();
    });

    xit("create a spotify playlist", async () => {
        let result: CodyResponse = await CodyMusic.createPlaylist(
            "cody-favs",
            false /*isPublic*/
        );
        expect(result.data.id).to.not.equal("");
        const playlist_id = result.data.id;
        result = await CodyMusic.playSpotifyPlaylist(playlist_id);
        result = await CodyMusic.deletePlaylist(playlist_id);
        expect(result.status).to.equal(200);
    });

    it("return spotify playlists", async () => {
        const playlists = await CodyMusic.getPlaylists(PlayerName.SpotifyWeb);
        expect(playlists.length).to.not.equal(0);
    });

    xit("return spotify playlist names", done => {
        CodyMusic.getPlaylistNames(PlayerName.SpotifyWeb).then(result => {
            expect(result.length).to.not.equal(0);
            done();
        });
    });

    xit("return the tracks of a playlist", done => {
        CodyMusic.getPlaylists(PlayerName.SpotifyWeb).then(result => {
            let playlist_id = result[0].id;
            CodyMusic.getPlaylistTracks(
                PlayerName.SpotifyWeb,
                playlist_id
            ).then(async result => {
                const spotifyUser = await userProfile.getUserProfile();

                expect(result.data.items[0]).to.not.equal(null);
                expect(result.data.items[0].id).to.not.equal("");

                const playlistUri = `${spotifyUser.uri}:playlist:${playlist_id}`;
                const options = {
                    context_uri: playlistUri,
                    track_ids: [result.data.items[0].id]
                };

                CodyMusic.play(PlayerName.SpotifyWeb, options).then(result => {
                    // this should result in 204, not 400 or 500
                    expect(result.status).to.equal(204);
                    done();
                });
            });
        });
    });

    it("save tracks to liked playlist", async () => {
        const resp = await CodyMusic.saveToSpotifyLiked([trackId]);

        let tracks = await CodyMusic.getSavedTracks(PlayerName.SpotifyWeb, {
            limit: 50
        });

        let createdTrack = tracks.filter(n => n.id === trackId);

        expect(createdTrack).to.not.equal(null);

        // now delete it

        await CodyMusic.removeFromSpotifyLiked([trackId]);

        tracks = await CodyMusic.getSavedTracks(PlayerName.SpotifyWeb, {
            limit: 50
        });

        createdTrack = tracks.filter(n => n.id === trackId);

        // should be an empty list
        const isEmtpy = !createdTrack || createdTrack.length === 0;

        // now it should be null
        expect(isEmtpy).to.equal(true);
    });

    it("Get spotify top tracks", async () => {
        const topTracks: Track[] = await CodyMusic.getTopSpotifyTracks();
        expect(topTracks.length).to.not.equal(0);
    });

    it("Get a Playlist by ID", async () => {
        const playlistItem: PlaylistItem = await CodyMusic.getSpotifyPlaylist(
            "6jCkTED0V5NEuM8sKbGG1Z"
        );

        expect(playlistItem.name).to.not.equal(null);
    });
});