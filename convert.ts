import chalk from 'chalk'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import rimraf from 'rimraf'
import { getMainConfig, saveMainConfig } from './config';
import { existsSync } from 'fs-extra';
import { getShowsInfo } from './info';
const deleteAfter = true



let mainConfig

;(async () => {
  mainConfig = await getMainConfig()
  if (mainConfig.processing) {
    await deleteFile(mainConfig.processing)
    await setProcessingFile(null)
  }
  const {sources} = mainConfig
  const shows = await getShowsInfo(sources)
  for (const show in shows) {
    const {episodes} = shows[show]
    await convertEpisodes(episodes)
  }
})()


async function convertEpisodes(episodes) {
  for (const episodeName in episodes) {
    const episode = episodes[episodeName]
    const input = episode
    if (/(mp4|webm)$/.test(input)) continue
    const output = path.dirname(input) + "/" + path.basename(input).replace(/mkv$/, 'mp4')
    if (existsSync(output)) continue
    await setProcessingFile(output)
    await convertFileInPlace(input, output)
    await setProcessingFile(null)
    if (deleteAfter) {
      console.log(chalk.red(`Deleting ${input}`))
      deleteFile(input)
    }
  }
}

async function setProcessingFile(file) {
  mainConfig.processing = file
  await saveMainConfig(mainConfig)
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

function deleteFile(path) {
  return rimraf(path, () => {})
}
