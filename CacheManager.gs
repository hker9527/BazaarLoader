const cache = CacheService.getScriptCache();

function get(key, url, options = {}) {
    const d = new Date();
    
    const json = options.json || false;
    const validate = options.validate || (() => {return true});
    const format = options.format || ((a) => a);
    const timeout = options.timeout || 60 * 1000;
    
    const output = [null, null];

    const oldData = cache.get(key);
    if (oldData !== null) {
        const oldJson = JSON.parse(oldData);
        output[0] = oldJson.d;
        if (d - oldJson.u < timeout) {
            output[1] = oldJson.d;
            return output;
        }
    }
    const value = UrlFetchApp.fetch(url).getContentText();
    const newJson = {
        u: new Date(),
        d: json ? format(JSON.parse(value)) : format(value)
    };
    const newData = JSON.stringify(newJson);
    output[1] = newJson.d;
    if (oldData === null) output[0] = newJson.d;
    if (validate(newJson.d)) {
        cache.put(key, newData);
    } else {
        Logger.log("Validate failed for new data " + newData);
    }
    return output;
}