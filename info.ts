import { existsSync } from 'fs-extra';
import { readdirSync, lstatSync } from 'fs';
import path from 'path'
import walk from 'walk'

export async function getShowsInfo(sources) {
  const showpaths = {}
  for (const source of sources) {
    if (!existsSync(source.path)) continue
    const subdirectories = getSubdirectories(source.path)
    for (const subdirectoryPath of subdirectories) {
      if (path.basename(subdirectoryPath) === 'Movies') continue
      showpaths[path.basename(subdirectoryPath)] = subdirectoryPath
    }
  }

  const showsInfo = {}
  for (const showname in showpaths) {
    showsInfo[showname] = await getShowInfo(showpaths[showname], showname)
  }
  return showsInfo
}

async function getShowInfo(showpath, showname) {
  const aliases = getShowAliases(showname)
  return {
    aliases,
    path: showpath,
    episodes: await getEpisodes(showpath),
  }
}

const getEpisodesDragonBall = async showpath => {
  const episodePaths = (await getFileList(showpath) as string[])
    .filter(filePath => (/Episode \d+/i.test(filePath) && !/\.srt$/.test(filePath)))
  
  const episodes = {}
  for (const episodePath of episodePaths) {
    const matches = episodePath.match(/Episode (\d+)/i)
    if (matches) {
      const episode = matches[1].padStart(3, "0")
      const episodeID = "s00e" + episode
      episodes[episodeID] = episodePath
    }
  }
  return episodes
}
async function getEpisodes(showpath) {
  if (/Dragon Ball$/.test(showpath)){
    return await getEpisodesDragonBall(showpath)
  }
  const episodePaths = (await getFileList(showpath) as string[])
    .filter(filePath => (/S\d+E\d+/i.test(filePath) && !/\.srt$/.test(filePath)))
  const episodes = {}
  for (const episodePath of episodePaths) {
    const matches = episodePath.match(/s\d+e\d+/i)
    if (matches) {
      const episodeID = matches[0]
      episodes[episodeID] = episodePath
    }
  }
  return episodes
}

async function getFileList(showpath) {
  return new Promise((res, rej) => {
    const files: string[] = []
    const walker = walk.walk(showpath, { followLinks: false })
    walker.on('file', function(root, stat, next) {
        files.push(root + '/' + stat.name);
        next()
    })
    walker.on('end', function() {
      res(files);
    })
  })
}

function getShowAliases(name) {
  const aliases: string[] = []
  if (name.split(' ').length > 2) {
    aliases.push(getAcronym(name))
  }
  aliases.push(getHyphenated(name))
  return aliases
}
function getAcronym(name) {
  return name.split(' ').map(namePart => namePart.charAt(0).toLowerCase()).join('')
}
function getHyphenated(name) {
  return name.split(' ').map(namePart => namePart.toLowerCase()).join('-')
}

function getSubdirectories (source) {
  return readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)
}

function isDirectory (source) {
  return lstatSync(source).isDirectory()
}
