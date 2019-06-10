import dirTree from 'directory-tree'
import os from 'os'
import chalk from 'chalk'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import rimraf from 'rimraf'
import yaml from 'js-yaml'
import { existsSync, readFile } from 'fs-extra';
import { readdirSync, lstatSync } from 'fs';
const directory = path.resolve(__dirname, process.argv.slice(2)[0])
const tree = (dirTree as any)(directory)
const deleteAfter = true
const CONFIG_FILE_NAME = '.cloud-torrent-config'


const episodes: any = []
recursiveGetSeasons(tree)
;(async () => {
  const config = await getConfig()
  for (const episode of episodes) {
    const input = episode.path
    if (/(mp4|webm)/.test(input)) continue
    const output = path.dirname(input) + "/" + path.basename(input).replace(/mkv$/, 'mp4')
    if (existsSync(output)) continue
    await convertFileInPlace(input, output)
    if (deleteAfter) {
      console.log(chalk.red(`Deleting ${input}`))
      deleteMKV(episode)
    }
  }
})()
const id = "lost"
const name = "Lost"



interface ISeason {
  no: number,
  episodes: IEpisode[]
}

interface IEpisode {
  season: number,
  episode: number,
  name: string,
  path: string
}

function recursiveGetSeasons(tree) {
  if (tree.type === "file") {
    const matches = tree.name.match(/s(\d\d)e(\d\d)/i)
    if (!matches) return
    const [season, episode] = matches.slice(1).map(int => parseInt(int))
    episodes.push({
      episode,
      season,
      name: tree.name,
      path: tree.path,
      position: null,
    })
  } else if (tree.type === "directory") {
    for (const branch of tree.children) {
      recursiveGetSeasons(branch)
    }
  }
}

function convertFileInPlace(input: string, output: string) {
  return new Promise((res, rej) => {
    if (/mkv$/.test(input)) {
      console.log(chalk.yellow(`Processing ${path.basename(input)}`))
      ffmpeg(input).output(output)
        .on('progress', function(progress) {
          process.stdout.write("\r\x1b[K")
          process.stdout.write(chalk.cyan((progress.percent* 100 | 0)/ 100 + "%"));
        })
        .on('end', () => {
          process.stdout.write("\r\x1b[K")
          console.log(chalk.green(`Completed ${output}`))
          res()
        })
        .on('error', e => {
          console.error(e)
          rej(e)
        })
        .run()
    }
  })
}

function deleteMKV(episode) {
  if (/mkv$/.test(episode.path)) {
    rimraf(episode.path, () => {})
  }
}
function deleteWebm(episode) {
  if (/webm$/.test(episode.path)) {
    rimraf(episode.path, () => {})
  }
}

async function getConfig() {
  const config:any = getMainConfig()
  config.subconfigs = config.sources(getSubConfig)




}

async function getMainConfig() {
  const configFile = path.resolve(os.homedir(), CONFIG_FILE_NAME)
  let config
  const startConfig = {
    sources: [
      {
        path: __dirname + '/_videos',
        subconfigs: [],
        lastShow: null,
      }
    ]
  }
  if (existsSync(configFile)) {
    config = yaml.safeLoad((await readFile(configFile)).toString())
  } else {
    config = startConfig
  }
  return config
}

async function getSubConfig(source) {

}

function isDirectory (source) {
  lstatSync(source).isDirectory()
}
function getSubdirectories (source) {
  readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)
}