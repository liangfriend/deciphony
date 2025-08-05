<template>
  <div class="vitrualSymbolContainer"
       @mousemove="handleMouseMove"
       @mousedown="handleMouseDown"
       :style="vitrualSymbolContainerStyle">
    <div ref="vitrualSymbolRef" class="vitrualSymbol" :style="vitrualSymbolStyle"
    ></div>
  </div>


</template>

<script setup lang="ts">
import type {
  Measure,
  MsSymbolContainer,
  MultipleStaves, MusicScore,
  SingleStaff, VirtualSymbolContainerType,
} from "deciphony-core/types";
import {computed, CSSProperties, inject, onMounted, PropType, ref} from "vue";

import {
  getMsSymbolContainerWidth,
  getWidthFixedContainerWidthSumInMeasure
} from "deciphony-core/utils/widthUtil";
import {
  getWidthConstantInMeasure, getWidthConstantInMsSymbolContainer
} from "deciphony-core/utils/widthConstantUtil";
import noteHeadWholeSvg from "../musicSymbols/noteHeadWhole.svg"
import {
  getMeasureBottomToMusicScore, getSlotBottomToMeasure, staffRegionToBottom
} from "deciphony-core/utils/bottomUtil";
import {MusicScoreRegionEnum} from "deciphony-core/musicScoreEnum";
import {MsState} from "../../types";
import {virtualSymbolMouseDown} from "../utils/eventUtil";

const props = defineProps({
  ind: {},
  msSymbolContainer: {
    type: Object as PropType<MsSymbolContainer>,
  },
  //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
  measureHeight: {
    type: Number,
    default: 60,
    required: true
  },
  type: {
    type: String as PropType<VirtualSymbolContainerType>,
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

const svgHref = computed(() => {

  return noteHeadWholeSvg

})
const vitrualSymbolContainerStyle = computed<CSSProperties>(() => {

  return {
    left: containerLeft.value + 'px',
    height: props.measureHeight * 3 + 'px',
    width: containerWidth.value + 'px',
    bottom: -props.measureHeight + 'px',
  }
});
const containerBottom = computed(() => {
  return 0
})
// 符号容器宽度计算
const containerWidth = computed(() => {
  return props.measureHeight * 0.25
})


// 符号容器横坐标计算
const containerLeft = computed(() => {
  let left = 0
  if (props.msSymbolContainer) {


  const containerType = props.msSymbolContainer.type
  //变宽容器 （小节宽度 - 定宽容器宽度）/ 小节变宽容器宽度系数之和 * 截止当前容器小节的宽度系数之和 + 前置定宽容器宽度之和
  const widthFixedContainerWidthSumInMeasure = getWidthFixedContainerWidthSumInMeasure(props.measure, props.measureHeight)
  const widthConstantInMeasure = getWidthConstantInMeasure(props.measure)
  const preWidConstantInMeasure = getWidthConstantInMeasure(props.measure, props.msSymbolContainer)
  const preWidthFixedContainerWidthSumInMeasure = getWidthFixedContainerWidthSumInMeasure(props.measure, props.measureHeight, 'front')
  left = (props.measureWidth - widthFixedContainerWidthSumInMeasure) / widthConstantInMeasure * preWidConstantInMeasure + preWidthFixedContainerWidthSumInMeasure
      - containerWidth.value / 2 // 加上音符的一半距离进行微观居中
  // 将虚拟音符偏移到正确位置，具体逻辑语言表述不清
  if (['middle'].includes(props.type)) {
    left += getMsSymbolContainerWidth(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.componentWidth)
  } else if (['end'].includes(props.type)) {
    left += getMsSymbolContainerWidth(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.componentWidth) * 3 / 4
  } else if (['front'].includes(props.type)) {
    left += getMsSymbolContainerWidth(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.componentWidth) / 4
  } else if (['self'].includes(props.type)) {
    left += getMsSymbolContainerWidth(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.componentWidth) * 2 / 4
  }

  } else { // 没有符号容器传入的情况，就是空的小节
    left = props.measureWidth / 2 - containerWidth.value / 2

  }
  return left
})
const offsetBottom = ref(props.measureHeight)


function handleMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  offsetBottom.value = rect.height - e.clientY + rect.top;
}

const msState = inject("msState") as MsState

function handleMouseDown(e: MouseEvent) {
  virtualSymbolMouseDown(e, {
    msState,
    virtualSymbolContainerType: props.type,
    msData: {
      musicScore: props.musicScore,
      msSymbolContainer: props.msSymbolContainer || null,
      measure: props.measure,
      singleStaff: props.singleStaff,
      multipleStaves: props.multipleStaves,
    },

    msSymbolInformation: {
      region: region.value
    }
  })


}

// 虚拟符号相关
const aspectRatio = computed<number>(() => {
  return 1
})

const vitrualSymbolHeight = computed(() => {
  return props.measureHeight * 0.25
})
// 符号宽度
const vitrualSymbolWidth = computed(() => {
  return vitrualSymbolHeight.value * aspectRatio.value
})

const vitrualSymbolLeft = computed(() => {

  return 0
})
const region = computed(() => {
  const regionIndex = +((offsetBottom.value - props.measureHeight) / (props.measureHeight / 8)).toFixed(0)
  return regionIndex + 37
})
const virtualSymbolBottom = computed(() => {
  if (!(region.value in MusicScoreRegionEnum)) return props.measureHeight
  const bottom = staffRegionToBottom(region.value, props.measureHeight) + props.measureHeight
  return bottom
})
const vitrualSymbolStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    width: `${vitrualSymbolWidth.value}px`,
    height: `${vitrualSymbolHeight.value}px`,
    position: 'absolute',
    left: vitrualSymbolLeft.value + 'px',
    bottom: virtualSymbolBottom.value + 'px',
    background: 'blue',
  }
  if (svgHref.value) {
    style.mask = `url(${svgHref.value}) center center / cover no-repeat`
  }

  return style
});

onMounted(() => {
  // 如果是音符头，获取到谱号

})


const mouseDownFn = () => {

};
</script>


<style scoped>
.vitrualSymbolContainer {
  position: absolute;
  pointer-events: all;
  opacity: 0;
}

.vitrualSymbolContainer:hover {
  opacity: 1;

}

.test {
  height: 50px;
  width: 10px;
  background-color: #111111;
}
</style>