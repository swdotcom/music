import * as CodyMusic from "../../index";
import { Track } from "../../lib/models";
import { TestUtil } from "../util";

const expect = require("chai").expect;

const dosageAlbumUri = "spotify:album:10h0WKev2yYudLvXIVvSFP";
const trackName = "Heavy";

describe("album-fetch-tests", () => {
  before(() => {
    new TestUtil().initializeSpotifyConfig();
  });

  context("Validate fetching album tracks", () => {
    it("should contain tracks of an album", async () => {
      const tracks: Track[] = await CodyMusic.getSpotifyAlbumTracks(dosageAlbumUri);
      const foundTrack: any = tracks.find((n: any) => n.name === trackName);
      expect(foundTrack.artist).equals("Collective Soul");
    });
  });
});
