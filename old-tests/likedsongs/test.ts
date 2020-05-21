const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import { PlayerName, PlayerDevice } from "../../lib/models";
import { MusicController } from "../../lib/controller";
import { MusicUtil } from "../../lib/util";

const testUtil = new TestUtil();
const musicUtil = new MusicUtil();
const musicCtr = MusicController.getInstance();

describe("spotify liked songs tests", () => {
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

    xit("play a set of liked songs", async () => {
        await musicCtr.launchApp(PlayerName.SpotifyDesktop);
        const devices = await CodyMusic.getSpotifyDevices();
        const device: PlayerDevice = devices[0];
        const track_ids = [
            "5QLHGv0DfpeXLNFo7SFEy1",
            "5SjLRpgI7LWFzy9ggSqlkO",
            "1MSM3Fo2fvnwVqMcz8Jhjq",
            "7LVHVU3tWfcxj5aiPFEW4Q"
        ];
        const resp = await CodyMusic.play(PlayerName.SpotifyWeb, {
            track_ids,
            device_id: device.id
        });
        console.log("resp: ", resp);
    });
});
