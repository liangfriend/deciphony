<script setup lang="ts">
import MusicScoreVue, {type MusicScoreRef} from "deciphony-renderer/musicScore.vue";
import {onBeforeMount, onMounted, ref} from "vue";
import type {MusicScore} from "deciphony-core/types";
import {musicScoreTemplate} from "deciphony-core/utils/objectTemplateUtil";


const musicScore = ref<MusicScore>(null!)
const musicScoreRef = ref<MusicScoreRef>(null!)
onBeforeMount(() => {
  const data = musicScoreTemplate({})
  musicScore.value = data

  window.musicScore = musicScore.value
})

function switchShowMode() {
  musicScoreRef.value.switchShowMode()
}
</script>

<template>
  <button @click="switchShowMode">简线切换</button>
  <music-score-vue :music-score="musicScore" ref="musicScoreRef"></music-score-vue>
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
