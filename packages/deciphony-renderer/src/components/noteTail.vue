<script lang="ts" setup>
import {computed, CSSProperties, PropType} from "vue";
import {getBeamGroup,} from "deciphony-core";
import {
  BeamGroup,
  type Measure,
  MsSymbol,
  type MsSymbolContainer,
  type MusicScore,
  NoteHead,
  NoteTail,
  type SingleStaff
} from "../../../deciphony-core/src/types";
import {ChronaxieEnum, MsSymbolTypeEnum} from "../../../deciphony-core/src/musicScoreEnum";
import noteTail8Svg from "../assets/msSymbols/noteTail8.svg";
import noteTail16Svg from "../assets/msSymbols/noteTail16.svg";
import noteTail32Svg from "../assets/msSymbols/noteTail32.svg";
import noteTail64Svg from "../assets/msSymbols/noteTail64.svg";
import noteTail128Svg from "../assets/msSymbols/noteTail128.svg";
import noteTail256Svg from "../assets/msSymbols/noteTail256.svg";

import {getMsSymbolHeight} from "../utils/heightUtil";
import {getMsSymbolWidth, getNoteTailWidth} from "../utils/widthUtil";
import {getMsSymbolLeftToSlot} from "../utils/leftUtil";
import {getMsSymbolTopToSlot} from "../utils/topUtil";
import {getMsSymbolAspectRatio} from "../utils/geometryUtil";

const props = defineProps({
  noteTail: {
    type: Object as PropType<NoteTail>,
    required: true
  },
  // 不知道这里是否有问题，外部使用了as进行了强转，定性了符杠的父符号只能是符头
  noteHead: {
    type: Object as PropType<NoteHead>,
    required: true
  },
  preContainer: {
    type: Object as PropType<MsSymbolContainer | undefined>,
    required: true
  },
  nextContainer: {
    type: Object as PropType<MsSymbolContainer | undefined>,
    required: true
  },
  msSymbolContainer: {
    type: Object as PropType<MsSymbolContainer>,
    required: true,
  },
  measure: {
    type: Object as PropType<Measure>,
    required: true
  },
  singleStaff: {
    type: Object as PropType<SingleStaff>,
    required: true
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    required: true
  },

  parentMsSymbol: {
    type: Object as PropType<MsSymbol>,
  },
  slotLeft: {
    type: Number,
    required: true
  },
  measureWidth: {
    type: Number,
    required: true
  },
  componentWidth: {
    type: Number,
    required: true
  },

})
const beamGroup = computed((): BeamGroup => {
  return getBeamGroup(props.noteHead.beamId, props.measure)
})

const aspectRatio = computed<number>(() => {
  return getMsSymbolAspectRatio(props.noteTail)
})
// 符尾条数
const tailCount = computed(() => {
  switch (props.noteTail?.chronaxie) {
    case ChronaxieEnum.eighth:
      return 1
    case ChronaxieEnum.sixteenth:
      return 2
  }
  return 0
})


const height = computed(() => {
  // const parentMsSymbol = getDataWithIndex(props.msSymbol).msSymbol
  return getMsSymbolHeight(props.noteTail, props.musicScore)
})
// 符号宽度
const width = computed(() => {
  // TODO 补全如果是成组的才这样做
  if (props.noteTail.type === MsSymbolTypeEnum.NoteTail && props.nextContainer) {
    return getNoteTailWidth(props.noteTail, props.noteHead, props.msSymbolContainer,
        props.measure, props.singleStaff, props.musicScore,
        props.componentWidth)
  }
  return getMsSymbolWidth(props.noteTail, props.msSymbolContainer, props.measure,
      props.singleStaff, props.musicScore, props.componentWidth)
})
const msSymbolStyle = computed<CSSProperties>(() => {

  const style: CSSProperties = {
    width: `${width.value}px`,
    height: `${height.value}px`,
    display: 'flex',
    flexDirection: props.noteTail?.direction === 'up' ? 'column' : 'column-reverse',
    position: 'absolute',
    left: msSymbolLeft.value + 'px',
    top: msSymbolTop.value + 'px',
    background: props.noteTail.options.highlight ? props.noteTail.options.highlightColor : props.noteTail.options.color,
  }

  if (mask.value && beamGroup.value.length < 2) {
    style.mask = `url("${mask.value}") center center / cover no-repeat`
    if (props.noteTail?.direction === 'down') {
      style.transform = 'scaleY(-1)' // 垂直翻转
    }
  } else {
    style.background = 'transparent'
  }

  return style
});
const msSymbolLeft = computed(() => {
  return getMsSymbolLeftToSlot(props.noteTail, props.msSymbolContainer, props.measure, props.singleStaff,
      props.musicScore, props.slotLeft, props.measureWidth, props.componentWidth)
})

const msSymbolTop = computed(() => {
  return getMsSymbolTopToSlot(props.noteTail, props.musicScore)

})
const mask = computed(() => {
  switch (props.noteTail.chronaxie) {
    case ChronaxieEnum.eighth: {
      return noteTail8Svg
    }
    case ChronaxieEnum.sixteenth: {
      return noteTail16Svg
    }
    case ChronaxieEnum.thirtySecond: {
      return noteTail32Svg
    }
    case ChronaxieEnum.sixtyFourth: {
      return noteTail64Svg
    }
    case ChronaxieEnum.oneTwentyEighth: {
      return noteTail128Svg
    }
    case ChronaxieEnum.twoFiftySixth: {
      return noteTail256Svg
    }
    default: {
      return ''
    }
  }

})


</script>

<template>
  <div :style="msSymbolStyle">
    <template v-if="beamGroup.length > 1">
      <div v-for="(item,index) in tailCount*2-1"
           :style="{backgroundColor:index%2===0?'black':'transparent',height:(height / 5)+'px',width:'100%',}">
      </div>
    </template>
  </div>
</template>

<style scoped>

</style>