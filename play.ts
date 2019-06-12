import os from 'os'
import _ from 'lodash'
import { getMainConfig, saveMainConfig } from "./config";
import { getShowsInfo } from "./info";
import { queueEpisodes } from './queue-episodes';


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
      episode: 's01e01',
      time: 0,
    }
  }
  await saveMainConfig(config)
  const episodes = Object
    .entries(showinfo.episodes)
    .sort((a, b) => {
      return a[0] > b[0] ? 1 : -1
    })
  const currentIndex = episodes.findIndex(episode => episode[0] === config.lastplayed[showname].episode)
  const myip = getIP()
  const next5Episodes = episodes
    .slice(currentIndex, 5)
    .map(tuple => tuple[0])
    .map(episode => `http://${myip}:5000/${showname.toLowerCase().replace(' ', '-')}/${episode.toLowerCase()}.mp4`)
  const lastplayed = config.lastplayed[showname]
  queueEpisodes(next5Episodes, lastplayed.time, async status => {
    const contentId = _.get(status, 'media.contentId')
    let episodeId
    if (contentId) {
      const match = contentId.match(/s\d\de\d\d/i)
      episodeId = match && match[0]
    }
    console.dir(status)
    if (status.currentTime && episodeId) {
      lastplayed.time = status.currentTime
      lastplayed.episode = episodeId
      console.log(`playing ${episodeId} at ${status.currentTime}`)
      await saveMainConfig(config)
    }
      // console.log(episodeId)
  })

})()

function getIP() {
  const ifaces = os.networkInterfaces();
  for (const ifname in ifaces) {
    if (ifname === "Wi-Fi") {
      const iface = ifaces[ifname].find(iface => !(iface.family !== 'IPv4' || iface.internal !== false))
      if (!iface) {
        throw new Error("Couldn't find my address")
      }
      return iface.address
    }
  }
}