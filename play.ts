import os from 'os'
import _ from 'lodash'
import { getMainConfig, saveMainConfig } from "./config";
import { getShowsInfo } from "./info";
import { queueEpisodes } from './queue-episodes';
getIP()


;(async () => {
  const config = await getMainConfig()
  const shows = await getShowsInfo(config.sources)
  const showToPlay = process.argv.slice(2)[0] || config.lastShowPlayed
  if (!showToPlay) throw new Error('I need to know which show to play')
  config.lastShowPlayed = showToPlay
  await saveMainConfig(config)
  const showTuple = Object.entries(shows).find(([showname, showinfo]: [string, any]) => {
    return [...(showinfo.aliases), showname].includes(showToPlay)
  })
  const [showname, showinfo] = (showTuple as [string, any])
  if (!config.lastplayed) {
    config.lastplayed = {}
  }

  if (!config.lastplayed[showname]) {
    console.log('no last played')
    config.lastplayed[showname] = {
      time: 0,
    }
  }
  await saveMainConfig(config)
  const lastplayed = config.lastplayed[showname]
  const episodes = Object
    .entries(showinfo.episodes)
    .sort((a, b) => {
      return a[0] > b[0] ? 1 : -1
    })
  let currentIndex = episodes.findIndex(episode => {
    return episode[0].toLowerCase() === lastplayed.episode
  })
  if (currentIndex < 1) {
    currentIndex = 0
  }
  const myip = getIP()
  const next5Episodes = episodes
    .slice(currentIndex, currentIndex + 5)
    .map(tuple => tuple[0])
    .map(episode => `http://${myip}:5000/${showname.toLowerCase().replace(/ /ig, '-')}/${episode.toLowerCase()}.mp4`)
  console.log(next5Episodes)
  queueEpisodes(next5Episodes, lastplayed.time, async status => {
    console.log(status)
    const contentId = _.get(status, 'media.contentId')
    let episodeId
    if (contentId) {
      const match = contentId.match(/s\d\de\d\d/i)
      episodeId = match && match[0]
    }
    if (status && status.currentTime && episodeId) {
      lastplayed.time = status.currentTime
      lastplayed.episode = episodeId
      console.log(`playing ${episodeId} at ${status.currentTime}`)
      await saveMainConfig(config)
    } else {
    }
      // console.log(episodeId)
  })

})().catch(console.error)

function getIP() {
  const ifaces = os.networkInterfaces();
  for (const ifname in ifaces) {
    if (ifname === "Wi-Fi" || /wlp/.test(ifname)) {

      const iface = ifaces[ifname].find(iface => !(iface.family !== 'IPv4' || iface.internal !== false))
      if (!iface) {
        throw new Error("Couldn't find my address")
      }
      return iface.address
    }
  }
}
process.on('uncaughtException', (e) => {
  console.log(e)
  process.exit(0)
})