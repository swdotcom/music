import * as CodyMusic from "../../index";
import { Track } from "../../lib/models";

const expect = require("chai").expect;

const trackURIs = [
	"spotify:track:00VKR5XH5jid1AgUdFz4bs",
	"spotify:track:013AWvizllIUEC2FOBzOnh",
	"spotify:track:0aF5lDR6bB34Bhx2MefN1X"
];

describe("track-bulk-fetch-tests", () => {

	before(() => {
		CodyMusic.setCredentials({
			refreshToken: process.env.REFRESH_TOKEN,
			clientSecret: process.env.CLIENT_SECRET,
			clientId: process.env.CLIENT_ID,
			accessToken: process.env.ACCESS_TOKEN,
		});
	});

	context("Validate populating features and artists", () => {

		// validate features and artists to save on the outgoing spotify API calls
		it("should contain features and artists", async () => {
			// fully populate the tracks and validate features
			const tracks: Track[] = await CodyMusic.getSpotifyTracks(trackURIs, true, true);

			// make sure it has features for all 3 track uri's
			let featureCount = 0;
			tracks.forEach((track: Track) => {
				if (track.features.loudness) {
					featureCount++;
				}
			});

			// validate
			expect(featureCount).to.eql(trackURIs.length);

			// make sure there's at least 1 image for each track "artist"
			let artistImageCount = 0;
			tracks.forEach((track: Track) => {
				for (let i = 0; i < track.artists.length; i++) {
					if (track.artists[i].images.length) {
						artistImageCount++;
						break;
					}
				}
			});

			// validate
			expect(artistImageCount).to.eql(trackURIs.length);
		});

	});

});
