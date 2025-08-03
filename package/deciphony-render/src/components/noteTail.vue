<script setup lang="ts">
import {computed, CSSProperties, PropType} from "vue";
import {
  getBeamGroup,
  getDataWithIndex,
  getMsSymbolAspectRatio
} from "@/applications/ChuangKeApplication/components/musicScore/utils/musicScoreDataUtil.ts";
import {
  BeamGroup,
  type Measure,
  MsSymbol,
  type MsSymbolContainer,
  type MusicScore,
  NoteHead,
  NoteTail,
  type SingleStaff
} from "@/applications/ChuangKeApplication/components/musicScore/types";
import {
  ChronaxieEnum,
  MsSymbolTypeEnum,
  MusicScoreRegionEnum
} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";
import noteTailOneUpSvg from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/noteTailOneUp.svg";
import noteTailTwoUpSvg from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/noteTailTwoUp.svg";
import noteTailOneDownSvg
  from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/noteTailOneDown.svg";
import noteTailTwoDownSvg
  from "@/applications/ChuangKeApplication/components/musicScore/musicSymbols/noteTailTwoDown.svg";
import {getMsSymbolHeight} from "@/applications/ChuangKeApplication/components/musicScore/utils/heightUtil.ts";
import {
  getMsSymbolWidth,
  getNoteTailWidth
} from "@/applications/ChuangKeApplication/components/musicScore/utils/widthUtil.ts";
import {getMsSymbolLeftToSlot} from "@/applications/ChuangKeApplication/components/musicScore/utils/leftUtil.ts";
import {getMsSymbolBottomToSlot} from "@/applications/ChuangKeApplication/components/musicScore/utils/bottomUtil.ts";

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
    type: Object as PropType<MsSymbolContainer | null>,
    required: true
  },
  nextContainer: {
    type: Object as PropType<MsSymbolContainer | null>,
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
  if (props.noteTail.type === MsSymbolTypeEnum.noteTail && props.nextContainer) {
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
    bottom: msSymbolBottom.value + 'px',
    background: props.noteTail.options.highlight ? props.noteTail.options.highlightColor : props.noteTail.options.color,
  }

  if (mask.value && beamGroup.value.length < 2) {
    style.mask = `url(${mask.value}) center center / cover no-repeat`
  } else {
    style.background = 'transparent'
  }

  return style
});
const msSymbolLeft = computed(() => {
  return getMsSymbolLeftToSlot(props.noteTail, props.msSymbolContainer, props.measure, props.singleStaff,
      props.musicScore, props.slotLeft, props.measureWidth, props.componentWidth)
})

const msSymbolBottom = computed(() => {
  return getMsSymbolBottomToSlot(props.noteTail, props.musicScore)

})
const mask = computed(() => {
  const noteHead = getDataWithIndex(props.noteTail.index, props.musicScore)
      .msSymbol as NoteHead
  if (noteHead && 'chronaxie' in noteHead
      && noteHead.region <= MusicScoreRegionEnum.space_2) {
    switch (props.noteTail.chronaxie) {
      case ChronaxieEnum.eighth: {
        return noteTailOneUpSvg

      }
      case ChronaxieEnum.sixteenth: {
        return noteTailTwoUpSvg
      }
      default: {
        return ''
      }
    }
  } else {
    switch (props.noteTail.chronaxie) {
      case ChronaxieEnum.eighth: {
        return noteTailOneDownSvg

      }
      case ChronaxieEnum.sixteenth: {
        return noteTailTwoDownSvg
      }
      default: {
        return ''
      }
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