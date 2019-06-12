import { getMainConfig, saveMainConfig } from "./config";
import { getShowsInfo } from "./info";


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
    config.lastplayed
    config.lastplayed = []
  }
  if (!config.lastplayed[showname]) {
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
  const next5Episodes = episodes
    .slice(currentIndex, 5)
    .map(tuple => tuple[0])
    .map(episode => `/${showname.toLowerCase().replace(' ', '-')}/${episode.toLowerCase()}.mp4`)
  console.log(next5Episodes)
})()

