

<script setup lang="ts">
import type {
  Measure, MsSymbol,
  MsSymbolContainer,
  MultipleStaves, MusicScore,
  SingleStaff,
} from "deciphony-core/dist/types";
import {computed, CSSProperties, onMounted, PropType} from "vue";
import MsSymbolSlot from "./msSymbolSlot.vue";
import {
  getMsSymbolContainerWidth,
} from "deciphony-core/dist/utils/widthUtil";
import {getContainerLeftToMeasure} from "deciphony-core/dist/utils/leftUtil";

const props = defineProps({
  msSymbolContainer: {
    type: Object as PropType<MsSymbolContainer>,
    required: true
  },
  preContainer: {
    type: Object as PropType<MsSymbolContainer | null>,
    required: true
  },
  nextContainer: {
    type: Object as PropType<MsSymbolContainer | null>,
    required: true
  },
  //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
  measureHeight: {
    type: Number,
    default: 60,
    required: true
  },
  measure: {
    type: Object as PropType<Measure>,
    required: true
  },
  measureWidth: {
    type: Number,
    default: 200
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
    required: true
  },
  multipleStaves: {
    type: Object as PropType<MultipleStaves>,
    required: true
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },
})


const msSymbolContainerStyle = computed<CSSProperties>(() => {
  if (!props.msSymbolContainer || !props.measure || !props.singleStaff) {
    console.error("缺少必要的参数，坐标计算出错")
    return {}
  }


  return {
    left: containerLeft.value + 'px',
    height: props.measureHeight + 'px',
    width: containerWidth.value + 'px',
    bottom: 0 + 'px',
    pointerEvents: 'none',

  }
});

// 符号容器宽度计算
const containerWidth = computed(() => {
  return getMsSymbolContainerWidth(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.componentWidth)
})

// 符号容器横坐标计算
const containerLeft = computed(() => {
  return getContainerLeftToMeasure(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.measureWidth)
})
const emits = defineEmits(['msSymbolMouseDown', 'msSymbolMouseUp']);

</script>
<template>
  <div class="msSymbolContainer"
       :style="msSymbolContainerStyle">
    <ms-symbol-slot v-for="msSymbol in msSymbolContainer?.msSymbolArray"
                    :msSymbol="msSymbol"
                    :msSymbolContainer="props.msSymbolContainer"
                    :preContainer="props.preContainer"
                    :nextContainer="props.nextContainer"
                    :measure="props.measure"
                    :measureWidth="props.measureWidth"
                    :singleStaff="props.singleStaff"
                    :containerWidth="containerWidth"
                    :componentWidth="componentWidth"
                    :componentHeight="componentHeight"
                    @msSymbolMouseDown="(e:MouseEvent, msSymbol:MsSymbol) => emits('msSymbolMouseDown',e,msSymbol)"
                    @msSymbolMouseUp="(e:MouseEvent, msSymbol:MsSymbol) => emits('msSymbolMouseUp',e,msSymbol)"
                    :multipleStaves="props.multipleStaves"
                    :musicScore="props.musicScore"
                    :measureHeight="props.measureHeight"></ms-symbol-slot>
  </div>


</template>

<style scoped>
.msSymbolContainer {
  overflow: visible;
  position: absolute;
}


</style>