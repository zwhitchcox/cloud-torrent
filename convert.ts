import chalk from 'chalk'
import fs from 'fs'
import rmfr from 'rmfr'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import { getMainConfig } from './config';
import { getShowsInfo } from './info';
const deleteAfter = true

// always sunny 0604 - 0606
let mainConfig
const convertRegExp = /Office.*.mkv$/
;(async () => {
  mainConfig = await getMainConfig()
  await deleteFile(__dirname + '/.tmp.mp4')
  await deleteFile(__dirname + '/.tmp.mkv')
  const {sources} = mainConfig
  const shows = await getShowsInfo(sources)
  logLeft(shows)
  for (const show in shows) {
    const {episodes} = shows[show]
    await convertEpisodes(episodes)
  }
})()


async function convertEpisodes(episodes) {
  for (const episodeName of Object.keys(episodes).sort()) {
    const episode = episodes[episodeName]
    const input = episode
    if (!convertRegExp.test(input)) continue
    //const output = path.dirname(input) + "/" + path.basename(input).replace(/\.[a-z0-9]+$/, '.mp4')
    // if (existsSync(output)) continue
    await convertFileInPlace(input, input)
    //if (deleteAfter) {
      //console.log(chalk.green(`Deleting ${input}`))
      //deleteFile(input)
    //}
    if (process.env.TEST) {process.exit(0)}
  }
}

function convertFileInPlace(input: string, output: string) {
  return new Promise((res, rej) => {
    if (convertRegExp.test(input)) {
      console.log(chalk.yellow(`Processing ${path.basename(input)}`))
      const tmppath = __dirname + '/.tmp' + path.extname(input)
      if (process.env.TEST) {
        output = __dirname + '/test' + path.extname(input)
      }
      const timeStart = +new Date
      ffmpeg(input).output(tmppath)
        .outputOptions([
            '-c:a aac',
            '-c:v copy',
          ...(process.env.TEST ?
          [
          '-ss 00:01:30.0',
          '-t 20',
          ]: []),
          // '-f mp4',
          // '-c:a aac',
          // '-c:v copy', // todo check if already
          // '-movflags frag_keyframe+faststart',

          // copied from website
          //'-f mp4',
          //'-level 4.1',
          // '-profile:v high',
          //'-filter:v fps=fps=30', // todo check video 1080p
            //'-c:v libx264', // todo check if already
            //'-movflags frag_keyframe+faststart',
            //'-b:a 320k',
          // '-f mp4',
          // '-codec copy',
          // '-strict',
          // '-2',
          // '-c:a aac',
          // '-f mp4',
          // '-b:a 320k',
          // '-c:a aac',
          // '-movflags faststart',
          // '-x264opts bframes=3:cabac=1',
          // '-pix_fmt yuv420p',
          // '-bufsize 16M',
          // '-maxrate 10M',
          // '-crf 18',
          // '-level 5',
          // '-profile:v high',
          // '-c:v libx264',
          // only 10 seconds for testing
          // '-ss 00:01:30.0',
          // '-t 20',
          // `-vf "scale=iw*sar:ih, scale='if(gt(iw,ih),min(1920,iw),-1)':'if(gt(iw,ih),-1,min(1080,ih))'"`,
        ])
        .on('progress', function(progress) {
          process.stdout.write("\r\x1b[K")
          process.stdout.write(chalk.cyan((progress.percent* 100 | 0)/ 100 + "%"));
        })
        .on('end', async () => {
          process.stdout.write("\r\x1b[K")
          console.log(chalk.green(`Completed ${output}`))
          await deleteFile(input)
          move(tmppath, output, async () => {
            const timeEnd = + new Date
            const milliseconds = timeEnd - timeStart
            const seconds = milliseconds / 1000
            console.log(chalk.green(`Processing time ${seconds/60|0}:${padLeft(seconds % 60, 0, 2)}` ))
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
  if (!process.env.TEST) {
    return rmfr(path)
  }
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

function logLeft(shows) {
  let episodeCount = 0
  let total = 0
  for (const show in shows) {
    const { episodes } = shows[show]
    const toConvert = Object.entries(episodes).filter(([episode, episodePath]) => convertRegExp.test(episodePath as string))
    total += Object.entries(episodes).length
    episodeCount += toConvert.length
  }
  console.log(`${episodeCount} left out of ${total} (${(total - episodeCount) / total * 100 | 0}%)`)
}
