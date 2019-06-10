import * as  ChromecastAPI from 'chromecast-api'

var browser = new ChromecastAPI.Browser()
var mediaList = [
  {
    autoplay : true,
    preloadTime : 3,
    startTime : 1,
    activeTrackIds : [],
    playbackDuration: 2,
    media: {
      contentId: "http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/dash/BigBuckBunnyAudio.mp4",
      contentType: "audio/mpeg",
      streamType: 'BUFFERED'
    }
  },
  {
    autoplay : true,
    preloadTime : 3,
    startTime : 2,
    activeTrackIds : [],
    playbackDuration: 2,
    media: {
      contentId: "http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/dash/ElephantsDreamAudio.mp4",
      contentType: "audio/mpeg",
      streamType: 'BUFFERED'
    }
  },
  {
    autoplay : true,
    preloadTime : 3,
    startTime : 3,
    activeTrackIds : [],
    playbackDuration: 2,
    media: {
      contentId: "http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/dash/ForBiggerBlazesAudio.mp4",
      contentType: "audio/mpeg",
      streamType: 'BUFFERED'
    }
  }
];

browser.on('deviceOn', function (device) {
  var urlMedia = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';
  if (!(device.config.name === "RV TV")) return
  device.on('status', console.log)
  device.play(mediaList, {
    startIndex: 1,
    repeatMode: "REPEAT_OFF"
  }, (err, status) => {
    console.log(status)
  })

  // device.play(urlMedia, 0, function () {
  //   console.log('Playing in your chromecast')

  //     setTimeout(function () {
  //       //Pause the video
  //       device.pause(function () {
  //         console.log('Paused')
  //       })
  //     }, 20000)

  //     setTimeout(function () {
  //       //Stop video
  //       device.stop(function () {
  //         console.log('Stopped')
  //       })
  //     }, 30000)

  //     setTimeout(function () {
  //       //Close the streaming
  //         device.close(function () {
  //           console.log('Closed')
  //         })
  //     }, 40000)
  // })
})
