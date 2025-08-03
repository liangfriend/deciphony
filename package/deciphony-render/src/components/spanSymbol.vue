<script setup lang="ts">
import {inject, onBeforeMount, onMounted, PropType} from "vue";
import type {
  MsState,
  MusicScore,
  Slur,
  SpanSymbol, Volta
} from "@/applications/ChuangKeApplication/components/musicScore/types";
import {
  MsTypeNameEnum,
  SpanSymbolTypeEnum
} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";
import {
  getDataWithIndex,
  getTarget,
  traverseMeasure
} from "@/applications/ChuangKeApplication/components/musicScore/utils/musicScoreDataUtil.ts";
import {
  getContainerLeftToMeasure,
  getMeasureLeftToMusicScore, getSlotLeftToMeasure
} from "@/applications/ChuangKeApplication/components/musicScore/utils/leftUtil.ts";
import {
  getMeasureWidth,
  getMsSymbolSlotWidth
} from "@/applications/ChuangKeApplication/components/musicScore/utils/widthUtil.ts";
import {
  getMaxMsSymbolBottomInMeasure,
  getMeasureBottomToMusicScore
} from "@/applications/ChuangKeApplication/components/musicScore/utils/bottomUtil.ts";
import RectDragShell from "@/applications/ChuangKeApplication/components/musicScore/components/rectDragShell.vue";
import voltaVue from '@/applications/ChuangKeApplication/components/musicScore/musicSymbols/volta.vue'
import slurVue from '@/applications/ChuangKeApplication/components/musicScore/musicSymbols/slur.vue'

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
  },
})
const msState = inject('msState') as MsState

function voltaRect(volta: Volta, musicScore: MusicScore, componentWidth: number, componentHeight: number) {
  const rect = {
    width: 0,
    left: 0,
    top: 0,
    height: 0
  }
  const startMeasure = getTarget(volta.startTargetId, musicScore.map)
  const endMeasure = getTarget(volta.endTargetId, musicScore.map)
  if (!startMeasure || !endMeasure) return console.error('获取不到绑定元素', startMeasure, endMeasure)
  if (startMeasure.msTypeName !== MsTypeNameEnum.Measure || endMeasure.msTypeName !== MsTypeNameEnum.Measure) return console.error('volta绑定元素错误')
  // 反复符号绑定的两个小节必须在同一单谱表上
  if (startMeasure.index.multipleStavesIndex !== endMeasure.index.multipleStavesIndex) {
    console.error("反复符号绑定小节有误")
    return
  }
  rect.left = getMeasureLeftToMusicScore(startMeasure, musicScore, componentWidth)
  traverseMeasure(startMeasure.index, endMeasure.index, musicScore, (measure, singleStaff, multipleStaves) => {
    rect.width += getMeasureWidth(measure, singleStaff, musicScore, componentWidth)
    const measureBottom = getMeasureBottomToMusicScore(measure, musicScore, componentHeight)
    const maxBottomMsSymbol = getMaxMsSymbolBottomInMeasure(measure, musicScore)
    const measureHeight = musicScore.measureHeight
    rect.top = componentHeight - Math.max(musicScore.measureHeight + measureBottom, maxBottomMsSymbol + measureBottom + measureHeight)
  })
  rect.height = props.musicScore.measureHeight
  volta.rect = rect
}

function slurRect(slur: Slur, musicScore: MusicScore, componentWidth: number, componentHeight: number) {
  const rect = {
    width: 0,
    left: 0,
    top: 0,
    height: 0
  }
  const startNoteHead = getTarget(slur.startTargetId, musicScore.map)
  const endNoteHead = getTarget(slur.endTargetId, musicScore.map)
  if (!startNoteHead || !endNoteHead) return console.error('获取不到绑定元素', startNoteHead, endNoteHead)
  if (startNoteHead.msTypeName !== MsTypeNameEnum.MsSymbol || endNoteHead.msTypeName !== MsTypeNameEnum.MsSymbol) return console.error('volta绑定元素错误')
  // 反复符号绑定的两个小节必须在同一单谱表上
  if (startNoteHead.index.multipleStavesIndex !== endNoteHead.index.multipleStavesIndex) {
    console.error("反复符号绑定小节有误")
    return
  }
  const measureHeight = musicScore.measureHeight
  // start信息
  const startMsData = getDataWithIndex(startNoteHead.index, musicScore)
  const startMsSymbolContainer = startMsData.msSymbolContainer
  const startMeasure = startMsData.measure
  const startSingleStaff = startMsData.singleStaff

  if (!startMsSymbolContainer || !startMeasure || !startSingleStaff) {
    console.error("索引数据出错，连音线rect计算失败")
    return
  }
  const startSlotWidth = getMsSymbolSlotWidth(startNoteHead, musicScore, true)
  const startMeasureWidth = getMeasureWidth(startMeasure, startSingleStaff, musicScore, componentWidth)
  const startNoteHeadLeftToMeasure = getSlotLeftToMeasure(startNoteHead, startMsSymbolContainer, startMeasure,
      startSingleStaff, musicScore, startSlotWidth, startMeasureWidth, componentWidth, true)
  const startMeasureLeft = getMeasureLeftToMusicScore(startMeasure, musicScore, componentWidth)
  const startMeasureBottom = getMeasureBottomToMusicScore(startMeasure, musicScore, componentHeight)
  const startMaxBottomMsSymbol = getMaxMsSymbolBottomInMeasure(startMeasure, musicScore)
  // end信息
  const endMsData = getDataWithIndex(endNoteHead.index, musicScore)
  const endMsSymbolContainer = endMsData.msSymbolContainer
  const endMeasure = endMsData.measure
  const endSingleStaff = endMsData.singleStaff

  if (!endMsSymbolContainer || !endMeasure || !endSingleStaff) {
    console.error("索引数据出错，连音线rect计算失败")
    return
  }
  const endSlotWidth = getMsSymbolSlotWidth(endNoteHead, musicScore, true)
  const endMeasureWidth = getMeasureWidth(endMeasure, endSingleStaff, musicScore, componentWidth)
  const endNoteHeadLeftToMeasure = getSlotLeftToMeasure(endNoteHead, endMsSymbolContainer, endMeasure,
      endSingleStaff, musicScore, endSlotWidth, endMeasureWidth, componentWidth, true)
  const endMeasureLeft = getMeasureLeftToMusicScore(endMeasure, musicScore, componentWidth)

  // 坐标计算
  const startLeft = startMeasureLeft + startNoteHeadLeftToMeasure + startSlotWidth / 2
  const endLeft = endMeasureLeft + endNoteHeadLeftToMeasure + endSlotWidth / 2
  rect.left = startLeft
  rect.top = componentHeight - Math.max(musicScore.measureHeight + startMeasureBottom, startMaxBottomMsSymbol + startMeasureBottom + measureHeight)
  rect.width = endLeft - startLeft
  rect.height = props.musicScore.measureHeight
  slur.rect = rect
}

function getSpanSymbolRect(spanSymbol: SpanSymbol, musicScore: MusicScore, componentWidth: number, componentHeight: number) {
  switch (spanSymbol.type) {
    case SpanSymbolTypeEnum.volta: {
      voltaRect(spanSymbol, musicScore, componentWidth, componentHeight)
      break
    }
    case SpanSymbolTypeEnum.slur: {
      slurRect(spanSymbol, musicScore, componentWidth, componentHeight)
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
</script>

<template>
  <rect-drag-shell v-if="spanSymbol && spanSymbol.type === SpanSymbolTypeEnum.volta"
                   :rect="spanSymbol.rect">
    <voltaVue :volta="spanSymbol"
              @mousedown.self="handleMouseDown" @mouseup.self="handleMouseUp"
    ></voltaVue>
  </rect-drag-shell>
  <rect-drag-shell v-if="spanSymbol && spanSymbol.type === SpanSymbolTypeEnum.slur" :slur="spanSymbol"
                   :rect="spanSymbol.rect">
    <slurVue :slur="spanSymbol"
             @mousedown.self="handleMouseDown" @mouseup.self="handleMouseUp"></slurVue>
  </rect-drag-shell>

</template>

<style scoped>

</style>