<script lang="ts" setup>
import {computed, CSSProperties, onMounted, PropType, ref} from 'vue'
import {parseAndFormatDimension} from '../../utils/commonUtil'
import {AccidentalEnum, midiToNoteName, noteNameToHelmholtz, noteNameToNoteString} from "deciphony-core";
import vDrag from '../../directivces/drag';
import {KeyCodeEnum} from "../../types/enum";

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
  config: {
    type: Object as PropType<{
      keyboard: {
        code: KeyCodeEnum,
        midi: number,
      }[]
    }>,
    default: () => ({
      keyboard: [{
        code: 'KeyA',
        midi: 21,
      }]
    })
  },
  midi: {
    type: Object as PropType<{
      min: number
      max: number
    }>,
    default: () => ({min: 21, max: 108})
  },
  pitchNotation: {
    type: String, // Scientific Helmholtz None
    default: 'None'
  },
  intervalRuler: { // 音程尺
    type: Boolean,
    default: false
  },
  chordBox: { // 和弦滑块
    type: Boolean,
    default: false
  },
  group: { // 分组
    type: Boolean,
    default: false
  },
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
const blackKeyWidthNum = computed(() => whiteKeyWidthNum.value * props.blackKeyWidthRatio)
const blackKeyHeightNum = computed(() => containerHeightNum.value * props.blackKeyHeightRatio)

/** 计算内层总宽度（所有白键） */
const innerWidth = computed(() => {
  const totalWhite = whiteKeys.value.length
  return `${totalWhite * whiteKeyWidthNum.value}${keyUnit.value}`
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
  return `${whiteIndex * whiteKeyWidthNum.value}${keyUnit.value}`
}

/** 生成黑键 left 值（将黑键居中放在相邻两个白键之间） */
function leftForBlackByMidi(midi: number) {
  const beforeWhiteCount = whiteIndexBeforeMidi(midi) // number of white keys strictly before this midi
  // place at (beforeWhiteCount + 1) * whiteWidth - blackWidth/2  => between the white before and the next white
  const leftNum = (beforeWhiteCount) * whiteKeyWidthNum.value - (blackKeyWidthNum.value / 2)
  return `${leftNum}${keyUnit.value}`
}


/** 按键交互 */
const activeKeys = ref<Set<number>>(new Set())
const emits = defineEmits<{
  (e: 'keyDown', key: {
    midi: number
    black: boolean
    scientificNoteName: string[]
    helmholtzNoteName: string[]
  }): void
  (e: 'keyUp', key: {
    midi: number
    black: boolean
    scientificNoteName: string[]
    helmholtzNoteName: string[]
  }): void
}>()

function emitKey(type: 'keyUp' | 'keyDown', midi: number) {
  if (!activeKeys.value.has(midi) && type === 'keyDown') {
    activeKeys.value.add(midi)
  } else if (activeKeys.value.has(midi) && type === 'keyUp') {
    activeKeys.value.delete(midi)
  }
  // 抛出事件
  const keyInfo = {
    midi: midi,
    black: isBlackKey(midi),
    scientificNoteName: [noteNameToNoteString(midiToNoteName(midi, AccidentalEnum.Sharp)), noteNameToNoteString(midiToNoteName(midi, AccidentalEnum.Flat))],
    helmholtzNoteName: [noteNameToHelmholtz(midiToNoteName(midi, AccidentalEnum.Sharp)), noteNameToHelmholtz(midiToNoteName(midi, AccidentalEnum.Flat))],
  }
  if (type === 'keyDown') {
    emits('keyDown', keyInfo)
  } else {
    emits('keyUp', keyInfo)
  }
  // 这样写报错,但是并没有错误，ts bug
  // emits(type, keyInfo)
}

function handlePointerDown(event: PointerEvent, key: {
  midi: number
  black: boolean
  scientificNoteName: [string, string]
  helmholtzNoteName: [string, string]
}) {
  emitKey('keyDown', key.midi)
  const el = event.target as HTMLAnchorElement
  el.setPointerCapture(event.pointerId);

}

function handlePointerUp(event: PointerEvent, key: {
  midi: number
  black: boolean
  scientificNoteName: [string, string]
  helmholtzNoteName: [string, string]
}) {
  emitKey('keyUp', key.midi)
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
const groupNameStyle = computed((): (item: {
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
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
      bottom: 0,
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
    backgroundColor: 'white',
    boxShadow: '0px 0px 5px 2px rgba(200,200,200,1)',
    borderRadius: '10px',
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
  }
  return res
})
// 音程尺刻度样式
const intervalRulerTickStyle = computed((): (index: number) => CSSProperties => {
  return (index) => {
    const {value, unit} = parseAndFormatDimension(props.height)
    const res: CSSProperties = {
      width: '1px',
      height: index % 2 ? (value * 0.1 + unit) : (value * 0.07 + unit),
      backgroundColor: '#111',
    }
    return res
  }

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
    alignItems: 'center',

  }
  return res
})
// 和弦滑块
const chordList = ref([
  // 三和弦 Triads
  {name: '大三和弦', keyList: [0, 4, 7]},      // Major
  {name: '小三和弦', keyList: [0, 3, 7]},      // Minor
  {name: '增三和弦', keyList: [0, 4, 8]},      // Augmented
  {name: '减三和弦', keyList: [0, 3, 6]},      // Diminished
  {name: '挂四和弦', keyList: [0, 5, 7]},      // Sus4
  {name: '挂二和弦', keyList: [0, 2, 7]},      // Sus2

  // 七和弦 Seventh Chords
  {name: '大七和弦', keyList: [0, 4, 7, 11]},         // Major 7 (maj7)
  {name: '属七和弦', keyList: [0, 4, 7, 10]},         // Dominant 7 (7)
  {name: '小七和弦', keyList: [0, 3, 7, 10]},         // Minor 7 (m7)
  {name: '半减七和弦', keyList: [0, 3, 6, 10]},       // Half-diminished 7 (m7♭5)
  {name: '减七和弦', keyList: [0, 3, 6, 9]},          // Fully diminished 7 (dim7)
  {name: '小大七和弦', keyList: [0, 3, 7, 11]},       // Minor Major 7 (mMaj7)
  {name: '增大七和弦', keyList: [0, 4, 8, 11]},       // Augmented Major 7 (augMaj7)
  {name: '增七和弦', keyList: [0, 4, 8, 10]},         // Augmented 7 (aug7)

  // 六和弦 Sixth Chords
  {name: '大六和弦', keyList: [0, 4, 7, 9]},          // Major 6 (6)
  {name: '小六和弦', keyList: [0, 3, 7, 9]},          // Minor 6 (m6)

  // 九和弦 Ninth Chords
  {name: '属九和弦', keyList: [0, 4, 7, 10, 14]},     // 9
  {name: '大九和弦', keyList: [0, 4, 7, 11, 14]},     // maj9
  {name: '小九和弦', keyList: [0, 3, 7, 10, 14]},     // m9

  // 十一和弦 Eleventh Chords
  {name: '属十一和弦', keyList: [0, 4, 7, 10, 14, 17]}, // 11
  {name: '小十一和弦', keyList: [0, 3, 7, 10, 14, 17]}, // m11
  {name: '大十一和弦', keyList: [0, 4, 7, 11, 14, 17]}, // maj11

  // 十三和弦 Thirteenth Chords
  {name: '属十三和弦', keyList: [0, 4, 7, 10, 14, 21]},  // 13
  {name: '小十三和弦', keyList: [0, 3, 7, 10, 14, 21]},  // m13
  {name: '大十三和弦', keyList: [0, 4, 7, 11, 14, 21]},  // maj13

  // 其他常见扩展与变化
  {name: 'sus4 加七', keyList: [0, 5, 7, 10]},         // 7sus4
  {name: 'sus2 加七', keyList: [0, 2, 7, 10]},         // 7sus2
  {name: '大七#11', keyList: [0, 4, 7, 11, 18]},       // maj7#11
  {name: '大七#5', keyList: [0, 4, 8, 11]},            // maj7#5
  {name: '属七b9', keyList: [0, 4, 7, 10, 13]},        // 7b9
  {name: '属七#9', keyList: [0, 4, 7, 10, 15]},        // 7#9
])
const chordBoxStyle = computed((): CSSProperties => {
  const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
  const whiteKeyWidth = props.whiteKeyWidth
  return {
    width: value * 5 + unit,
    height: value * 1 + unit,
    backgroundColor: 'white',
    boxShadow: '0px 0px 5px 2px rgba(200,200,200,1)',
    bottom: '0',
    borderRadius: '10px',
    position: 'absolute',
    display: 'flex'
  }


})
const curChord = ref({
  name: '大三和弦',
  keyList: [0, 4, 7]
})

const chordBoxRef = ref(null)
const curActiveChordMidi = ref<Set<number>>(new Set())

function chordBoxPointerDown(event: PointerEvent) {
  const el = event.target as HTMLElement
  el.setPointerCapture(event.pointerId)
  // 滑块距离左侧位置 TODO 因为这里的left只能是px,所以外部传入的值也必须px,否则计算出错
  const {value: left, unit} = parseAndFormatDimension(getComputedStyle(chordBoxRef.value).left)
  // 键盘起始midi
  const startMidi = props.midi.min
  // 起始midi固定唱名索引
  const solmizationIndex = startMidi % 12 // 比如21键起始9
  // 计算左侧未出现的已经经过的当前组的宽度，只计算白键
  const passWidth = {
    '0': 0,
    '1': 1,
    '2': 1,
    '3': 2,
    '4': 2,
    '5': 3,
    '6': 4,
    '7': 4,
    '8': 5,
    '9': 5,
    '10': 6,
    '11': 6
  }['' + solmizationIndex] * whiteKeyWidthNum.value
  // 当前琴键已经走过的八度
  const baseMidi = (Math.floor((left + passWidth) / (whiteKeyWidthNum.value * 7)) + Math.floor(startMidi / 12)) * 12// 比如21键,baseMidi=12

  // 每组对应位置相对增加点midi值
  const relativeMidiAdd = [{
    relativeMidi: 0,
    gte: 0,
    lt: whiteKeyWidthNum.value - blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 1,
    gte: whiteKeyWidthNum.value - blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value + blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 2,
    gte: whiteKeyWidthNum.value + blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 2 - blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 3,
    gte: whiteKeyWidthNum.value * 2 - blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 2 + blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 4,
    gte: whiteKeyWidthNum.value * 2 + blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 3
  }, {
    relativeMidi: 5,
    gte: whiteKeyWidthNum.value * 3,
    lt: whiteKeyWidthNum.value * 4 - blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 6,
    gte: whiteKeyWidthNum.value * 4 - blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 4 + blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 7,
    gte: whiteKeyWidthNum.value * 4 + blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 5 - blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 8,
    gte: whiteKeyWidthNum.value * 5 - blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 5 + blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 9,
    gte: whiteKeyWidthNum.value * 5 + blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 6 - blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 10,
    gte: whiteKeyWidthNum.value * 6 - blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 6 + blackKeyWidthNum.value / 2
  }, {
    relativeMidi: 11,
    gte: whiteKeyWidthNum.value * 6 + blackKeyWidthNum.value / 2,
    lt: whiteKeyWidthNum.value * 7
  }]
  let midiAdd = relativeMidiAdd.find((e) => {
    const relativeLeft = (left + passWidth) % (7 * whiteKeyWidthNum.value)
    if (relativeLeft >= e.gte && relativeLeft < e.lt) {
      return true
    }
  }).relativeMidi
  let midi = baseMidi + midiAdd

  // 特殊逻辑，如果当前钢琴以白键开始，但是原本左侧的0.5的黑键还会参与计算就会导致计算出错,这里进行修正
  if (midi < startMidi) {
    midi = startMidi
  }

  // 高亮和弦对应琴键
  curChord.value.keyList.forEach(key => {

    curActiveChordMidi.value.add(key + midi)
    emitKey('keyDown', key + midi)
  })
}


function chordBoxPointerUp(event: PointerEvent,) {

  const el = event.currentTarget as HTMLElement
  el.releasePointerCapture(event.pointerId)
  curActiveChordMidi.value.forEach((midi => {
    emitKey('keyUp', midi)
  }))
  curActiveChordMidi.value.clear()
}

// 键盘事件

onMounted(() => {
  document.addEventListener('keydown', e => {
    props.config.keyboard.forEach(key => {
      if (e.code === key.code) {
        emitKey('keyDown', key.midi)
      }
    })
  })
  document.addEventListener('keyup', e => {
    props.config.keyboard.forEach(key => {
      if (e.code === key.code) {
        emitKey('keyUp', key.midi)
      }
    })
  })
})
</script>

<template>
  <div :style="pianoContainerStyle" class="ds-piano-container hide-scrollbar stack">

    <div class="stackItem" comment="白键和黑键">
      <!-- 白键（绝对定位） -->
      <div
          v-for="wk in whiteKeys"
          :key="wk.midi"
          :class="{ active: isKeyActive(wk.midi) }"
          :style="{
          width: props.whiteKeyWidth,
          height: '100%',
          position: 'absolute',
          left: leftForWhiteByIndex(wk.whiteIndex)
        }"
          class="white-key"
          @pointerdown="handlePointerDown($event, wk)"
          @pointerup="handlePointerUp($event,wk)"
      >
        <div class="noteName" v-show="pitchNotation !== 'None'">{{
            pitchNotation === 'Scientific' ? noteNameToNoteString(midiToNoteName(wk.midi, AccidentalEnum.Sharp)) : noteNameToHelmholtz(midiToNoteName(wk.midi, AccidentalEnum.Sharp))
          }}
        </div>
      </div>
      <template>
      </template>
      <!-- 黑键（绝对定位） -->
      <div
          v-for="bk in blackKeys"
          :key="bk.midi"
          :class="{ active: isKeyActive(bk.midi) }"
          :style="{
          width: blackKeyWidthNum + keyUnit,
          height: blackKeyHeightNum + keyUnit,
          left: leftForBlackByMidi(bk.midi),
        }"
          class="black-key"
          @pointerdown="handlePointerDown($event,bk)"
          @pointerup="handlePointerUp($event,bk)"
      >
        <div class="noteNameSharp" v-show="pitchNotation !== 'None'">
          {{ pitchNotation === 'Scientific' ? bk.scientificNoteName[0] : bk.helmholtzNoteName[0] }}
        </div>
        <div class="noteNameFlat" v-show="pitchNotation !== 'None'">
          {{ pitchNotation === 'Scientific' ? bk.scientificNoteName[1] : bk.helmholtzNoteName[1] }}
        </div>
      </div>
    </div>
    <div v-show="group" class="stackItem group" comment="分组遮罩">
      <div v-for="item in groupMaskList" :key="item.groupName" :style="groupStyle(item)"></div>
    </div>
    <!--  这里移动端拖动有问题，以后再说吧      -->
    <div :style="{height:0,zIndex:100}" class="stackItem " comment="滑块功能层">
      <div v-show="group" class="groupName"
           :style="{pointerEvents:'none',height: containerHeightNum * 0.2 + containerHeightUnit}">
        <div v-for="item in groupMaskList" :key="item.groupName" :style="groupNameStyle(item)">{{
            item.groupName
          }}
        </div>
      </div>
      <div v-show="intervalRuler" v-drag="{ enabled: true, axis: 'x', limit: true }" :style="intervalRulerStyle"
           comment="音程尺">
        <div v-for="(item,index) in intervalRulerData" :style="intervalRulerItemStyle">
          <div></div>
          <div :style="{writingMode:'vertical-rl'}">{{ item.name }}</div>
          <div style="display: flex;justify-content: center;align-items: flex-end">
            <div :style="intervalRulerTickStyle(index)"></div>
          </div>
        </div>
      </div>
      <div v-show="chordBox" ref="chordBoxRef" v-drag="{ enabled: true, axis: 'x', limit: true }"
           :style="chordBoxStyle"
           comment="和弦滑块">
        <select v-model="curChord">
          <option v-for="item in chordList" :label="item.name" :value="item"></option>
        </select>
        <!--            拖拽指令会设置pointerCaputre导致外部的pointerup不会触发，所以加.stop    -->
        <button style="pointer-events: auto" @pointerup="chordBoxPointerUp($event)"
                @pointerdown.stop="chordBoxPointerDown($event)">叩
        </button>
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

.groupName {
  display: flex;
  position: absolute;
  bottom: 0;
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
