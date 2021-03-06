import { SpotifyAudioFeature } from "./models";
import { MusicClient } from "./client";
import { MusicUtil } from "./util";

const musicClient = MusicClient.getInstance();
const musicUtil = new MusicUtil();

export class AudioStat {
    private static instance: AudioStat;
    private constructor() {
        //
    }
    static getInstance() {
        if (!AudioStat.instance) {
            AudioStat.instance = new AudioStat();
        }
        return AudioStat.instance;
    }

    async getSpotifyAudioFeatures(
        ids: string[]
    ): Promise<SpotifyAudioFeature[]> {
        let audiofeatures: SpotifyAudioFeature[] = [];
        if (!ids || ids.length === 0) {
            return audiofeatures;
        }
        // make sure the IDs are the short spotify ID format
        ids = ids.map((id) => {
            return musicUtil.createSpotifyIdFromUri(id);
        });

        if (ids.length > 0) {
            // still some ids left, fetch the features for these ids
            const qstr = `?ids=${ids.join(",")}`;

            const api = `/v1/audio-features${qstr}`;

            let response = await musicClient.spotifyApiGet(api);
            // check if the token needs to be refreshed
            if (response.status === 401) {
                // refresh the token
                await musicClient.refreshSpotifyToken();
                // try again
                response = await musicClient.spotifyApiGet(api);
            }
            // response.data will have a listof audio_features if it's successful:
            if (
                response.data &&
                response.status === 200 &&
                response.data.audio_features
            ) {
                /**
                * { "audio_features":
                [ { "danceability": 0.808,
                    "energy": 0.626,
                    "key": 7,
                    "loudness": -12.733,
                    "mode": 1,
                    "speechiness": 0.168,
                    "acousticness": 0.00187,
                    "instrumentalness": 0.159,
                    "liveness": 0.376,
                    "valence": 0.369,
                    "tempo": 123.99,
                    "type": "audio_features",
                    "id": "4JpKVNYnVcJ8tuMKjAj50A",
                    "uri": "spotify:track:4JpKVNYnVcJ8tuMKjAj50A",
                    "track_href": "https://api.spotify.com/v1/tracks/4JpKVNYnVcJ8tuMKjAj50A",
                    "analysis_url": "http://echonest-analysis.s3.amazonaws.com/TR/WhpYUARk1kNJ_qP0AdKGcDDFKOQTTgsOoINrqyPQjkUnbteuuBiyj_u94iFCSGzdxGiwqQ6d77f4QLL_8=/3/full.json?AWSAccessKeyId=AKIAJRDFEY23UEVW42BQ&Expires=1458063189&Signature=JRE8SDZStpNOdUsPN/PoS49FMtQ%3D",
                    "duration_ms": 535223,
                    "time_signature": 4
                    },
                */
                let audio_features: SpotifyAudioFeature[] =
                    response.data.audio_features;
                if (audio_features && audio_features.length > 0) {
                    audio_features.forEach((feature) => {
                        if (feature) {
                            audiofeatures.push(feature);
                        }
                    });
                }
            }
        }
        return audiofeatures;
    }
}
