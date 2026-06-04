<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import {startJPlayer, activeContext, NPlayer, PlaySequence} from 'j-player'
import data from './data/其多列'
import piano from '../assets/toneColor/accoustic_grand_piano.json'
import {onBeforeUnmount, onMounted} from "vue";
import {getDrPlaySequence} from "./dr-render-extensions/play-util";

const musicScoreData = data
let nplayer: NPlayer | null = null

/** DR 播放序列 → NPlayer 播放序列 */
function toPlaySequence(): PlaySequence {
  const drSeq = getDrPlaySequence(musicScoreData)
  // 结束标记打在结束时间（playTime + duration）最大的那一项
  let endIdx = -1
  let maxEnd = -1
  drSeq.forEach((it, i) => {
    const end = it.playTime + it.duration
    if (end > maxEnd) {
      maxEnd = end
      endIdx = i
    }
  })
  return drSeq.map((it, i) => ({
    id: it.note_id,
    midi: it.midi,
    duration: it.real_duration != null ? it.real_duration : it.duration,
    playTime: it.playTime,
    toneColor: 'piano',
    data: {note_id: it.note_id},
    end: i === endIdx,
  }))
}

onMounted(async () => {
  startJPlayer()
  nplayer = new NPlayer({checkTime: 50, checkDuration: 500})
  await nplayer.addToneColor('piano', piano)
  nplayer.setPlaySequence(toPlaySequence())
})

onBeforeUnmount(() => {
  nplayer?.dispose()
  nplayer = null
})

async function handlePlay() {
  if (!nplayer) return
  // 浏览器自动播放策略：用户手势内恢复音频上下文
  await activeContext()
  await nplayer.play()
}

function handlePause() {
  nplayer?.pause()
}

function handleStop() {
  nplayer?.stop()
}
</script>

<template>
  <div class="play-test">
    <div class="play-test__score">
      <musicScoreVue :data="musicScoreData" :slot-config="{'g-r':{w:50},'g-l':{w:50}}"
                     skin-name="default"
      />
    </div>
    <div class="play-test__panel">
      <h3 class="play-test__title">播放控制</h3>
      <button class="play-test__btn" @click="handlePlay">播放</button>
      <button class="play-test__btn" @click="handlePause">暂停</button>
      <button class="play-test__btn" @click="handleStop">停止</button>
    </div>
  </div>
</template>

<style scoped>
.play-test {
  display: flex;
  align-items: flex-start;
  height: 100%;
  gap: 16px;
}

.play-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

.play-test__panel {
  width: 200px;
  flex-shrink: 0;
  padding: 16px;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.play-test__title {
  margin: 0 0 4px;
  font-size: 16px;
}

.play-test__btn {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
}

.play-test__btn:hover {
  background: #f2f2f2;
}

.play-test__btn:active {
  background: #e6e6e6;
}
</style>
