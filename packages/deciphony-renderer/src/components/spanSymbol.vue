<script lang="ts" setup>
import {computed, inject, onBeforeMount, onMounted, PropType, ref, watch} from "vue";
import type {
  MusicScore,
  Slur,
  SpanSymbol, Volta
} from "../../../deciphony-core/src/types";
import {
  MsTypeNameEnum, MusicScoreShowModeEnum,
  SpanSymbolTypeEnum
} from "../../../deciphony-core/src/musicScoreEnum";
import {
  getDataWithIndex,
  getTarget,
  traverseMeasure
} from "deciphony-core";
import {
  getContainerLeftToMeasure,
  getMeasureLeftToMusicScore, getSlotLeftToMeasure
} from "../utils/leftUtil";
import {
  getMeasureWidth,
  getMsSymbolSlotWidth
} from "../utils/widthUtil";
import {
  getMaxMsSymbolTopInMeasure,
  getMeasureTopToMusicScore, getMinMsSymbolTopBetweenMsSymbolContainer, getMinMsSymbolTopInMeasure
} from "../utils/topUtil";
import RectDragShell from "./rectDragShell.vue";
import voltaVue from './volta.vue'
import slurVue from './slur.vue'
import {MsState} from "../types";
import bezierBox from "../components/dragbox/bezier3DragBox.vue";
import rectBox from "../components/dragbox/rectDragBox.vue";
import {slurRect, voltaRect} from "@/utils/spanSymbolUtil";

const props = defineProps({
  spanSymbol: {
    type: Object as PropType<SpanSymbol>,
    required: true
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },
  componentWidth: {
    type: Number,
    default: 1000,
  },
  componentHeight: {
    type: Number,
    default: 800,
  }
})
const msState = inject('msState') as MsState


function getSpanSymbolRect(spanSymbol: SpanSymbol, musicScore: MusicScore, componentWidth: number, componentHeight: number) {
  switch (spanSymbol.type) {
    case SpanSymbolTypeEnum.volta: {
      voltaRect(spanSymbol, musicScore, voltaPosition.value, componentWidth, componentHeight)
      break
    }
    case SpanSymbolTypeEnum.slur: {
      slurRect(spanSymbol, musicScore, slurPosition.value, componentWidth, componentHeight)
      break
    }
  }
}

const emits = defineEmits(['spanSymbolMouseDown', 'spanSymbolMouseUp']);

function handleMouseDown(e: MouseEvent) {

  emits('spanSymbolMouseDown', e, props.spanSymbol)

}

function handleMouseUp(e: MouseEvent) {
  emits('spanSymbolMouseUp', e, props.spanSymbol)
}


onBeforeMount(() => {
  getSpanSymbolRect(props.spanSymbol, props.musicScore, props.componentWidth, props.componentHeight)

})

const slurPosition = ref({
  startPoint: {x: 0, y: 0},
  endPoint: {x: 0, y: 0},
  leftSlope: {x: 0, y: 0},
  rightSlope: {x: 0, y: 0},
})


const voltaPosition = ref({
  startPoint: {x: 0, y: 0},
  endPoint: {x: 0, y: 0},
})


</script>

<template>
  <bezierBox v-if="spanSymbol && spanSymbol.type === SpanSymbolTypeEnum.slur"
             v-model="spanSymbol.options.offset"
             :position="slurPosition">
    <slurVue @mousedown.self="handleMouseDown" :position="slurPosition"
             @mouseup.self="handleMouseUp" :slur="spanSymbol"></slurVue>
  </bezierBox>
  <rectBox v-if="spanSymbol && spanSymbol.type === SpanSymbolTypeEnum.volta"
           v-model="spanSymbol.options.offset"
           :position="voltaPosition">
    <voltaVue @mousedown.self="handleMouseDown" :position="voltaPosition"
              @mouseup.self="handleMouseUp" :volta="spanSymbol"
    ></voltaVue>
  </rectBox>


</template>

<style scoped>

</style>