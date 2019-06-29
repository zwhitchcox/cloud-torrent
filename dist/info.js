"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const walk_1 = __importDefault(require("walk"));
async function getShowsInfo(sources) {
    const showpaths = {};
    for (const source of sources) {
        if (!fs_extra_1.existsSync(source.path))
            continue;
        const subdirectories = getSubdirectories(source.path);
        for (const subdirectoryPath of subdirectories) {
            if (path_1.default.basename(subdirectoryPath) === 'Movies')
                continue;
            showpaths[path_1.default.basename(subdirectoryPath)] = subdirectoryPath;
        }
    }
    const showsInfo = {};
    for (const showname in showpaths) {
        showsInfo[showname] = await getShowInfo(showpaths[showname], showname);
    }
    return showsInfo;
}
exports.getShowsInfo = getShowsInfo;
async function getShowInfo(showpath, showname) {
    const aliases = getShowAliases(showname);
    return {
        aliases,
        path: showpath,
        episodes: await getEpisodes(showpath),
    };
}
async function getEpisodes(showpath) {
    const episodePaths = (await getFileList(showpath))
        .filter(filePath => (/S\d\dE\d\d/i.test(filePath) && !/\.srt$/.test(filePath)));
    const episodes = {};
    for (const episodePath of episodePaths) {
        const matches = episodePath.match(/s\d\de\d\d/i);
        if (matches) {
            const episodeID = matches[0];
            episodes[episodeID] = episodePath;
        }
    }
    return episodes;
}
async function getFileList(showpath) {
    return new Promise((res, rej) => {
        const files = [];
        const walker = walk_1.default.walk(showpath, { followLinks: false });
        walker.on('file', function (root, stat, next) {
            files.push(root + '/' + stat.name);
            next();
        });
        walker.on('end', function () {
            res(files);
        });
    });
}
function getShowAliases(name) {
    const aliases = [];
    if (name.split(' ').length > 2) {
        aliases.push(getAcronym(name));
    }
    aliases.push(getHyphenated(name));
    return aliases;
}
function getAcronym(name) {
    return name.split(' ').map(namePart => namePart.charAt(0).toLowerCase()).join('');
}
function getHyphenated(name) {
    return name.split(' ').map(namePart => namePart.toLowerCase()).join('-');
}
function getSubdirectories(source) {
    return fs_1.readdirSync(source).map(name => path_1.default.join(source, name)).filter(isDirectory);
}
function isDirectory(source) {
    return fs_1.lstatSync(source).isDirectory();
}
//# sourceMappingURL=info.js.map