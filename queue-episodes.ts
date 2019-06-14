import * as util from 'util'
import { Client, DefaultMediaReceiver } from 'castv2-client'
import * as  ChromecastAPI from 'chromecast-api'


let chromecastIP;
export async function queueEpisodes(addresses, time, onStatus) {
  if (!chromecastIP)
    chromecastIP = await getChromecastIp("RV TV")
  const client = new Client()
  const connect = util.promisify(client.connect.bind(client))
  await connect(chromecastIP)
  console.log('connected, queueing episodes');
  console.log(`time ${time}`)
  client.launch(DefaultMediaReceiver, function(err, player) {
    const mediaList = addresses.map((address, i) => ({
        autoplay : true,
        preloadTime : 2,
        activeTrackIds : [],
        playbackDuration: 2,
        media: {
          contentId: address,
          contentType: "video/mp4",
          streamType: 'BUFFERED'
        }
    }))
    player.on('status', onStatus)
    let statuscount = 0
    setInterval(() => {
      if(statuscount>5) {
        process.exit(0)
      }
      statuscount++
      player.getStatus((err, status) => {
        statuscount--
        onStatus(status)
      })
    }, 3000)
    player.queueLoad(
      mediaList,
      {
        startIndex:0,
        repeatMode: "REPEAT_OFF"
      },
      () => {
        player.seek(time)
      }
    )
  })
}

function getChromecastIp(name) {
  return new Promise((res, rej) => {
    const browser = new ChromecastAPI.Browser()
    browser.on('deviceOn', device => {
      if (device.config.name === "RV TV")
        res(device.host)
    })
  })
}
