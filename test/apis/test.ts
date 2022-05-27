const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";

const testUtil = new TestUtil();

describe("refreshSpotifyAccessToken()", () => {
  let configFile = __dirname + "/../config.json";
  let data = testUtil.getJsonFromFile(configFile);

  before(function () {
      CodyMusic.setCredentials({
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
      });
  });

  it("updates the access token", async () => {
      await CodyMusic.refreshSpotifyAccessToken();
      expect(CodyMusic.getSpotifyAccessToken()).not.to.eq(data.accessToken);
  });

  it("returns true", async () => {
      const wasRefreshed = await CodyMusic.refreshSpotifyAccessToken();
      expect(wasRefreshed).to.be.true;
  });
});
