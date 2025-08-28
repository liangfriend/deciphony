<script setup lang="ts">
import Player from '@player/class/Player.ts'
import sample from '../assets/sample-3s.mp3'
import {onMounted, ref} from "vue";

const player = ref<Player>()
onMounted(async () => {
  player.value = new Player()
  await player.value.addAudio(sample)
  console.log('chicken', "加载音频成功")
})

function play() {
  player.value.play()
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