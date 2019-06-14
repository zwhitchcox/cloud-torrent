import * as  ChromecastAPI from 'chromecast-api'
import { Client, DefaultMediaReceiver} from 'castv2-client'


play()
let chromecastIP;
async function play() {
  if (!chromecastIP)
    chromecastIP = await getChromecastIp("RV TV")
  const host = chromecastIP

  var client = new Client();

  client.connect(host, function() {
    console.log('connected, launching app ...');

    client.launch(DefaultMediaReceiver, function(err, player) {
      var media = {
        contentId: 'http://192.168.1.33:5000/rick-and-morty/s01e10.webm',
        contentType: 'video/webm',
        streamType: 'BUFFERED', // or LIVE
      };

      player.on('status', function(status) {
        console.log('status broadcast playerState=%s', status.playerState);
      });

      console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

      player.load(media, { autoplay: true }, function(err, status) {
        console.log('media loaded playerState=%s', status.playerState);

        // Seek to 2 minutes after 15 seconds playing.
        setTimeout(function() {
          player.seek(2*60, function(err, status) {
            //
          });
        }, 15000);

      });

    });

  });

  client.on('error', function(err) {
    console.log('Error: %s', err.message);
    client.close();
  });

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