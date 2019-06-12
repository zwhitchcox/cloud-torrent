import chalk from 'chalk'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import rimraf from 'rimraf'
import { getShowsInfo } from './config';
const deleteAfter = true


const episodes: any = []
;(async () => {
  const info = await getShowsInfo()
  // for (const episode of episodes) {
  //   const input = episode.path
  //   if (/(mp4|webm)/.test(input)) continue
  //   const output = path.dirname(input) + "/" + path.basename(input).replace(/mkv$/, 'mp4')
  //   if (existsSync(output)) continue
  //   await convertFileInPlace(input, output)
  //   if (deleteAfter) {
  //     console.log(chalk.red(`Deleting ${input}`))
  //     deleteMKV(episode)
  //   }
  // }
})()



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


