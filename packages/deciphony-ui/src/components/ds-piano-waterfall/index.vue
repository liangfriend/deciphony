<script lang="ts" setup>
import {computed, CSSProperties, onBeforeUnmount, onMounted, PropType, ref} from 'vue'
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
  }, // 基准线位置
  baseLineBottom: {
    type: Number,
    default: 100
  },
  highlightPolicy: {
    type: Object as PropType<Partial<HighlightPolicy>>,
    default: () => ({}),
  },
})

const performSequenceComputed = computed(() => {
  const res: Record<number, [number, number][]> = {}

  for (const [midiStr, seq] of Object.entries(props.performSequence)) {
    const midi = Number(midiStr)
    res[midi] = seq.map(([start, end]) => [
      start + props.prepareTime,
      end + props.prepareTime,
    ])
  }

  return res
})
// 总时长（毫秒）
const duration = computed(() => {
  let maxTime = 0
  for (let i of Object.keys(performSequenceComputed.value)) {
    const waterColumns = performSequenceComputed.value[i]
    for (let j in waterColumns) {
      const endTime = waterColumns[j][1]
      if (endTime > maxTime) {
        maxTime = endTime
      }
    }

  }
  return maxTime
})
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

/*
* 样式
* */
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

  const precent = currentTime.value * props.columnHeightConstant - props.baseLineBottom
  // 当前时间在该区间时，计算下落动画

  return {
    height: waterfallHeight + 'px',
    position: 'absolute',
    bottom: 0, // 这个
    transform: `translateY(${precent}px)`, // 这里从containerHeightNum.value + waterfallHeight到0，如果transform不好做暂停，改用修改bottom
    userSelect: 'none',
    display: 'flex',
  }
})
const keyStyle = computed(() => {
  return (midi: number): CSSProperties => {
    const midiWidth = getMidiWidth(midi)
    const res: CSSProperties = {
      width: midiWidth + keyUnit.value,
      height: '100%',
      flexShrink: 0,
      // margin: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
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
      visibility: activeKeys.value.has(midi) ? 'visible' : 'hidden',
    }
    return res
  }
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
      bottom: (start) * props.columnHeightConstant + 'px',
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
      background: `red`,
      position: 'absolute',
      flexShrink: 0,
      borderRadius: '5px',
      bottom: (start) * props.columnHeightConstant + 'px',

    }
  }
})
/** 按键交互 */

// 高亮效果
const midiEventContainerStyle = computed((): CSSProperties => {
  return {
    height: '0px',
    bottom: props.baseLineBottom + 'px',
    outline: '1px dashed yellow',
    display: 'flex',
  }
})


/*
* 事件
* */
// 高亮策略
interface HighlightPolicy {
  /** 是否允许重复触发同一音符高亮 */
  allowRepeat: boolean

  /** 若提前多少毫秒按下，不触发高亮（例如为了防止提前触键） */
  startTriggerThreshold: number

  /** 若超过音符区间多少毫秒秒还没按下，是否仍允许触发 */
  postTriggerThreshold: number

}

const defaultHighlightPolicy: HighlightPolicy = {
  allowRepeat: false, // 有了后两个触发时间的限制，这个暂时可以不要，现在无实际功能
  startTriggerThreshold: 100,
  postTriggerThreshold: 100
}
const policy = computed(() => ({
  ...defaultHighlightPolicy,
  ...props.highlightPolicy,
}))
const activeKeys = ref<Set<number>>(new Set())
const activeParts = ref(new Map<number, Array<Array<number>>>())
onMounted(() => {
  // 绑定键盘按下与抬起事件
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  // 移除事件绑定
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

function handleKeyDown(e: KeyboardEvent) {

  const midi = props.config.keyboard?.find(item => item.code === e.code)?.midi
  if (!midi) return
  // 防止重复按下
  if (activeKeys.value.has(midi)) return
  activeKeys.value.add(midi)
  if (state.value !== 'playing') return
  // 记录高亮部分
  const timeStamp = currentTime.value
  if (activeParts.value.has(midi)) {
    const arr = activeParts.value.get(midi)
    arr.push([timeStamp])
  } else {
    activeParts.value.set(midi, [[timeStamp]])
  }
}

function handleKeyUp(e: KeyboardEvent) {
  const midi = props.config.keyboard?.find(item => item.code === e.code)?.midi
  if (!midi) return
  activeKeys.value.delete(midi)
  if (state.value !== 'playing') return
  // 记录高亮部分
  const timeStamp = currentTime.value
  const arr = activeParts.value.get(midi)
  // 其实这个防护不一定能用到
  if (!arr || arr.length === 0) return
  const last = arr[arr.length - 1]
  if (last.length === 1) last.push(timeStamp)
}

// 高亮数据
const highlightSegments = computed(() => {
  const result: Record<number, [number, number][]> = {}

  for (const [midiStr, seq] of Object.entries(performSequenceComputed.value)) {
    const midi = Number(midiStr)
    const activeSeq = activeParts.value.get(midi) || []
    const highlightParts: [number, number][] = []

    for (const [pStart, pEnd] of seq) {
      // 根据策略计算允许的触发区间
      const validStart = pStart - policy.value.startTriggerThreshold
      const validEnd = pStart + policy.value.postTriggerThreshold

      // 若不允许重复，则只取第一个激活区间
      const parts = activeSeq

      for (const part of parts) {
        const aStart = part[0]
        const aEnd = part[1] ?? currentTime.value // 若还未抬键，则动态增长

        // 若整个按下区间完全不在允许区间内，则跳过
        if (aStart < validStart || aStart > validEnd) continue

        // 有效交集
        const overlapStart = Math.max(pStart, aStart)
        const overlapEnd = Math.min(pEnd, aEnd)

        if (overlapStart < overlapEnd) {
          highlightParts.push([overlapStart, overlapEnd])
        }
      }
    }

    // 若有高亮区间，则存入结果
    if (highlightParts.length > 0) {
      result[midi] = highlightParts
    }
  }

  return result
})
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
const state = ref('stopped')// stopped playing paused
// 播放起点（用于恢复播放）
let lastTimestamp = 0
let rafId: number | null = null

/** 播放函数 */
function play() {
  if (state.value === 'playing') return
  state.value = 'playing'
  lastTimestamp = performance.now()
  requestFrame()
}

/** 暂停函数 */
function pause() {
  if (state.value !== 'playing') return
  state.value = 'paused'
  if (rafId) cancelAnimationFrame(rafId)
}

/** 停止函数（回到开头） */
function stop() {
  if (state.value === 'stopped') return
  state.value = 'stopped'
  if (rafId) cancelAnimationFrame(rafId)
  currentTime.value = 0
}

/** 动画循环 */
function requestFrame() {
  rafId = requestAnimationFrame((timestamp) => {
    if (state.value !== 'playing') return

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

defineExpose({
  play,
  pause,
  stop
})
</script>

<template>

  <div :style="pianoWaterfallContainerStyle" class="hide-scrollbar stack" comment="滚动容器">
    <div :style="waterfallStyle" class="stackItem" comment="瀑布流容器">
      <div
          v-for="midi in Array.from({ length: midi.max - midi.min + 1 }, (_, i) =>midi.min + i)"
          :key="midi"
          :style="keyStyle(midi)"
      >
        <div v-for="(item,index) in performSequenceComputed[midi]" :key="index" :style="waterColumnStyle(item)"
             comment="音符水柱,后续改插槽自定义样式">
        </div>
        <div v-for="(item,index) in highlightSegments[midi] || []" :key="index"
             :style="waterColumnActiveStyle(item)"
             comment="音符水柱激活态,后续改插槽自定义样式">
        </div>
      </div>
    </div>
    <div :style="midiEventContainerStyle" class="stackItem" comment="瀑布流容器,midi按下效果">
      <div v-for="midi in Array.from({ length: midi.max - midi.min + 1 }, (_, i) =>midi.min + i)"
           :key="midi"
           :style="midiEventStyle(midi)"
           comment="midi按下效果,后续改插槽自定义样式"
      >
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



