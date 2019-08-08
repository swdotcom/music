const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import { PlayerName, PlaylistItem } from "../../lib/models";
import { UserProfile, SpotifyUser } from "../../lib/profile";

const userProfile = UserProfile.getInstance();

const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify playlist tests", () => {
    before(done => {
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
        });

        done();
    });

    after("clean up spotify playlist testing", done => {
        done();
    });

    it("create a spotify playlist", async () => {
        let result = await CodyMusic.createPlaylist(
            "cody-favs",
            false /*isPublic*/
        );
        expect(result.data.id).to.not.equal("");
        const playlist_id = result.data.id;
        result = await CodyMusic.playSpotifyPlaylist(playlist_id);
        console.log("result of playing the playlist: ", result);
        result = await CodyMusic.deletePlaylist(playlist_id);
        expect(result.status).to.equal(200);
    });

    xit("return spotify playlists", done => {
        CodyMusic.getPlaylists(PlayerName.SpotifyWeb).then(
            (result: PlaylistItem[]) => {
                expect(result.length).to.not.equal(0);
                const playlistItem: PlaylistItem = result[0];
                expect(playlistItem.tracks.total).to.not.equal(0);
                done();
            }
        );
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

                const playlistUri = `${
                    spotifyUser.uri
                }:playlist:${playlist_id}`;
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
});
