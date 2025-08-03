<script setup lang="ts">
import {ClefEnum} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";
import {computed, PropType} from "vue";
import trebleClefSvg from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/trebleClef.svg";
import altoClefSvg from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/altoClef.svg";
import bassClefSvg from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/bassClef.svg";
import {ClefMsSymbol, MusicScore} from "@/applications/ChuangKeApplication/components/musicScore/types";

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