<script setup lang="ts">
import type {
  Measure,
  MsSymbol,
  MsSymbolContainer,
  MultipleStaves, MusicScore,
  SingleStaff,
} from "@/applications/ChuangKeApplication/components/musicScore/types.d.ts";
import {computed, CSSProperties, onMounted, PropType} from "vue";
import {
  MsSymbolCategoryEnum,
  MsSymbolTypeEnum,
  MusicScoreRegionEnum
} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";

import msSymbolVue from "@/applications/ChuangKeApplication/components/musicScore/components/msSymbol.vue";

import {MsSymbolInformationMap} from "@/applications/ChuangKeApplication/components/musicScore/constant.ts";
import {
  getMsSymbolAspectRatio,
  getMultipleAspectRatio,
} from "@/applications/ChuangKeApplication/components/musicScore/utils/musicScoreDataUtil.ts";
import {getMsSymbolHeight} from "@/applications/ChuangKeApplication/components/musicScore/utils/heightUtil.ts";
import {getSlotBottomToMeasure} from "@/applications/ChuangKeApplication/components/musicScore/utils/bottomUtil.ts";
import {getMsSymbolSlotWidth} from "@/applications/ChuangKeApplication/components/musicScore/utils/widthUtil.ts";
import {getSlotLeftToContainer} from "@/applications/ChuangKeApplication/components/musicScore/utils/leftUtil.ts";

const props = defineProps({
  msSymbol: {
    type: Object as PropType<MsSymbol>,
    required: true,
  },
  msSymbolContainer: {
    type: Object as PropType<MsSymbolContainer>,
    required: true,
  },
  preContainer: {
    type: Object as PropType<MsSymbolContainer | null>,
    required: true
  },
  nextContainer: {
    type: Object as PropType<MsSymbolContainer | null>,
    required: true
  },
  containerWidth: {
    type: Number,
    default: 60,
    required: true,
  },
  //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
  measureHeight: {
    type: Number,
    default: 60,
    required: true,
  },
  measure: {
    type: Object as PropType<Measure>,
    required: true,
  },
  measureWidth: {
    type: Number,
    default: 200,
    required: true,
  },
  componentWidth: {
    type: Number,
    default: 1000,
  },
  componentHeight: {
    type: Number,
    default: 800,
  },
  singleStaff: {
    type: Object as PropType<SingleStaff>,
    required: true,
  },
  multipleStaves: {
    type: Object as PropType<MultipleStaves>,
    required: true,
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },
})


const msSymbolSlotStyle = computed<CSSProperties>(() => {
  if (!props.msSymbol || !props.measure || !props.singleStaff) {
    console.error("缺少必要的参数，坐标计算出错")
    return {}
  }

  return {
    left: slotLeft.value + 'px',
    height: props.measureHeight + 'px',
    width: slotWidth.value + 'px',
    bottom: slotBottom.value + 'px',
    pointEvents: ' none',

  }
});

const aspectRatio = computed<number>(() => {
  return getMsSymbolAspectRatio(props.msSymbol)
})
const height = computed(() => {
  return getMsSymbolHeight(props.msSymbol, props.musicScore)
})
const slotWidth = computed(() => {
  return getMsSymbolSlotWidth(props.msSymbol, props.musicScore)
})
const slotLeft = computed(() => {
  return getSlotLeftToContainer(props.msSymbol, props.msSymbolContainer, props.measure, props.singleStaff,
      props.musicScore, slotWidth.value, props.componentWidth)
})
const slotBottom = computed(() => {
  return getSlotBottomToMeasure(props.msSymbol, props.musicScore)
})

const emits = defineEmits(['msSymbolMouseDown', 'msSymbolMouseUp']);


</script>
<template>
  <div class="msSymbolSlot p-stackItem"

       :style="msSymbolSlotStyle">
    <msSymbolVue v-if="msSymbol" ref="mainMsSymbolRef" :measureHeight="measureHeight"
                 :msSymbolContainer="props.msSymbolContainer"
                 :preContainer="props.preContainer"
                 :nextContainer="props.nextContainer"
                 :slot-width="slotWidth"
                 :slotBottom="slotBottom"
                 :slot-left="slotLeft"
                 :containerWidth="containerWidth"
                 :measure-width="measureWidth"
                 :isMain="true"
                 :componentWidth="componentWidth"
                 :componentHeight="componentHeight"
                 :measure="measure"
                 :single-staff="singleStaff"
                 :musicScore="props.musicScore"
                 @msSymbolMouseDown="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseDown',e,msSymbol)"
                 @msSymbolMouseUp="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseUp',e,msSymbol)"
                 :ms-symbol="msSymbol"></msSymbolVue>
    <template v-if="msSymbol?.msSymbolArray">
      <msSymbolVue :measureHeight="measureHeight" v-for="item in msSymbol.msSymbolArray"
                   :msSymbolContainer="props.msSymbolContainer"
                   :preContainer="props.preContainer"
                   :nextContainer="props.nextContainer"
                   :containerWidth="containerWidth"
                   :measure-width="measureWidth"
                   :isMain="false"
                   :slotBottom="slotBottom"
                   :measure="measure"
                   :single-staff="singleStaff"
                   :slot-width="slotWidth"
                   :slot-left="slotLeft"
                   :parent-ms-symbol="msSymbol"
                   :componentWidth="componentWidth"
                   @msSymbolMouseDown="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseDown',e,msSymbol)"
                   @msSymbolMouseUp="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseUp',e,msSymbol)"
                   :componentHeight="componentHeight"
                   :musicScore="props.musicScore"
                   :ms-symbol="item"></msSymbolVue>
    </template>
  </div>


</template>


<style scoped>
.msSymbolSlot {
  display: flex;
}
</style>