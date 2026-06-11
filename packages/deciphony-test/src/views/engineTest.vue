<script lang="ts" setup>
import GameView from 'deciphony-engine'
import {ref, computed} from 'vue'
import data from './data/test.json'

const gameData = computed(() => {
  return data
})
</script>

<template>
  <GameView :game-data="gameData"></GameView>
</template>

<style scoped>

</style>