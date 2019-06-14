import express from 'express'
import path from 'path'
import { getMainConfig } from './config';
import { getShowsInfo } from './info';
import { createReadStream, statSync } from 'fs';
const app = express()


;(async function() {
  const config = await getMainConfig()
  const shows = await getShowsInfo(config.sources)
  for (const showname in shows) {
    const webpath = showname.toLowerCase().replace(/ /g, '-')
    const show = shows[showname]
    for (const episodeNumber in show.episodes) {
      const filePath = show.episodes[episodeNumber]
      const extension = path.extname(filePath)
      const episodePath = `/${webpath}/${episodeNumber.toLowerCase()}${extension}`
      if (/rick/i.test(episodePath)) console.log(episodePath)
      servePath(app, episodePath, filePath)
    }
  }
  app.listen(5000, () => {
    console.log('Listening on 5000')
  })
})()

function servePath(app, webpath, filepath) {
  app.get(webpath, function(req, res) {
    const path = filepath
    const stat = statSync(path)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize-1
      const chunksize = (end-start)+1
      const file = createReadStream(path, {start, end})
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(200, head)
      createReadStream(path).pipe(res)
    }
  })
}