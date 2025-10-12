<script lang="ts" setup>
import {AudioPlayer, TonePlayer, ToneSequence} from 'deciphony-player'
import sample from '../assets/sample-3s.mp3'
import {onMounted, ref} from "vue";
import piano from "../assets/piano";

const toneSequence = ref<ToneSequence[]>([{
  tone: 'C4',
  volume: 1,
  duration: '4',
  type: 'note'
}, {
  tone: 'C4',
  volume: 1,
  duration: '4',
  type: 'note'
}, {
  tone: 'D4',
  volume: 1,
  duration: '2',
  type: 'note'
}, {
  tone: 'C4',
  volume: 1,
  duration: '2',
  type: 'note'
}, {
  tone: 'F4',
  volume: 1,
  duration: '2',
  type: 'note'
}, {
  tone: 'E4',
  volume: 1,
  duration: '2',
  type: 'note'
}])
onMounted(async () => {
  tonePlayer.value = new TonePlayer()
  audioPlayer.value = new AudioPlayer()
  audioPlayer2.value = new AudioPlayer()
})
// 音色播放器
const tonePlayer = ref<TonePlayer>()

function addToneColor() {
  tonePlayer.value?.addToneColor(piano)
}


// 音频播放器
const audioPlayer = ref<AudioPlayer>()
const audioPlayer2 = ref<AudioPlayer>()


function addAudio(track: number) {

  audioPlayer.value?.addAudio(sample)
  audioPlayer2.value?.addAudio(sample)

}

async function play(type: string) {

  if (type === 'audio') {
    audioPlayer.value?.play()
  } else if (type === 'audio2') {
    audioPlayer2.value?.play()
  } else if (type === 'toneSequence') {
    await tonePlayer.value?.playSequence(toneSequence.value)
  }
}

function trigger() {
  tonePlayer.value?.trigger('C4',)
}

function release() {
  tonePlayer.value?.release()
}

function tap() {
  tonePlayer.value?.tap('C4', '8')
}

function pause(type: string) {
  if (type === 'audio') {
    audioPlayer.value?.pause()
  } else if (type === 'audio2') {
    audioPlayer2.value?.pause()
  } else if (type === 'toneSequence') {
    tonePlayer.value?.pauseSequence()
  }
}

function stop(type: string) {
  if (type === 'audio') {
    audioPlayer.value?.stop()
  } else if (type === 'audio2') {
    audioPlayer2.value?.stop()
  } else if (type === 'toneSequence') {
    tonePlayer.value?.stopSequence()
  }
}

const curPlayerType = ref('')


</script>

<template>
  <div class="category">
    <div>AudioPlayer</div>
    <button @click="addAudio">添加音频</button>
    <div class="group">
      <div>轨道1</div>

      <button @click="play('audio')">播放</button>
      <button @click="pause('audio')">暂停</button>
      <button @click="stop('audio')">停止</button>
      <div>当前播放时间：{{ audioPlayer?.current }}/{{ audioPlayer?.duration }}</div>
    </div>
    <div class="group">
      <div>轨道2</div>
      <button @click="play('audio2')">播放</button>
      <button @click="pause('audio2')">暂停</button>
      <button @click="stop('audio2')">停止</button>
      <div>当前播放时间：{{ audioPlayer2?.current }}/{{ audioPlayer2?.duration }}</div>
    </div>
  </div>
  <div class="category">
    <div>TonePlayer</div>
    <button @click="addToneColor">添加音色</button>
    <div class="group">
      <button @click="trigger()">触发</button>
      <button @click="release()">释放</button>
      <button @click="tap()">点触</button>
    </div>

    <div class="group">
      <button @click="play('toneSequence')">播放序列</button>
      <button @click="pause('toneSequence')">暂停</button>
      <button @click="stop('toneSequence')">停止</button>
    </div>

  </div>

</template>

<style scoped>
.category {
  border: 1px dashed #ccc;
  width: fit-content;
  margin: 10px;
  padding: 10px;
}

.group {
  margin: 10px;
  padding: 10px;
  background-color: #9fb0df;
  width: fit-content;
}
</style>