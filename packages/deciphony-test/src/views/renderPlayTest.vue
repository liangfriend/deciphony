<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import {startJPlayer} from 'j-player'
import data from './data/其多列'
import {onMounted} from "vue";

const musicScoreData = data

onMounted(() => {
  startJPlayer()
})
</script>

<template>
  <musicScoreVue :data="musicScoreData" :slot-config="{'g-r':{w:50},'g-l':{w:50}}"
                 skin-name="default"
  />
</template>

<style scoped>

</style>