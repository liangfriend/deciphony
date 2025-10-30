<script lang="ts" setup>
import {computed, CSSProperties, onMounted, PropType, ref} from 'vue'
import {parseAndFormatDimension} from '../../utils/commonUtil'
import {AccidentalEnum, midiToNoteName, noteNameToHelmholtz, noteNameToNoteString} from "deciphony-core";
import vDrag from '../../directivces/drag';
import {KeyCodeEnum} from "../../types/enum";
import {defaultCodeConfig} from "../../utils/constant";

defineOptions({
  name: 'DsPianoWaterfall'
})

const props = defineProps({
  height: {type: String, default: '180px'},
  whiteKeyWidth: {type: String, default: '40px'},
  blackKeyWidthRatio: {
    type: Number,
    default: 0.7
  },
  config: {
    type: Object as PropType<{
      keyboard: {
        code: KeyCodeEnum,
        midi: number,
      }[]
    }>,
    default: () => ({
      keyboard: defaultCodeConfig
    })
  },
  bpm: { // performSequence为sequence时生效
    type: Number,
    default: 120
  },
  columnHeightConstant: {// 水柱高度系数
    type: Number,
    default: 0.05
  },
  prepareTime: {
    type: Number,
    default: 3000 // 三秒的预备时间
  },
  performSequence: {
    default: () => {
      return {
        '60': [[0, 600], [600, 1200], [3200, 4200], [4800, 5600]],
        '61': [[1200, 1800], [1800, 3200]],
        '62': [[0, 600], [1800, 2400]],
      }
    }
  },
  midi: {
    type: Object as PropType<{
      min: number
      max: number
    }>,
    default: () => ({min: 21, max: 108})
  },
})

function isBlackKey(midi: number) {
  const noteIndex = midi % 12
  return [1, 3, 6, 8, 10].includes(noteIndex)
}

/** 解析容器高度，单位*/
const containerHeightNum = computed(() => {
  const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)
  return containerHeightNum
})
const containerHeightUnit = computed(() => {
  const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)
  return heightUnit
})
/** 解析白键宽、容器高度单位/数值 */
const whiteKeyWidthNum = computed(() => {
  const {value: whiteKeyWidthNum, unit} = parseAndFormatDimension(props.whiteKeyWidth)
  return whiteKeyWidthNum
})
const keyUnit = computed(() => {
  const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
  return unit
})

/** 样式 - 外容器（带滚动） */
const pianoWaterfallContainerStyle = computed((): CSSProperties => ({
  width: totalWidth.value,
  height: props.height,
  outline: '1px dashed black',
  position: 'relative',
  overflow: 'hidden',

}))
const waterfallStyle = computed((): CSSProperties => {
  const waterfallHeight = duration.value * props.columnHeightConstant

  const precent = currentTime.value * props.columnHeightConstant
  // 当前时间在该区间时，计算下落动画

  return {
    height: waterfallHeight + 'px',
    position: 'absolute',
    bottom: 0, // 这个
    background: '#eee',
    transform: `translateY(${precent}px)`, // 这里从containerHeightNum.value + waterfallHeight到0，如果transform不好做暂停，改用修改bottom
    userSelect: 'none',
    display: 'flex',
  }
})

function getMidiWidth(midi) {
  let width = 0
  switch (midi % 12) {
    case 0: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
      break
    }
    case 1: {
      width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
      break
    }
    case 2: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value
      break
    }
    case 3: {
      width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
      break
    }
    case 4: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
      break
    }
    case 5: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
      break
    }
    case 6: {
      width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
      break
    }
    case 7: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value
      break
    }
    case 8: {
      width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
      break
    }
    case 9: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value
      break
    }
    case 10: {
      width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
      break
    }
    case 11: {
      width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
      break
    }

  }
  // 开始位置偏差
  if (midi === props.midi.min) {
    switch (midi % 12) {
      case 2: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
      }

      case 4: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }
      case 7: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }

      case 9: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }

      case 11: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }
    }
    // 黑键开始
    if ([1, 3, 6, 8, 10].includes(midi % 12)) {
      width -= props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
    }
  }
  // 结束位置偏差
  if (midi === props.midi.max) {
    switch (midi % 12) {
      case 0: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }

      case 2: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }
      case 4: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }

      case 5: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }

      case 7: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }
      case 9: {
        width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
        break
      }
    }
    // 黑键结束
    if ([1, 3, 6, 8, 10].includes(midi % 12)) {
      width -= props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
    }
  }
  return width
}

const keyStyle = computed(() => {
  return (midi: number): CSSProperties => {
    const midiWidth = getMidiWidth(midi)
    const res: CSSProperties = {
      width: midiWidth + keyUnit.value,
      height: '100%',
      flexShrink: 0,
      margin: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
      outline: '1px solid black',
    }
    return res
  }
})
const midiEventStyle = computed(() => {
  return (midi: number): CSSProperties => {
    const midiWidth = getMidiWidth(midi)
    const res: CSSProperties = {
      width: midiWidth + keyUnit.value,
      flexShrink: 0,
      height: '0.1px',
      boxShadow: '0 0px 5px 1px red',
      visibility: midi === 60 ? 'visible' : 'hidden',
    }
    return res
  }
})
// 总时长（毫秒）
const duration = computed(() => {
  let maxTime = 0
  for (let i of Object.keys(props.performSequence)) {
    const waterColumns = props.performSequence[i]
    for (let j in waterColumns) {
      const endTime = waterColumns[j][1]
      if (endTime > maxTime) {
        maxTime = endTime
      }
    }

  }
  return maxTime + props.prepareTime
})
// 水柱样式
const waterColumnStyle = computed(() => {
  return (item: [number, number]) => {
    const start = item[0]
    const end = item[1]
    const res: CSSProperties = {
      height: (end - start) * props.columnHeightConstant + 'px',
      width: '10px',
      backgroundColor: 'blue',
      position: 'absolute',
      flexShrink: 0,
      borderRadius: '5px',
      bottom: (start + props.prepareTime) * props.columnHeightConstant + 'px',
    }
    return res
  }
})
// 水柱激活样式
const waterColumnActiveStyle = computed(() => {
  return (item: [number, number]): CSSProperties => {
    const start = item[0]
    const end = item[1]


    return {
      height: (end - start) * props.columnHeightConstant + 'px',
      width: '10px',
      background: `linear-gradient(transparent 40%, red 40%)`,
      position: 'absolute',
      flexShrink: 0,
      borderRadius: '5px',
      bottom: (start + props.prepareTime) * props.columnHeightConstant + 'px',

    }
  }
})
/** 按键交互 */

// 高亮效果
const midiHighlightStyle = computed((): CSSProperties => {
  return {
    height: '0.1px',//0px会导致box-shadow不显示，所以0.1
    width: '100%',
    position: 'absolute',
    bottom: '0',
    boxShadow: '0px 0px 5px red',
  }
})
const midiEventContainerStyle = computed((): CSSProperties => {
  return {
    height: '0px',
    bottom: '0',
    display: 'flex',
  }
})
const activeKeys = ref<Set<number>>(new Set())


function handlePointerDown(event: PointerEvent, midi: number) {
  const el = event.target as HTMLAnchorElement
  el.setPointerCapture(event.pointerId);
}

function handlePointerUp(event: PointerEvent, midi: number) {
  const el = event.target as HTMLAnchorElement
  el.releasePointerCapture(event.pointerId);
}

function isKeyActive(midi: number) {
  return activeKeys.value.has(midi)
}

/* 整体宽度 */
const totalWidth = computed(() => {
  let whiteKeyCount = 0
  for (let i = props.midi.min; i <= props.midi.max; i++) {
    if (isWhiteKey(i)) {
      whiteKeyCount += 1
    }
  }
  const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
  return value * whiteKeyCount + unit
})

/** 判断是否是白键 */
function isWhiteKey(midi: number) {
  const noteIndex = midi % 12
  return ![1, 3, 6, 8, 10].includes(noteIndex)
}

// 播放功能
// 当前播放时间（ms）
const currentTime = ref(0)
// 是否正在播放
const isPlaying = ref(false)
// 播放起点（用于恢复播放）
let lastTimestamp = 0
let rafId: number | null = null

/** 播放函数 */
function play() {
  if (isPlaying.value) return
  isPlaying.value = true
  lastTimestamp = performance.now()
  requestFrame()
}

/** 暂停函数 */
function pause() {
  isPlaying.value = false
  if (rafId) cancelAnimationFrame(rafId)
}

/** 停止函数（回到开头） */
function stop() {
  isPlaying.value = false
  if (rafId) cancelAnimationFrame(rafId)
  currentTime.value = 0
}

/** 动画循环 */
function requestFrame() {
  rafId = requestAnimationFrame((timestamp) => {
    if (!isPlaying.value) return

    const delta = timestamp - lastTimestamp
    lastTimestamp = timestamp
    currentTime.value += delta

    // 若播放超出总时长，停止动画，但保留状态
    if (currentTime.value >= duration.value) {
      if (rafId) cancelAnimationFrame(rafId)
      return
    }

    requestFrame()
  })
}
</script>

<template>
  <div style="display:flex;gap:10px;margin:10px 0;position: relative;z-index: 10">
    <button @click="play">Play ▶️</button>
    <button @click="pause">Pause ⏸️</button>
    <button @click="stop">Stop ⏹️</button>
  </div>
  <div :style="pianoWaterfallContainerStyle" class="hide-scrollbar stack" comment="滚动容器">
    <div :style="waterfallStyle" class="stackItem" comment="瀑布流容器">
      <div
          v-for="midi in Array.from({ length: midi.max - midi.min + 1 }, (_, i) =>midi.min + i)"
          :key="midi"
          :style="keyStyle(midi)"
      >
        <div comment="音符水柱" v-for="(item,index) in performSequence[midi]" :key="index"
             :style="waterColumnStyle(item)">
        </div>
        <div comment="音符水柱激活态" v-for="(item,index) in performSequence[midi]" :key="index"
             :style="waterColumnActiveStyle(item)">
        </div>
      </div>
    </div>
    <div :style="midiEventContainerStyle" class="stackItem" comment="瀑布流容器,midi按下效果">
      <div
          v-for="midi in Array.from({ length: midi.max - midi.min + 1 }, (_, i) =>midi.min + i)"
          :key="midi"

          :style="midiEventStyle(midi)"
      >
        <!--        <div comment="midi按下效果" :style="midiHighlightStyle"></div>-->
      </div>
    </div>

  </div>

</template>

<style scoped>

.hide-scrollbar {
  -ms-overflow-style: none; /* IE & Edge */
  scrollbar-width: none; /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome */
}
</style>



