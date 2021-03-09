import * as CodyMusic from "../../index";
import { Track } from "../../lib/models";

const expect = require("chai").expect;

const dosageAlbumUri = "spotify:album:10h0WKev2yYudLvXIVvSFP";
const trackName = "Heavy";

describe("album-fetch-tests", () => {
  before(() => {
    const creds = {
      refreshToken: process.env.REFRESH_TOKEN,
      clientSecret: process.env.CLIENT_SECRET,
      clientId: process.env.CLIENT_ID,
      accessToken: process.env.ACCESS_TOKEN,
    };
    CodyMusic.setCredentials(creds);
  });

  context("Validate fetching album tracks", () => {
    it("should contain tracks of an album", async () => {
      const tracks: Track[] = await CodyMusic.getSpotifyAlbumTracks(dosageAlbumUri);
      const foundTrack: any = tracks.find((n: any) => n.name === trackName);
      expect(foundTrack.artist).equals("Collective Soul");
    });
  });
});
