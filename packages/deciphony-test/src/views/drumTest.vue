<script lang="ts" setup>
import musicScoreVue from '@deciphony/renderer'
import type {MusicScore, VDom} from '@deciphony/renderer'
import {activeContext, NPlayer, startJPlayer, type PlaySequence} from '@deciphony/player'
import {DEFAULT_DRUM_PLAY_MAP, getDrPlaySequence} from '@deciphony/extensions/dr-play'
import {drPlayHighlight} from '@deciphony/extensions/dr-play-highlight'
import {drInstrumentName} from '@deciphony/extensions/dr-instrument-name'
import {onBeforeUnmount, onMounted, ref} from 'vue'
import daJiYue from '../assets/toneColor/da-ji-yue.json'
import {buildDrumSample} from './data/drumSample'

/** 打击乐采样自带衰减：播放时长至少放到一个全音符，避免镲片被按记谱时值截断 */
const DRUM_MIN_RING: number = 256
const BPM = 100

const musicScore = ref<MusicScore>(buildDrumSample())
const musicScoreRef = ref<{findElementByVDom: (node: VDom) => SVGElement | null} | null>(null)
const loading = ref(true)

const playHighlight = drPlayHighlight({
  findElementByVDom: (node) => musicScoreRef.value?.findElementByVDom(node) ?? null,
  getBpm: () => BPM,
  getBeatUnit: () => 4,
  getRate: () => 1,
})
const extensions = [playHighlight, drInstrumentName({defaultInstrument: '架子鼓', gap: 10})]

let nplayer: NPlayer | null = null

function toPlaySequence(): PlaySequence {
  const drSeq = getDrPlaySequence(musicScore.value, {drumMap: DEFAULT_DRUM_PLAY_MAP, defaultToneColor: 'drum'})
  let curPlayTime = -Infinity
  const playSeq: PlaySequence = drSeq.map((it) => {
    const start = curPlayTime !== it.playTime
    curPlayTime = it.playTime
    const duration = it.real_duration ? it.real_duration : it.duration
    return {
      id: it.note_id,
      midi: it.real_duration === 0 ? 0 : it.midi,
      duration: it.midi > 0 ? Math.max(duration, DRUM_MIN_RING) : duration,
      playTime: it.playTime,
      velocity: it.volume ?? 1,
      toneColor: it.toneColor ?? 'drum',
      data: {note_id: it.note_id, duration: it.duration, realDuration: it.real_duration, playTime: it.playTime, start},
      end: false,
    }
  })
  if (playSeq.length) playSeq[playSeq.length - 1]!.end = true
  return playSeq
}

onMounted(async () => {
  startJPlayer()
  nplayer = new NPlayer({checkTime: 50, checkDuration: 500})
  nplayer.bpm = BPM
  await nplayer.addToneColor('drum', daJiYue)
  nplayer.onProgressStart = (_progress, data) => playHighlight.handleProgressStart(data)
  nplayer.onEnd = () => playHighlight.handlePlaybackEnd()
  loading.value = false
})

onBeforeUnmount(() => {
  playHighlight.handlePlaybackStop()
  nplayer?.dispose()
  nplayer = null
})

async function handlePlay() {
  if (!nplayer) return
  await activeContext()
  nplayer.setPlaySequence(toPlaySequence())
  await nplayer.play()
}

function handleStop() {
  nplayer?.stop()
  playHighlight.handlePlaybackStop()
}
</script>

<template>
  <div class="drum-test">
    <div class="drum-test__bar">
      <button :disabled="loading" @click="handlePlay">{{ loading ? '音色加载中…' : '播放' }}</button>
      <button @click="handleStop">停止</button>
    </div>
    <music-score-vue ref="musicScoreRef" :data="musicScore" :extensions="extensions" skin-name="default"/>
  </div>
</template>

<style scoped>
.drum-test {
  padding: 16px;
  background: #fff;
}

.drum-test__bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

:deep(.dr-play-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 64, 64, 0.95));
}
</style>
