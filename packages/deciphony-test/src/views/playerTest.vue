<script setup lang="ts">
import ToneSequencePlayer from 'deciphony-player/src/class/ToneSequencePlayer'
import sample from '../assets/sample-3s.mp3'
import {onMounted, ref} from "vue";
import piano from "../assets/piano";
import {ToneSequence} from "deciphony-player/src/types/type";
import {testC4} from '../test/testC4'

const player = ref<ToneSequencePlayer>(null!)
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
onMounted(async () => {
  player.value = new ToneSequencePlayer()
  player.value.addToneColor(testC4)
})

async function play() {
  await player.value.playMIDI(60, true)
}

function pause() {
}

function stop() {
  player.value.stopMIDI()
}
</script>

<template>
  <button @click="play">播放</button>
  <button @click="pause">暂停</button>
  <button @click="stop">停止</button>
</template>

<style scoped>

</style>