"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const CONFIG_FILE_NAME = '.cloud-torrent-config';
async function getMainConfig() {
    const mainConfigFilePath = getConfigFilePath(os_1.default.homedir());
    const defaultMainConfig = {
        sources: [
            {
                path: __dirname + '/_videos',
            },
        ]
    };
    return readConfigFile(mainConfigFilePath, defaultMainConfig);
}
exports.getMainConfig = getMainConfig;
async function saveMainConfig(config) {
    const mainConfigFilePath = getConfigFilePath(os_1.default.homedir());
    await fs_extra_1.writeFile(mainConfigFilePath, js_yaml_1.default.safeDump(config));
}
exports.saveMainConfig = saveMainConfig;
async function readConfigFile(configFilePath, alternative) {
    let config;
    if (fs_extra_1.existsSync(configFilePath)) {
        config = js_yaml_1.default.safeLoad((await fs_extra_1.readFile(configFilePath)).toString());
    }
    else {
        config = alternative;
        await fs_extra_1.writeFile(configFilePath, js_yaml_1.default.safeDump(config));
    }
    return config;
}
function getConfigFilePath(dir) {
    return path_1.default.resolve(dir, CONFIG_FILE_NAME);
}
function copy(original, destination) {
    return new Promise((res, rej) => {
        var readStream = fs_1.default.createReadStream(original);
        var writeStream = fs_1.default.createWriteStream(destination);
        readStream.on('error', rej);
        writeStream.on('error', rej);
        readStream.on('close', res);
        readStream.pipe(writeStream);
    });
}
//# sourceMappingURL=config.js.map