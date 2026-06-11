import { VideoNodePlayer } from '@/types'

export function useVideoPlayer(videoDom: HTMLVideoElement): VideoNodePlayer {
  async function play() {
    await videoDom.play()
  }

  function stop() {
    videoDom.pause()
    videoDom.currentTime = 0
  }

  function pause() {
    videoDom.pause()
  }

  function destory() {
    videoDom.pause()
    videoDom.currentTime = 0
  }

  return {
    play: play,
    stop: stop,
    pause: pause,
    destory
  }
}
