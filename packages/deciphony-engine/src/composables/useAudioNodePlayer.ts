import {APlayer} from 'deciphony-player'
import {AudioNode, AudioNodePlayer} from '@/types'

export function useAudioNodePlayer(audioNode: AudioNode): AudioNodePlayer {
  const player = new APlayer()
  player.setAudio(audioNode.url)

  async function play() {
    player.play()
  }

  async function pause() {
    player.pause()
  }

  function stop() {
    player.stop()
  }

  function destory() {
    player.stop()
    player.dispose()
  }

  return {
    play,
    pause,
    stop,
    destory
  }
}
