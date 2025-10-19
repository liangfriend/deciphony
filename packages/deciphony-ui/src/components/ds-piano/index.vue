<script setup lang="ts">
import {computed, CSSProperties, PropType, ref} from 'vue'
import {parseAndFormatDimension} from '../../utils/commonUtil'
import {AccidentalEnum, midiToNoteName, NoteName, noteNameToNoteString, noteNameToHelmholtz} from "deciphony-core";
import vDrag from '../../directivces/drag';

defineOptions({
  name: 'DsPiano'
})

const props = defineProps({
  height: {type: String, default: '180px'},
  whiteKeyWidth: {type: String, default: '40px'},
  blackKeyWidthRatio: {
    type: Number,
    default: 0.7
  },
  blackKeyHeightRatio: {
    type: Number,
    default: 0.65
  },
  pitchNotation: {
    type: String, // Scientific Helmholtz
    default: 'Scienstific'
  },
  midi: {
    type: Object as PropType<{
      min: number
      max: number
    }>,
    default: () => ({min: 21, max: 108})
  }
})

/** 判断该 midi 是否为黑键（1,3,6,8,10 实际上是 1,3,6,8,10 — 但你之前用 1,3,5,8,10；通常 black indices: 1,3,6,8,10） */
function isBlackKey(midi: number) {
  const noteIndex = midi % 12
  return [1, 3, 6, 8, 10].includes(noteIndex)
}

/** 原始键数组（含黑白标识） */
const rawKeys = computed(() => {
  const out: Array<{
    midi: number;
    black: boolean,
    scientificNoteName: [string, string],
    helmholtzNoteName: [string, string],
  }> = []
  for (let i = props.midi.min; i <= props.midi.max; i++) {
    out.push({
      midi: i,
      black: isBlackKey(i),
      scientificNoteName: [noteNameToNoteString(midiToNoteName(i, AccidentalEnum.Sharp)), noteNameToNoteString(midiToNoteName(i, AccidentalEnum.Flat))],
      helmholtzNoteName: [noteNameToHelmholtz(midiToNoteName(i, AccidentalEnum.Sharp)), noteNameToHelmholtz(midiToNoteName(i, AccidentalEnum.Flat))]
    })
  }
  return out
})

/** 白键数组（带索引） */
const whiteKeys = computed(() => {
  const arr: Array<{
    midi: number
    black: boolean
    scientificNoteName: [string, string]
    helmholtzNoteName: [string, string],
    whiteIndex: number
  }> = []
  let wi = 0
  for (const k of rawKeys.value) {
    if (!k.black) {
      arr.push({
        whiteIndex: wi,
        ...k
      })
      wi++
    }
  }
  return arr
})

/** 黑键数组 */
const blackKeys = computed(() => {
  // 只包含黑键，不带索引（位置按前面的白键数量计算）
  return rawKeys.value.filter(k => {
    return k.black
  })
})

/** 从 midi 找到前面的白键数量（whiteIndexBefore） */
function whiteIndexBeforeMidi(midi: number) {
  // count white keys with midi < target
  let count = 0
  for (let m = props.midi.min; m < midi; m++) {
    if (!isBlackKey(m)) count++
  }
  return count // 等价于前面有多少白键
}

/** 解析白键宽、容器高度单位/数值 */
const {value: whiteWidthNum, unit: whiteUnit} = parseAndFormatDimension(props.whiteKeyWidth)
const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)

const blackKeyWidthNum = computed(() => whiteWidthNum * props.blackKeyWidthRatio)
const blackKeyHeightNum = computed(() => containerHeightNum * props.blackKeyHeightRatio)

/** 计算内层总宽度（所有白键） */
const innerWidth = computed(() => {
  const totalWhite = whiteKeys.value.length
  return `${totalWhite * whiteWidthNum}${whiteUnit}`
})

/** 样式 - 外容器（带滚动） */
const pianoContainerStyle = computed((): CSSProperties => ({
  width: totalWidth.value,
  height: props.height,
  position: 'relative',
  background: '#eee'
}))


/** 生成白键样式 left 值 */
function leftForWhiteByIndex(whiteIndex: number) {
  return `${whiteIndex * whiteWidthNum}${whiteUnit}`
}

/** 生成黑键 left 值（将黑键居中放在相邻两个白键之间） */
function leftForBlackByMidi(midi: number) {
  const beforeWhiteCount = whiteIndexBeforeMidi(midi) // number of white keys strictly before this midi
  // place at (beforeWhiteCount + 1) * whiteWidth - blackWidth/2  => between the white before and the next white
  const leftNum = (beforeWhiteCount) * whiteWidthNum - (blackKeyWidthNum.value / 2)
  return `${leftNum}${whiteUnit}`
}

/** 按键交互 */
const pressedKeys = ref<number[]>([])
const emit = defineEmits<{
  (e: 'keyDown', key: {
    midi: number
    black: boolean
    scientificNoteName: [string, string]
    helmholtzNoteName: [string, string]
  }): void
  (e: 'keyUp', key: {
    midi: number
    black: boolean
    scientificNoteName: [string, string]
    helmholtzNoteName: [string, string]
  }): void
}>()

function handlePointerDown(event: PointerEvent, key: {
  midi: number
  black: boolean
  scientificNoteName: [string, string]
  helmholtzNoteName: [string, string]
}) {
  if (!pressedKeys.value.includes(key.midi)) pressedKeys.value.push(key.midi)
  const el = event.target as HTMLAnchorElement
  el.setPointerCapture(event.pointerId);
  emit('keyDown', key)
}

function handlePointerUp(event: PointerEvent, key: {
  midi: number
  black: boolean
  scientificNoteName: [string, string]
  helmholtzNoteName: [string, string]
}) {
  pressedKeys.value = pressedKeys.value.filter(m => m !== key.midi)
  const el = event.target as HTMLAnchorElement
  el.releasePointerCapture(event.pointerId);
  emit('keyUp', key)
}

function isKeyActive(midi: number) {
  return pressedKeys.value.includes(midi)
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

const groupColorMap = ref({
  '大字三组': 'rgba(255, 99, 132, 0.2)',   // 粉红
  '大字二组': 'rgba(54, 162, 235, 0.2)',   // 天蓝
  '大字一组': 'rgba(255, 206, 86, 0.2)',   // 明黄
  '小字组': 'rgba(75, 192, 192, 0.2)',     // 青绿
  '小字一组': 'rgba(153, 102, 255, 0.2)',  // 紫色
  '小字二组': 'rgba(255, 159, 64, 0.2)',   // 橙色
  '小字三组': 'rgba(0, 200, 83, 0.2)',     // 草绿
  '小字四组': 'rgba(233, 30, 99, 0.2)',    // 洋红
  '小字五组': 'rgba(0, 188, 212, 0.2)',    // 湖蓝
  '小字六组': 'rgba(255, 87, 34, 0.2)',    // 橘红
  '小字七组': 'rgba(63, 81, 181, 0.2)',    // 靛蓝
  '小字八组': 'rgba(139, 195, 74, 0.2)',   // 苹果绿
})
// 分组蒙层数组
const groupMaskList = computed((): { whiteKeyCount: number, groupName: string, color: string }[] => {
  const min = props.midi.min
  const max = props.midi.max

  const groupNames = [
    '大字三组',
    '大字二组',
    '大字一组',
    '小字组',
    '小字一组',
    '小字二组',
    '小字三组',
    '小字四组',
    '小字五组',
    '小字六组',
    '小字七组',
    '小字八组',
  ]


  const res = []
  let whiteKeyCount = 0
  for (let i = min; i <= max; i++) {
    whiteKeyCount += isWhiteKey(i) ? 1 : 0
    const ocatve = Math.floor(i / 12)
    let groupName: string = ''
    switch (ocatve) {
      case 0: {
        groupName = '大字四组'
        break
      }
      case 1: {
        groupName = '大字三组'
        break
      }
      case 2: {
        groupName = '大字二组'
        break
      }
      case 3: {
        groupName = '大字一组'
        break
      }
      case 4: {
        groupName = '小字组'
        break
      }
      case 5: {
        groupName = '小字一组'
        break
      }
      case 6: {
        groupName = '小字二组'
        break
      }
      case 7: {
        groupName = '小字三组'
        break
      }
      case 8: {
        groupName = '小字四组'
        break
      }
      case 9: {
        groupName = '小字五组'
        break
      }
    }
    const cur = {
      whiteKeyCount,
      groupName,
      color: groupColorMap.value[groupName],

    }
    // 加上最后一组
    if (max % 12 !== 11 && i === max) {
      res.push(cur)
    }
    if (i % 12 === 11) {
      res.push(cur)
      whiteKeyCount = 0
    }

  }

  return res
})

const groupStyle = computed((): (item: {
  whiteKeyCount: number
  groupName: string
  color: string
}) => CSSProperties => {
  return (item: {
    whiteKeyCount: number
    groupName: string
    color: string
  }) => {
    const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
    const width = item.whiteKeyCount * value + unit
    return {
      width,
      backgroundColor: item.color,
      height: props.height,
      flexShrink: 0,
      pointerEvents: 'none',
    }
  }
})
// 音程尺
const intervalRulerStyle = computed((): CSSProperties => {
  const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
  const res: CSSProperties = {
    width: value * 26 + unit,
    height: props.height,
    backgroundColor: 'green',
    boxShadow: '0px 0px 0px 10px rgba(0,0,0,0.2)',
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
  }
  return res
})
const intervalRulerData = ref([
  {name: '纯一度', semitones: 0, wholeTones: 0},
  {name: '小二度', semitones: 1, wholeTones: 0.5},
  {name: '大二度', semitones: 2, wholeTones: 1},
  {name: '小三度', semitones: 3, wholeTones: 1.5},
  {name: '大三度', semitones: 4, wholeTones: 2},
  {name: '纯四度', semitones: 5, wholeTones: 2.5},
  {name: '增四度', semitones: 6, wholeTones: 3},
  {name: '纯五度', semitones: 7, wholeTones: 3.5},
  {name: '小六度', semitones: 8, wholeTones: 4},
  {name: '大六度', semitones: 9, wholeTones: 4.5},
  {name: '小七度', semitones: 10, wholeTones: 5},
  {name: '大七度', semitones: 11, wholeTones: 5.5},
  {name: '纯八度', semitones: 12, wholeTones: 6},
  {name: '小九度', semitones: 13, wholeTones: 6.5},
  {name: '大九度', semitones: 14, wholeTones: 7},
  {name: '小十度', semitones: 15, wholeTones: 7.5},
  {name: '大十度', semitones: 16, wholeTones: 8},
  {name: '纯十一度', semitones: 17, wholeTones: 8.5},
  {name: '增十一度', semitones: 18, wholeTones: 9},
  {name: '纯十二度', semitones: 19, wholeTones: 9.5},
  {name: '小十三度', semitones: 20, wholeTones: 10},
  {name: '大十三度', semitones: 21, wholeTones: 10.5},
  {name: '小十四度', semitones: 22, wholeTones: 11},
  {name: '大十四度', semitones: 23, wholeTones: 11.5},
  {name: '纯十五度', semitones: 24, wholeTones: 12},
])
const intervalRulerItemStyle = computed((): CSSProperties => {
  const res: CSSProperties = {
    width: props.whiteKeyWidth,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
  return res
})
</script>

<template>
  <div class="ds-piano-container hide-scrollbar stack" :style="pianoContainerStyle">
    <div comment="白键和黑键" class="stackItem">
      <!-- 白键（绝对定位） -->
      <div
          v-for="wk in whiteKeys"
          :key="wk.midi"
          class="white-key"
          :class="{ active: isKeyActive(wk.midi) }"
          :style="{
          width: props.whiteKeyWidth,
          height: '100%',
          position: 'absolute',
          left: leftForWhiteByIndex(wk.whiteIndex)
        }"
          @pointerdown="handlePointerDown($event, wk)"
          @pointerup="handlePointerUp($event,wk)"
      >
        <div class="noteName">{{
            pitchNotation === 'Scientific' ? noteNameToNoteString(midiToNoteName(wk.midi, AccidentalEnum.Sharp)) : noteNameToHelmholtz(midiToNoteName(wk.midi, AccidentalEnum.Sharp))
          }}
        </div>
      </div>

      <!-- 黑键（绝对定位） -->
      <div
          v-for="bk in blackKeys"
          :key="bk.midi"
          class="black-key"
          :class="{ active: isKeyActive(bk.midi) }"
          :style="{
          width: blackKeyWidthNum + whiteUnit,
          height: blackKeyHeightNum + heightUnit,
          left: leftForBlackByMidi(bk.midi),
        }"
          @pointerdown="handlePointerDown($event,bk)"
          @pointerup="handlePointerUp($event,bk)"
      >
        <div class="noteNameSharp">
          {{ pitchNotation === 'Scientific' ? bk.scientificNoteName[0] : bk.helmholtzNoteName[0] }}
        </div>
        <div class="noteNameFlat">
          {{ pitchNotation === 'Scientific' ? bk.scientificNoteName[1] : bk.helmholtzNoteName[1] }}
        </div>
      </div>
    </div>
    <div comment="分组遮罩" class="stackItem group">
      <div v-for="item in groupMaskList" :key="item.groupName" :style="groupStyle(item)"></div>
    </div>

    <div comment="滑块功能层" class="stackItem " :style="{height:0}">
      <div comment="音程尺" :style="intervalRulerStyle" v-drag="{ enabled: true, axis: 'x', limit: true }">
        <div v-for="item in intervalRulerData" :style="intervalRulerItemStyle">
          <div></div>
          <div>{{ item.name }}</div>
          <div style="display: flex;justify-content: center;align-items: flex-end">
            <div :style="{width: '1px',backgroundColor:' #111111',height: '10px'}"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.ds-piano-container {
  user-select: none;
}


.white-key {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: white;
  border: 1px solid #ccc;
  box-sizing: border-box;
  cursor: pointer;
}

.white-key.active {
  background: #a8d8ff;
}

.black-key {
  position: absolute;
  background: black;
  border-radius: 0 0 4px 4px;
  color: white;
  cursor: pointer;
  transform: translateY(0);

  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
}

.black-key.active {
  background: #3399ff;

}

.group {
  display: flex;
}


.hide-scrollbar {
  -ms-overflow-style: none; /* IE & Edge */
  scrollbar-width: none; /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome */
}
</style>
<style scoped>
.stack {
  position: relative;
  height: 100%;
  width: 100%;
}

.stackItem {
  pointer-events: none;
  position: absolute;
  height: 100%;
  width: 100%;

  > * {
    pointer-events: auto;
  }
}


</style>
