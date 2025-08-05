<script setup lang="ts">
import {ClefEnum} from "deciphony-core/musicScoreEnum";
import {computed, PropType} from "vue";
import trebleClefSvg from "deciphony-core/musicSymbols/trebleClef.svg";
import altoClefSvg from "deciphony-core/musicSymbols/altoClef.svg";
import bassClefSvg from "deciphony-core/musicSymbols/bassClef.svg";
import {ClefMsSymbol, MusicScore} from "deciphony-core/types";

const props = defineProps({
  clef: {
    type: Object as PropType<ClefMsSymbol>,
    required: true
  },
  musicScore: {
    required: true,
    type: Object as PropType<MusicScore>,
  }
})
const mask = computed(() => {
  let svgUrl = ''
  if (props.clef.clef === ClefEnum.treble) {
    svgUrl = trebleClefSvg
  } else if (props.clef.clef === ClefEnum.alto) {
    svgUrl = altoClefSvg
  } else if (props.clef.clef === ClefEnum.bass) {
    svgUrl = bassClefSvg
  }
  return {
    mask: `url(${svgUrl}) center center / 100% 100% no-repeat`
  }
})
</script>


<template>
  <div :style="mask"></div>
</template>

<style scoped>

</style>