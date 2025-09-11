<script setup lang="ts">
import {onMounted, ref} from "vue";

onMounted(async () => {
})

const player = new InstrumentPlayer();

// 吹奏类
player.noteOn(60, 0.5); // C4，音量 0.5
setTimeout(() => player.noteOff(), 2000); // 2 秒后停止

// 钢琴类
player.playNote(64, 0.8, 1.5); // E4，音量 0.8，时值 1.5s

</script>

<template>
  <button @click="setSource">查看数据</button>
  <button @click="play">播放</button>
  <channel-data-chart :channel-data="channdelData"></channel-data-chart>
</template>

<style scoped>

</style>