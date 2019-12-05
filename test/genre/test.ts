import { TestUtil } from "../util";
const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");

const testUtil = new TestUtil();

describe("genre tests", () => {
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

    it("Fetch genre from itunes using artist and song", done => {
        CodyMusic.getGenre("Hozier", "Movement - Single").then(
            (result: any) => {
                expect(result).to.not.equal("");
                done();
            }
        );
    });

    it("Fetch genre from itunes using artist", done => {
        CodyMusic.getGenre("Hozier").then((result: any) => {
            expect(result).to.not.equal("");
            done();
        });
    });

    it("Fetch highest frequency genre", done => {
        // song: Lemonworld
        // artist: The National
        // genre: chamber pop folk-pop indie folk indie pop indie rock modern rock stomp and holler
        CodyMusic.getSpotifyGenre("The National").then((result: any) => {
            console.log("GENRE: ", result);
            expect(result).to.not.equal("");
            done();
        });
    });

    it("Fetch highest frequency genre part 2", done => {
        // song: Soliloquy
        // artist: Isaiah Rashad
        // genre: chamber pop folk-pop indie folk indie pop indie rock modern rock stomp and holler
        CodyMusic.getSpotifyGenre("Isaiah Rashad").then((result: any) => {
            console.log("GENRE: ", result);
            expect(result).to.not.equal("");
            done();
        });
    });
});
