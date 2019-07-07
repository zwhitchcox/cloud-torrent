import express from 'express'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { getMainConfig } from './config';
import { getShowsInfo } from './info';
import { createReadStream, statSync } from 'fs';
import { on } from 'cluster';
const app = express()

;(async function() {
  const config = await getMainConfig()
  const shows = await getShowsInfo(config.sources)
  for (const showname in shows) {
    const webpath = showname.toLowerCase().replace(/ /g, '-')
    const show = shows[showname]
    for (const episodeNumber in show.episodes) {
      const filePath = show.episodes[episodeNumber]
      const extname = path.extname(filePath)

      const episodePath = `/${webpath}/${episodeNumber.toLowerCase()}${extname}`
      // if (/rick/i.test(episodePath)) console.log(episodePath)
      servePath(app, episodePath, filePath)
    }
  }
  servePath(app, '/test.mp4', __dirname + '/test.mp4')
  servePath(app, '/test.mkv', __dirname + '/test.mkv')
  app.get('/ping', (req, res) => res.end('pong'))
  app.listen(5000, () => {
    console.log('Listening on 5000')
  })
})()

const extensionMimeMap = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
}

function servePath(app, webpath, filepath) {
  app.get(webpath, function(req, res) {
    const extension = path.extname(filepath)
    const stat = statSync(filepath)
    const fileSize = stat.size
    const range = req.headers.range
    const mime = extensionMimeMap[extension]
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize-1
      const chunksize = (end-start)+1
      const file = createReadStream(filepath, {start, end})
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mime,
      }
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mime,
      }
      res.writeHead(200, head)
        createReadStream(filepath).pipe(res)
    }
  })
}
