const fs = require("fs");

export class TestUtil {
    getJsonFromFile(filename: string) {
        let content = fs.readFileSync(filename).toString();
        if (content) {
            try {
                const data = JSON.parse(content);
                return data;
            } catch (e) {
                //
            }
        }
        return null;
    }
}
