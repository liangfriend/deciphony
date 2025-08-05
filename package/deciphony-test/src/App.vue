<script setup lang="ts">
import MusicScoreVue from "deciphony-render/src";
import test from "./musicScoreData/test.ts"
import {ref} from "vue";

const musicScore = ref<MusicScore>(test)
</script>

<template>
  <music-score-vue :music-score="musicScore"></music-score-vue>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
