<script setup lang="ts">
import {ClefEnum} from "../../../deciphony-core/src/musicScoreEnum";
import {computed, CSSProperties, inject, PropType, Ref} from "vue";
import {ClefMsSymbol, MusicScore} from "../../../deciphony-core/src/types";

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
// 皮肤
const {svgSkin, isOriginSkin} = inject("skin") as {
  isOriginSkin: Ref<boolean>,
  svgSkin: Ref<Record<string, { url: string; }>>
}
const mask = computed(() => {
  let svgUrl = ''
  if (props.clef.clef === ClefEnum.Treble) {
    svgUrl = svgSkin.value.clef_treble.url
  } else if (props.clef.clef === ClefEnum.Alto) {
    svgUrl = svgSkin.value.clef_alto.url
  } else if (props.clef.clef === ClefEnum.Bass) {
    svgUrl = svgSkin.value.clef_bass.url
  }
  const res: CSSProperties = {}
  if (isOriginSkin.value) {
    res.mask = `url("${svgUrl}") center center / 100% 100% no-repeat`
  }
  return res
})
</script>


<template>
  <div :style="mask"></div>
</template>

<style scoped>

</style>