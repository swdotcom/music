const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";

describe("refreshSpotifyAccessToken()", () => {
  before(function () {
    new TestUtil().initializeSpotifyConfig();
  });

  it("updates the access token", async () => {
      await CodyMusic.refreshSpotifyAccessToken();
      expect(CodyMusic.getSpotifyAccessToken()).not.to.eq(process.env.ACCESS_TOKEN);
  });

  it("returns true", async () => {
      expect(await CodyMusic.refreshSpotifyAccessToken()).to.be.true;
  });
});

describe("searchTracks()", () => {
  before(function () {
    new TestUtil().initializeSpotifyConfig();
  });

  it("returns a list of tracks", async () => {
    const searchResults = await CodyMusic.searchTracks("Kanye West");
    expect(searchResults.tracks.items).to.be.an("array");
  });
});
