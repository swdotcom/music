export class CacheUtil {
    private cache: any = {};

    private static instance: CacheUtil;
    private constructor() {
        // every 10 minutes check if we should expire any of the cache items
        setInterval(() => {
            this.checkCacheItemExpiration();
        }, 1000 * 60 * 10);
    }

    static getInstance() {
        if (!CacheUtil.instance) {
            CacheUtil.instance = new CacheUtil();
        }
        return CacheUtil.instance;
    }

    isCacheExpired(key: string) {
        const data = this.cache[key];
        const now = new Date().getTime();
        if (!data) {
            return true;
        } else {
            // check to see if the data for this cache key has expired
            const millisThreshold = data.expireInSeconds * 1000;
            const ellapsedMillis = now - data.millisTime;
            if (ellapsedMillis > millisThreshold) {
                return true;
            }
        }
        return false;
    }

    getItem(key: string) {
        if (this.cache[key] && !this.isCacheExpired(key)) {
            const val = JSON.parse(this.cache[key].value);
            return val;
        }
        return null;
    }

    setItem(key: string, value: any, expireInSeconds: number) {
        const now = new Date().getTime();
        this.cache[key] = {
            value: JSON.stringify(value),
            expireInSeconds,
            millisTime: now
        };
    }

    deleteItem(key: string) {
        if (this.cache[key]) {
            this.cache[key] = null;
        }
    }

    resetCache() {
        this.cache = {};
    }

    // logic to check if we should expire the cache
    checkCacheItemExpiration() {
        if (this.cache) {
            Object.keys(this.cache).forEach(key => {
                if (this.isCacheExpired(key)) {
                    // delete the cache
                    this.deleteItem(key);
                }
            });
        }
    }
}
