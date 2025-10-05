<script setup lang="ts">
import {computed, CSSProperties, onMounted, PropType, ref, watch} from "vue";
import {
  type Measure,
  MsSymbol,
  type MsSymbolContainer,
  type MusicScore,
  NoteHead,
  type SingleStaff
} from "../../../deciphony-core/src/types";
import {
  AccidentalEnum,
  BarLineTypeEnum,
  ChronaxieEnum,
  MsSymbolTypeEnum,
  MusicScoreShowModeEnum,
  SolmizationEnum
} from "../../../deciphony-core/src/musicScoreEnum";
// 音符头
import noteHeadWholeSvg from "../assets/msSymbols/noteHeadWhole.svg"
import noteHeadHalfSvg from "../assets/msSymbols/noteHeadHalf.svg"
import noteHeadQuarterSvg from "../assets/msSymbols/noteHeadQuarter.svg"
import note1Svg from "../assets/msSymbols/1.svg"
import note2Svg from "../assets/msSymbols/2.svg"
import note3Svg from "../assets/msSymbols/3.svg"
import note4Svg from "../assets/msSymbols/4.svg"
import note5Svg from "../assets/msSymbols/5.svg"
import note6Svg from "../assets/msSymbols/6.svg"
import note7Svg from "../assets/msSymbols/7.svg"
// 音符八度点
import noteDot1Svg from "../assets/msSymbols/noteDot1.svg"
import noteDot2Svg from "../assets/msSymbols/noteDot2.svg"
import noteDot3Svg from "../assets/msSymbols/noteDot3.svg"
import noteDot4Svg from "../assets/msSymbols/noteDot4.svg"


// 休止符
import restWholeSvg from "../assets/msSymbols/restWhole.svg"
import restThirySecondSvg from "../assets/msSymbols/restWhole.svg"
import restSixtyFourthSvg from "../assets/msSymbols/restWhole.svg"
import restHalfSvg from "../assets/msSymbols/restHalf.svg"
import restQuarterSvg from "../assets/msSymbols/restQuarter.svg"
import restEighthSvg from "../assets/msSymbols/restEighth.svg"
import restSixteenthSvg from "../assets/msSymbols/restSixteenth.svg"
// 符杠
import noteStemSvg from '../assets/msSymbols/noteStem.svg'

// 变音符号
import sharpSvg from '../assets/msSymbols/sharp.svg'
import doubleSharpSvg from '../assets/msSymbols/sharp.svg'
import flatSvg from '../assets/msSymbols/flat.svg'
import doubleFlatpSvg from '../assets/msSymbols/flat.svg'
import natureSvg from '../assets/msSymbols/nature.svg'
// 小节线
import barLineSingleSvg from '../assets/msSymbols/barlineSingle.svg'
import barLineFinalSvg from '../assets/msSymbols/barlineFinal.svg'
import barLineReverseFinalSvg from '../assets/msSymbols/barlineReverseFinal.svg'
import barLineStartRepeatSignSvg from '../assets/msSymbols/barlineStartRepeatSign.svg'
import barLineEndRepeatSignSvg from '../assets/msSymbols/barlineEndRepeatSign.svg'
import Clef from "./clef.vue";
import KeySignature from "./keySignature.vue";
import TimeSignature from "./timeSignature.vue";

import {getMsSymbolHeight} from "../utils/heightUtil";
import {getMsSymbolBottomToSlot} from "../utils/bottomUtil";
import {getMsSymbolLeftToSlot} from "../utils/leftUtil";
import {getMsSymbolWidth} from "../utils/widthUtil";
import NoteTail from "./noteTail.vue";
import {getMsSymbolAspectRatio} from "../utils/geometryUtil";

// 增时线&减时线
import chronaxieIncreasingLineSvg from '../assets/msSymbols/chronaxieIncreasingLine.svg'
import chronaxieReducingLine1Svg from '../assets/msSymbols/chronaxieReducingLine1.svg'
import chronaxieReducingLine2Svg from '../assets/msSymbols/chronaxieReducingLine2.svg'
import chronaxieReducingLine3Svg from '../assets/msSymbols/chronaxieReducingLine3.svg'
import chronaxieReducingLine4Svg from '../assets/msSymbols/chronaxieReducingLine4.svg'


const props = defineProps({
  msSymbol: {
    type: Object as PropType<MsSymbol>,
    required: true
  },
  msSymbolContainer: {
    type: Object as PropType<MsSymbolContainer>,
    required: true,
  },
  preContainer: {
    type: Object as PropType<MsSymbolContainer> | undefined,
    required: true
  },
  nextContainer: {
    type: Object as PropType<MsSymbolContainer | undefined>,
    required: true
  },
  measure: {
    type: Object as PropType<Measure>,
    required: true
  },
  measureWidth: {
    type: Number,
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
  containerWidth: {
    type: Number,
    required: true
  },
  isMain: {
    type: Boolean,
    default: false,
  },
  //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
  measureHeight: {
    type: Number,
    required: true
  },
  parentMsSymbol: {
    type: Object as PropType<MsSymbol>,
  },
  // 符号槽位宽度（父级符号宽度）
  slotWidth: {
    type: Number,
    required: true
  },
  slotBottom: {
    type: Number,
    required: true
  },
  slotLeft: {
    type: Number,
    required: true
  },
  componentWidth: {
    type: Number,
    required: true
  },
  componentHeight: {
    type: Number,
    required: true
  },

})
watch(()=>props.msSymbol?.vueKey,() =>{
getSvgHref()
})
function getSvgHref() {
  switch (props.msSymbol?.type) {
    case MsSymbolTypeEnum.NoteHead: {
      switch (props.msSymbol?.chronaxie) {
        case ChronaxieEnum.whole: {
          return noteHeadWholeSvg
        }
        case ChronaxieEnum.half: {
          return noteHeadHalfSvg
        }
        case ChronaxieEnum.quarter: {
          return noteHeadQuarterSvg
        }
        default: {
          return noteHeadQuarterSvg
        }
      }
    }
    case MsSymbolTypeEnum.Rest: {
      switch (props.msSymbol?.chronaxie) {
        case ChronaxieEnum.whole: {
          return restWholeSvg
        }
        case ChronaxieEnum.half: {
          ``
          return restHalfSvg
        }
        case ChronaxieEnum.quarter: {
          return restQuarterSvg
        }
        case ChronaxieEnum.eighth: {
          return restEighthSvg
        }
        case ChronaxieEnum.sixteenth: {
          return restSixteenthSvg
        }
        case ChronaxieEnum.thirtySecond: {
          return restThirySecondSvg
        }
        case ChronaxieEnum.sixtyFourth: {
          return restSixtyFourthSvg
        }
        default: {
          return restQuarterSvg
        }

      }
    }
    case MsSymbolTypeEnum.NoteStem: {
      return noteStemSvg
    }
    case MsSymbolTypeEnum.NoteTail: {
      return ''
    }
    case MsSymbolTypeEnum.Clef: {
      return ''
    }
    case MsSymbolTypeEnum.Clef_f: {
      return ''
    }
    case MsSymbolTypeEnum.BarLine: {
      switch (props.msSymbol?.barLineType) {
        case BarLineTypeEnum.single: {
          return barLineSingleSvg
        }
        case BarLineTypeEnum.final: {
          return barLineFinalSvg
        }
        case BarLineTypeEnum.reverseFinal: {
          return barLineReverseFinalSvg
        }
        case BarLineTypeEnum.startRepeatSign: {
          return barLineStartRepeatSignSvg
        }
        case BarLineTypeEnum.endRepeatSign: {
          return barLineEndRepeatSignSvg
        }

      }

      return ''
    }
    case MsSymbolTypeEnum.BarLine_f: {
      switch (props.msSymbol?.barLineType) {
        case BarLineTypeEnum.single: {
          return barLineSingleSvg
        }
        case BarLineTypeEnum.final: {
          return barLineFinalSvg
        }
        case BarLineTypeEnum.reverseFinal: {
          return barLineReverseFinalSvg
        }
        case BarLineTypeEnum.startRepeatSign: {
          return barLineStartRepeatSignSvg
        }
        case BarLineTypeEnum.endRepeatSign: {
          return barLineEndRepeatSignSvg
        }
      }
      console.error("未知的小节线类型", props.msSymbol)
      return ''
    }
    case MsSymbolTypeEnum.KeySignature: {
      return ''
    }
    case MsSymbolTypeEnum.TimeSignature: {
      return ''
    }
    case MsSymbolTypeEnum.Accidental: {
      switch (props.msSymbol?.accidental) {
        case AccidentalEnum.Sharp: {
          return sharpSvg
        }
        case AccidentalEnum.Flat: {
          return flatSvg
        }
        case AccidentalEnum.Natural: {
          return natureSvg
        }
        case AccidentalEnum.DoubleSharp: {
          return doubleSharpSvg
        }
        case AccidentalEnum.DoubleFlat: {
          return doubleFlatpSvg
        }

      }
      console.error("未知的变音符号", props.msSymbol)
      return ''
    }
    case MsSymbolTypeEnum.NoteNumber: {
      switch (props.msSymbol?.solmization) {
        case SolmizationEnum.DO: {
          return note1Svg
        }
        case SolmizationEnum.RE: {
          return note2Svg
        }
        case SolmizationEnum.MI: {
          return note3Svg
        }
        case SolmizationEnum.FA: {
          return note4Svg
        }
        case SolmizationEnum.SOL: {
          return note5Svg
        }
        case SolmizationEnum.LA: {
          return note6Svg
        }
        case SolmizationEnum.TI: {
          return note7Svg
        }
        default: {
          return note1Svg
        }

      }
    }
    case MsSymbolTypeEnum.NoteDot: {
      switch(props.msSymbol.octave) {
        case 1: {
          return noteDot4Svg
        }
        case 2: {
          return noteDot2Svg
        }
        case 3: {
          return noteDot1Svg
        }
        case 5: {
          return noteDot1Svg
        }
        case 6: {
          return noteDot2Svg
        }
        case 7: {
          return noteDot3Svg
        }
        case 8: {
          return noteDot4Svg
        }
        default: {
          return ''
        }
      }
    }
    case MsSymbolTypeEnum.ChronaxieReducingLine: {
      switch(props.msSymbol.chronaxie) {
        case ChronaxieEnum.eighth: {
          return chronaxieReducingLine1Svg
        }
        case ChronaxieEnum.sixteenth: {
          return chronaxieReducingLine2Svg
        }
        case ChronaxieEnum.thirtySecond: {
          return chronaxieReducingLine3Svg
        }
        case ChronaxieEnum.sixtyFourth: {
          return chronaxieReducingLine4Svg
        }

        default: {
          return ''
        }
      }
    }
    case MsSymbolTypeEnum.ChronaxieIncreasingLine: {
      return chronaxieIncreasingLineSvg
    }

    default: {
      console.error("未知的符号类别", props.msSymbol?.type)
      return ''
    }
  }
}
const svgHref = computed(() => {
  return getSvgHref()

})
const msSymbolRef = ref(null!)

const aspectRatio = computed<number>(() => {
  return getMsSymbolAspectRatio(props.msSymbol, props.musicScore.showMode)
})


const height = computed(() => {
  // const parentMsSymbol = getDataWithIndex(props.msSymbol).msSymbol
  return getMsSymbolHeight(props.msSymbol, props.musicScore)
})
// 符号宽度
const width = computed(() => {

  return getMsSymbolWidth(props.msSymbol, props.msSymbolContainer, props.measure,
      props.singleStaff, props.musicScore, props.componentWidth,)
})
const msSymbolLeft = computed(() => {
  return getMsSymbolLeftToSlot(props.msSymbol, props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.slotLeft, props.measureWidth, props.componentWidth)
})

const msSymbolBottom = computed(() => {
  return getMsSymbolBottomToSlot(props.msSymbol, props.musicScore)

})
const msSymbolStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    width: `${width.value}px`,
    height: `${height.value}px`,
    position: 'absolute',
    pointerEvents: 'auto',
    left: msSymbolLeft.value + 'px',
    bottom: msSymbolBottom.value + 'px',
    background: props.msSymbol.options.highlight ? props.msSymbol.options.highlightColor : props.msSymbol.options.color,
  }
  if (props.msSymbol?.type && [MsSymbolTypeEnum.KeySignature, MsSymbolTypeEnum.TimeSignature,
    MsSymbolTypeEnum.NoteTail].includes(props.msSymbol.type)) {
    style.background = 'unset'
  }

  if (svgHref.value) {
    style.mask = `url("${svgHref.value}") no-repeat center`
    style['mask-size'] = '100% 100%'
  }
  // TODO 测试代码
  // if (props.msSymbol.type === MsSymbolTypeEnum.NoteTail) {
  //   style.background = 'red'
  // }
  return style
});
const emits = defineEmits(['msSymbolMouseDown', 'msSymbolMouseUp']);

function handleMouseDown(e: MouseEvent) {
  emits('msSymbolMouseDown', e, props.msSymbol)

}

function handleMouseUp(e: MouseEvent) {
  emits('msSymbolMouseUp', e, props.msSymbol)
}


onMounted(() => {

})
defineExpose({aspectRatio})
</script>
<template>
  <clef
      v-if="msSymbol?.type === MsSymbolTypeEnum.Clef || msSymbol?.type === MsSymbolTypeEnum.Clef_f && 'clef' in msSymbol"
      v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
      :clef="msSymbol"
      @mouseup.self="handleMouseUp"
      @mousedown.self="handleMouseDown"
      :musicScore="musicScore"
      :style="msSymbolStyle"></clef>
  <key-signature
      v-else-if="msSymbol?.type === MsSymbolTypeEnum.KeySignature"
      v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
      :measure-height="measureHeight"
      :slotWidth="slotWidth"
      @mouseup.self="handleMouseUp"
      @mousedown.self="handleMouseDown"
      :musicScore="musicScore"
      :style="msSymbolStyle"
      :keySignature="msSymbol"></key-signature>
  <time-signature
      v-else-if="msSymbol?.type === MsSymbolTypeEnum.TimeSignature"
      v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
      :style="msSymbolStyle"
      @mouseup.self="handleMouseUp"
      @mousedown.self="handleMouseDown"
      :time-signature="msSymbol" :measure-height="measureHeight"></time-signature>
  <note-tail
      v-else-if="msSymbol?.type === MsSymbolTypeEnum.NoteTail"
      v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
      :ms-symbol-container="msSymbolContainer"
      :pre-container="preContainer"
      :next-container="nextContainer"
      :measure-width="measureWidth"
      :single-staff="singleStaff"
      :slot-left="slotLeft"
      :component-width="componentWidth"
      :noteTail="msSymbol" :noteHead="parentMsSymbol as NoteHead" :measure="measure"
      :musicScore="musicScore"></note-tail>
  <div v-else-if="msSymbol?.type === MsSymbolTypeEnum.NoteStem"
       v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
       ref="msSymbolRef" class="msSymbol" :style="msSymbolStyle" @mouseup.self="handleMouseUp"
       @mousedown.self="handleMouseDown"
  ></div>
  <div v-else ref="msSymbolRef" class="msSymbol" :style="msSymbolStyle" @mouseup.self="handleMouseUp"
       @mousedown.self="handleMouseDown"
  ></div>
</template>
<style scoped>
.msSymbol {
  pointer-events: all;
}
</style>