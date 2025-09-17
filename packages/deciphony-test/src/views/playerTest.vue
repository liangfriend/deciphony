<script setup lang="ts">
import {ToneSequencePlayer, AudioPlayer, PlayerManager} from '@deciphony-player'
import sample from '../assets/sample-3s.mp3'
import {onMounted, ref} from "vue";
import piano from "../assets/piano";
import {ToneSequence} from "deciphony-player/src/types/type";
import {testC4} from '../test/testC4'
import Player from "deciphony-player/dist/class/Player";

const player = ref<Player>(null!)
const toneSequence = ref<ToneSequence[]>([{
  midi: 60,
  volume: 1,
  duration: '4',
  type: 'note'
}, {
  midi: 60,
  volume: 1,
  duration: '4',
  type: 'note'
}, {
  midi: 62,
  volume: 1,
  duration: '2',
  type: 'note'
}, {
  midi: 60,
  volume: 1,
  duration: '2',
  type: 'note'
}, {
  midi: 65,
  volume: 1,
  duration: '2',
  type: 'note'
}, {
  midi: 64,
  volume: 1,
  duration: '2',
  type: 'note'
}])
const playerManager = ref<PlayerManager>(null!)
onMounted(async () => {
  playerManager.value = new PlayerManager()

})

function addAudio() {
  if (player.value) {
    player.value.addAudio(sample)
    console.log('音频添加成功',)
  }
}

async function play() {

  if (curPlayerType.value === 'audio') {
    player.value.play()
  } else if (curPlayerType.value === 'toneSequence') {
    await player.value.playMIDI(60, true)
  }
}

function pause() {
  player.value.pause()
}

function stop() {
  player.value.stop()
}

const curPlayerType = ref('')

function create(name: string) {
  curPlayerType.value = name
  player.value = playerManager.value.addPlayer(curPlayerType.value, curPlayerType.value)
}
</script>

<template>
  <div>
    <div>AudioPlayer</div>
    <button @click="create('audio')">创建播放器</button>
    <button @click="addAudio">添加音频</button>
    <button @click="play">播放</button>
    <button @click="pause">暂停</button>
    <button @click="stop">停止</button>
    <div>当前播放时间：{{ player?.current }}/{{ player?.duration }}</div>
  </div>
  <div>
    <div>ToneSequencePlayer</div>
    <button @click="create('toneSequence')">创建播放器</button>
    <button @click="play">播放</button>
    <button @click="pause">暂停</button>
    <button @click="stop">停止</button>
  </div>

</template>

<style scoped>

</style>