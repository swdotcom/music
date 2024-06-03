import { setConfig } from "../lib/apis";
import { CodyConfig } from "../lib/models";

export class TestUtil {
  initializeSpotifyConfig(
    accessTokenOverride: string = "",
    clientSecretOverride: string = ""
  ) {
    require('dotenv').config({ path: '.env.local' });
    const codyConfig: CodyConfig = new CodyConfig();
    codyConfig.spotifyAccessToken = accessTokenOverride || process.env.ACCESS_TOKEN || '';
    codyConfig.spotifyRefreshToken = process.env.REFRESH_TOKEN || '';
    codyConfig.spotifyClientId = process.env.CLIENT_ID || '';
    codyConfig.spotifyClientSecret = clientSecretOverride || process.env.CLIENT_SECRET || '';
    setConfig(codyConfig);
  }
}
