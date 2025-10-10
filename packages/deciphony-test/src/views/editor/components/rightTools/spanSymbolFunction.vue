<script setup lang="ts">

import {PropType, ref, UnwrapRef} from "vue";
import {
  MusicScore,
  SpanSymbol
} from "deciphony-core";
import {
  removeSpanSymbol
} from "deciphony-core";
import {
  BarLineTypeEnum,
  ClefEnum, KeySignatureEnum,
} from "deciphony-core";
import type {MusicScoreRef} from "deciphony-renderer";

const props = defineProps({
  spanSymbol: {
    type: Object as PropType<SpanSymbol>,
    required: true
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    required: true
  },
  msRef: {
    type: Object as PropType<UnwrapRef<MusicScoreRef>>,
  },
})

function handleRightToolsBtn(key: String, spanSymbol: SpanSymbol, musicScore: MusicScore) {
  switch (key) {
    case 'deleteVolta':
      removeSpanSymbol(spanSymbol, musicScore,)
      break


  }


}

const currentClef = ref(null)
const clefList = ref([{
  clef: ClefEnum.Alto,
  text: '高音谱号',
}, {
  clef: ClefEnum.Bass,
  text: '低音谱号',
}])
const currentKeySignature = ref(null)
const keySignatureList = ref([{
  keySignature: KeySignatureEnum.C,
  text: 'C大调',
}, {
  clef: KeySignatureEnum.D,
  text: 'D大调',
}])
const currentTimeSignature = ref({
  beat: 1,
  chronaxie: 4
})

const currentBarLineType = ref(null)
const barLineList = ref([{
  barLineType: BarLineTypeEnum.single,
  text: '单小节线',
}, {
  barLineType: BarLineTypeEnum.final,
  text: '结束小节线',
}, {
  barLineType: BarLineTypeEnum.reverseFinal,
  text: '前置结束小节线',
}, {
  barLineType: BarLineTypeEnum.endRepeatSign,
  text: '反复小节线',
}, {
  barLineType: BarLineTypeEnum.startRepeatSign,
  text: '前置反复小节线',
}])
</script>

<template>
  <div>

    <el-button @click="handleRightToolsBtn('deleteVolta',spanSymbol,musicScore)"
    >
      删除volta
    </el-button>


  </div>
</template>

<style scoped>

</style>
