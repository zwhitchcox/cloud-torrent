import chalk from 'chalk'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import rimraf from 'rimraf'
import { getMainConfig, saveMainConfig } from './config';
import { existsSync } from 'fs-extra';
import { getShowsInfo } from './info';
const deleteAfter = true


// TODO Batch Process

let mainConfig

;(async () => {
  mainConfig = await getMainConfig()
  await deleteFile(__dirname + '/.tmp.mp4')
  await setProcessingFiles(null)
  const {sources} = mainConfig
  const shows = await getShowsInfo(sources)
  for (const show in shows) {
    console.log('converting', show)
    const {episodes} = shows[show]
    await convertEpisodes(episodes)
  }
})()


async function convertEpisodes(episodes) {
  for (const episodeName in episodes) {
    const episode = episodes[episodeName]
    const input = episode
    if (/(mp4)$/.test(input)) continue
    const output = path.dirname(input) + "/" + path.basename(input).replace(/\.[a-z0-9]+$/, '.mp4')
    if (existsSync(output)) continue
    await convertFileInPlace(input, output)
    if (deleteAfter) {
      console.log(chalk.red(`Deleting ${input}`))
      deleteFile(input)
    }
  }
}


async function setProcessingFiles(file) {
  mainConfig.processing = file
  await saveMainConfig(mainConfig)
}





function convertFileInPlace(input: string, output: string) {
  return new Promise((res, rej) => {
    if (/.mkv$/.test(input)) {
      console.log(chalk.yellow(`Processing ${path.basename(input)}`))
      const tmppath = __dirname + '/.tmp.mp4'
      const timeStart = +new Date
      ffmpeg(input).output(tmppath)
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
        .on('progress', function(progress) {
          process.stdout.write("\r\x1b[K")
          process.stdout.write(chalk.cyan((progress.percent* 100 | 0)/ 100 + "%"));
        })
        .on('end', () => {
          process.stdout.write("\r\x1b[K")
          console.log(chalk.green(`Completed ${output}`))
          move(tmppath, output, async () => {
            const timeEnd = + new Date
            const milliseconds = timeEnd - timeStart
            const seconds = milliseconds / 1000
            console.log(chalk.cyan(`Processing time ${seconds/60|0}:${padLeft(seconds % 60, 0, 2)}` ))
            await deleteFile(tmppath)
            res()
          })
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

function move(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

function padLeft(str, padding, len) {
  while(str.length < len) {
    str = padding + str
  }
  return str
}