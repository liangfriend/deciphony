<script setup lang="ts">
import SamplerPlayer from 'deciphony-player/src/class/SamplerPlayer'
import sample from '../assets/sample-3s.mp3'
import {onMounted, ref} from "vue";
import piano from "../assets/piano";

const player = ref<SamplerPlayer>()
onMounted(async () => {
  player.value = new SamplerPlayer()
  await player.value.addSampler(piano)
  console.log('chicken', "加载音频成功")
})

function play() {
  console.log('chicken',)
  player.value.playMIDI(81)
}

function pause() {
  player.value.pause()
}

function stop() {
  player.value.stop()
}
</script>

<template>
  <button @click="play">播放</button>
  <button @click="pause">暂停</button>
  <button @click="stop">停止</button>
</template>

<style scoped>

</style>