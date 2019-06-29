"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const config_1 = require("./config");
const fs_extra_1 = require("fs-extra");
const info_1 = require("./info");
const deleteAfter = true;
// TODO Batch Process
let mainConfig;
(async () => {
    mainConfig = await config_1.getMainConfig();
    await deleteFile(__dirname + '/.tmp.mp4');
    await setProcessingFiles(null);
    const { sources } = mainConfig;
    const shows = await info_1.getShowsInfo(sources);
    for (const show in shows) {
        console.log('converting', show);
        const { episodes } = shows[show];
        await convertEpisodes(episodes);
    }
})();
async function convertEpisodes(episodes) {
    for (const episodeName in episodes) {
        const episode = episodes[episodeName];
        const input = episode;
        if (/(mp4)$/.test(input))
            continue;
        const output = path_1.default.dirname(input) + "/" + path_1.default.basename(input).replace(/\.[a-z0-9]+$/, '.mp4');
        if (fs_extra_1.existsSync(output))
            continue;
        await convertFileInPlace(input, output);
        if (deleteAfter) {
            console.log(chalk_1.default.red(`Deleting ${input}`));
            deleteFile(input);
        }
    }
}
async function setProcessingFiles(file) {
    mainConfig.processing = file;
    await config_1.saveMainConfig(mainConfig);
}
function convertFileInPlace(input, output) {
    return new Promise((res, rej) => {
        if (/.mkv$/.test(input)) {
            console.log(chalk_1.default.yellow(`Processing ${path_1.default.basename(input)}`));
            const tmppath = __dirname + '/.tmp.mp4';
            const timeStart = +new Date;
            fluent_ffmpeg_1.default(input).output(tmppath)
                .outputOptions([
                '-b:a 320k',
                '-c:a aac',
                '-movflags faststart',
                '-x264opts bframes=3:cabac=1',
                // `-vf "scale=iw*sar:ih, scale='if(gt(iw,ih),min(1920,iw),-1)':'if(gt(iw,ih),-1,min(1080,ih))'"`,
                '-pix_fmt yuv420p',
                '-bufsize 16M',
                '-maxrate 10M',
                '-crf 18',
                '-level 5',
                '-profile:v high',
                '-c:v libx264',
            ])
                .on('progress', function (progress) {
                process.stdout.write("\r\x1b[K");
                process.stdout.write(chalk_1.default.cyan((progress.percent * 100 | 0) / 100 + "%"));
            })
                .on('end', () => {
                process.stdout.write("\r\x1b[K");
                console.log(chalk_1.default.green(`Completed ${output}`));
                move(tmppath, output, async () => {
                    const timeEnd = +new Date;
                    const milliseconds = timeEnd - timeStart;
                    const seconds = milliseconds / 1000;
                    console.log(chalk_1.default.cyan(`Processing time ${seconds / 60 | 0}:${padLeft(seconds % 60, 0, 2)}`));
                    await deleteFile(tmppath);
                    res();
                });
            })
                .on('error', e => {
                console.error(e);
                rej(e);
            })
                .run();
        }
    });
}
function deleteFile(path) {
    return rimraf_1.default(path, () => { });
}
function move(oldPath, newPath, callback) {
    fs_1.default.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            }
            else {
                callback(err);
            }
            return;
        }
        callback();
    });
    function copy() {
        var readStream = fs_1.default.createReadStream(oldPath);
        var writeStream = fs_1.default.createWriteStream(newPath);
        readStream.on('error', callback);
        writeStream.on('error', callback);
        readStream.on('close', function () {
            fs_1.default.unlink(oldPath, callback);
        });
        readStream.pipe(writeStream);
    }
}
function padLeft(str, padding, len) {
    while (str.length < len) {
        str = padding + str;
    }
    return str;
}
//# sourceMappingURL=convert.js.map