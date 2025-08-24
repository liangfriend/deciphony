<script setup lang="ts">
import {computed, CSSProperties, onMounted, PropType, ref} from "vue";
import {
  type Measure,
  MsSymbol,
  type MsSymbolContainer,
  type MusicScore,
  NoteHead,
  type SingleStaff
} from "deciphony-core/types";
import {
  AccidentalEnum,
  BarLineTypeEnum,
  ChronaxieEnum,
  MsSymbolTypeEnum,
  MusicScoreShowModeEnum
} from "deciphony-core/musicScoreEnum";
// 音符头
import noteHeadWholeSvg from "@/assets/msSymbols/noteHeadWhole.svg"
import noteHeadHalfSvg from "@/assets/msSymbols/noteHeadHalf.svg"
import noteHeadQuarterSvg from "@/assets/msSymbols/noteHeadQuarter.svg"
import note0Svg from "@/assets/msSymbols/0.svg"
import note1Svg from "@/assets/msSymbols/1.svg"
import note2Svg from "@/assets/msSymbols/2.svg"
import note3Svg from "@/assets/msSymbols/3.svg"
import note4Svg from "@/assets/msSymbols/4.svg"
import note5Svg from "@/assets/msSymbols/5.svg"
import note6Svg from "@/assets/msSymbols/6.svg"
import note7Svg from "@/assets/msSymbols/7.svg"


// 休止符
import restWholeSvg from "@/assets/msSymbols/restWhole.svg"
import restThirySecondSvg from "@/assets/msSymbols/restWhole.svg"
import restSixtyFourthSvg from "@/assets/msSymbols/restWhole.svg"
import restHalfSvg from "@/assets/msSymbols/restHalf.svg"
import restQuarterSvg from "@/assets/msSymbols/restQuarter.svg"
import restEighthSvg from "@/assets/msSymbols/restEighth.svg"
import restSixteenthSvg from "@/assets/msSymbols/restSixteenth.svg"
// 符杠
import noteBarSvg from '@/assets/msSymbols/noteBar.svg'

// 变音符号
import sharpSvg from '@/assets/msSymbols/sharp.svg'
import doubleSharpSvg from '@/assets/msSymbols/sharp.svg'
import flatSvg from '@/assets/msSymbols/flat.svg'
import doubleFlatpSvg from '@/assets/msSymbols/flat.svg'
import natureSvg from '@/assets/msSymbols/nature.svg'
// 小节线
import barLineSingleSvg from '@/assets/msSymbols/barlineSingle.svg'
import barLineFinalSvg from '@/assets/msSymbols/barlineFinal.svg'
import barLineReverseFinalSvg from '@/assets/msSymbols/barlineReverseFinal.svg'
import barLineStartRepeatSignSvg from '@/assets/msSymbols/barlineStartRepeatSign.svg'
import barLineEndRepeatSignSvg from '@/assets/msSymbols/barlineEndRepeatSign.svg'
import Clef from "./clef.vue";
import KeySignature from "./keySignature.vue";
import TimeSignature from "./timeSignature.vue";

import {getMsSymbolHeight} from "@/utils/heightUtil";
import {getMsSymbolBottomToSlot} from "@/utils/bottomUtil";
import {getMsSymbolLeftToSlot} from "@/utils/leftUtil";
import {getMsSymbolWidth} from "@/utils/widthUtil";
import NoteTail from "./noteTail.vue";
import {getMsSymbolAspectRatio} from "@/utils/geometryUtil";
import barStandardStaff from "@/assets/msSymbols/bar-standardStaff.svg";

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
    type: Object as PropType<MsSymbolContainer | null>,
    required: true
  },
  nextContainer: {
    type: Object as PropType<MsSymbolContainer | null>,
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
  showMode: {
    type: Object as PropType<MusicScoreShowModeEnum>,
    required: true
  }
})

const svgHref = computed(() => {
  switch (props.msSymbol?.type) {
    case MsSymbolTypeEnum.noteHead: {
      switch (props.showMode) {
        case MusicScoreShowModeEnum.standardStaff: {
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
        case MusicScoreShowModeEnum.numberNotation: {
          switch (props.msSymbol?.chronaxie) {
            case ChronaxieEnum.whole: {
              return note0Svg
            }
            case ChronaxieEnum.half: {
              return note0Svg
            }
            case ChronaxieEnum.quarter: {
              return note0Svg
            }
            default: {
              return note0Svg
            }

          }
        }
        default: {
          return noteHeadWholeSvg
        }
      }

    }
    case MsSymbolTypeEnum.rest: {
      switch (props.msSymbol?.chronaxie) {
        case ChronaxieEnum.whole: {
          return restWholeSvg
        }
        case ChronaxieEnum.half: {
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
    case MsSymbolTypeEnum.noteBar: {
      return noteBarSvg
    }
    case MsSymbolTypeEnum.noteTail: {
      return ''
    }
    case MsSymbolTypeEnum.clef: {
      return ''
    }
    case MsSymbolTypeEnum.clef_f: {
      return ''
    }
    case MsSymbolTypeEnum.barLine: {
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
    case MsSymbolTypeEnum.barLine_f: {
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
    case MsSymbolTypeEnum.keySignature: {
      return ''
    }
    case MsSymbolTypeEnum.timeSignature: {
      return ''
    }
    case MsSymbolTypeEnum.accidental: {
      switch (props.msSymbol?.accidental) {
        case AccidentalEnum.sharp: {
          return sharpSvg
        }
        case AccidentalEnum.flat: {
          return flatSvg
        }
        case AccidentalEnum.nature: {
          return natureSvg
        }
        case AccidentalEnum.doubleSharp: {
          return doubleSharpSvg
        }
        case AccidentalEnum.doubleFlat: {
          return doubleFlatpSvg
        }

      }
      console.error("未知的变音符号", props.msSymbol)
      return ''
    }
    default: {
      console.error("未知的符号类别", props.msSymbol?.type)
      return ''
    }
  }
})
const msSymbolRef = ref(null!)

const aspectRatio = computed<number>(() => {
  return getMsSymbolAspectRatio(props.msSymbol, props.showMode)
})


const height = computed(() => {
  // const parentMsSymbol = getDataWithIndex(props.msSymbol).msSymbol
  return getMsSymbolHeight(props.msSymbol, props.musicScore, props.showMode)
})
// 符号宽度
const width = computed(() => {

  return getMsSymbolWidth(props.msSymbol, props.msSymbolContainer, props.measure,
      props.singleStaff, props.musicScore, props.componentWidth, props.showMode)
})
const msSymbolLeft = computed(() => {
  return getMsSymbolLeftToSlot(props.msSymbol, props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.slotLeft, props.measureWidth, props.componentWidth, props.showMode)
})

const msSymbolBottom = computed(() => {
  return getMsSymbolBottomToSlot(props.msSymbol, props.musicScore, props.showMode)

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
  if (props.msSymbol?.type && [MsSymbolTypeEnum.keySignature, MsSymbolTypeEnum.timeSignature,
    MsSymbolTypeEnum.noteTail].includes(props.msSymbol.type)) {
    style.background = 'unset'
  }

  if (svgHref.value) {
    style.mask = `url("${svgHref.value}") no-repeat center`
    style['mask-size'] = '100% 100%'
  }
  // TODO 测试代码
  // if (props.msSymbol.type === MsSymbolTypeEnum.noteTail) {
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
      v-if="msSymbol?.type === MsSymbolTypeEnum.clef || msSymbol?.type === MsSymbolTypeEnum.clef_f && 'clef' in msSymbol"
      v-show="showMode === MusicScoreShowModeEnum.standardStaff"
      :clef="msSymbol"
      @mouseup.self="handleMouseUp"
      @mousedown.self="handleMouseDown"
      :musicScore="musicScore"
      :style="msSymbolStyle"></clef>
  <key-signature
      v-else-if="msSymbol?.type === MsSymbolTypeEnum.keySignature"
      v-show="showMode === MusicScoreShowModeEnum.standardStaff"
      :measure-height="measureHeight"
      :slotWidth="slotWidth"
      @mouseup.self="handleMouseUp"
      @mousedown.self="handleMouseDown"
      :musicScore="musicScore"
      :style="msSymbolStyle"
      :keySignature="msSymbol"></key-signature>
  <time-signature
      v-else-if="msSymbol?.type === MsSymbolTypeEnum.timeSignature"
      v-show="showMode === MusicScoreShowModeEnum.standardStaff"
      :style="msSymbolStyle"
      @mouseup.self="handleMouseUp"
      @mousedown.self="handleMouseDown"
      :time-signature="msSymbol" :measure-height="measureHeight"></time-signature>
  <note-tail
      v-else-if="msSymbol?.type === MsSymbolTypeEnum.noteTail"
      v-show="showMode === MusicScoreShowModeEnum.standardStaff"
      :ms-symbol-container="msSymbolContainer"
      :pre-container="preContainer"
      :next-container="nextContainer"
      :measure-width="measureWidth"
      :single-staff="singleStaff"
      :slot-left="slotLeft"
      :component-width="componentWidth"
      :noteTail="msSymbol" :noteHead="parentMsSymbol as NoteHead" :measure="measure"
      :musicScore="musicScore"></note-tail>
  <div v-else-if="msSymbol?.type === MsSymbolTypeEnum.noteBar"
       v-show="showMode === MusicScoreShowModeEnum.standardStaff"
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