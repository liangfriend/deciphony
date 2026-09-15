<script lang="ts" setup>
/**
 * 展平谱音符：
 * - staff：五线符头/符干/符尾（defaultSkin.standardStaff）
 * - number：简谱数字 + 减时线 + 加时线 + 八度点（defaultSkin.numberNotation）
 */
import {computed} from 'vue'
import {
  MusicScoreTypeEnum,
  NumberNotationSkinKeyEnum,
  StandardStaffSkinKeyEnum,
  applySkinContentTemplate,
  defaultSkin,
  getNoteHeadSkinKey,
  getNoteTailSkinKey,
  getReduceLineSkinKey,
  getRestSkinKey,
  getSyllableSkinKey,
  type SkinItem,
} from '@deciphony/renderer'
import {FLATTEN_LINE_GAP, FLATTEN_STEM_LENGTH} from '../constants'

/** 四分时值（与 renderer QUARTER_CHRONAXIE 一致） */
const QUARTER_CHRONAXIE = 64
/** 谱音同步用超短加时线宽（仅区分二分 / 全音符） */
const ADD_LINE_SHORT_W = 4
const ADD_LINE_GAP = 2
const ADD_LINE_PAD = 2

const props = withDefaults(
  defineProps<{
    chronaxie: number
    regions: number[]
    isRest: boolean
    staffTop: number
    /** 曲谱类型；简谱用 numberNotation 皮肤数字 */
    scoreType?: MusicScoreTypeEnum
    syllables?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X'>
    octaveDots?: number[]
  }>(),
  {
    scoreType: MusicScoreTypeEnum.StandardStaff,
    syllables: () => [],
    octaveDots: () => [],
  },
)

const isNumber = computed(
  () => props.scoreType === MusicScoreTypeEnum.NumberNotation,
)

const staffPack = defaultSkin.standardStaff as Record<string, SkinItem | undefined>
const numberPack = defaultSkin.numberNotation as Record<string, SkinItem | undefined>

function regionY(region: number): number {
  const bottomLineY = props.staffTop + 4 * FLATTEN_LINE_GAP
  return bottomLineY - region * (FLATTEN_LINE_GAP / 2)
}

function skinHtml(item: SkinItem | undefined, w: number, h: number): string {
  if (!item?.content) return ''
  let html = applySkinContentTemplate(item.content, {w, h})
  html = html.replace(
    /<svg([^>]*)>/i,
    (_, attrs) => `<svg${attrs} style="width:${w}px;height:${h}px;display:block">`,
  )
  return html
}

// —— 五线 ——
const noteYs = computed(() =>
  props.isRest || isNumber.value ? [] : props.regions.map((r) => regionY(r)),
)

const headItem = computed(() => staffPack[getNoteHeadSkinKey(props.chronaxie)])
const restItem = computed(() => staffPack[getRestSkinKey(props.chronaxie)])
const stemItem = computed(() => staffPack[StandardStaffSkinKeyEnum.NoteStem])
const tailItem = computed(() =>
  props.chronaxie < 64 ? staffPack[getNoteTailSkinKey(props.chronaxie, 'up')] : undefined,
)

const headW = computed(() => headItem.value?.w ?? 14)
const headH = computed(() => headItem.value?.h ?? 10)

const extremeY = computed(() => {
  if (!noteYs.value.length) return regionY(4)
  return Math.min(...noteYs.value)
})
const lowestY = computed(() => {
  if (!noteYs.value.length) return regionY(4)
  return Math.max(...noteYs.value)
})

const stemH = computed(() => FLATTEN_STEM_LENGTH + (lowestY.value - extremeY.value))
const stemX = computed(() => headW.value - (stemItem.value?.w ?? 1))
const stemTop = computed(() => extremeY.value - FLATTEN_STEM_LENGTH)

const restY = computed(() => {
  const h = restItem.value?.h ?? 20
  return props.staffTop + 2 * FLATTEN_LINE_GAP - h / 2
})

const headsHtml = computed(() => {
  const item = headItem.value
  if (!item) return []
  return noteYs.value.map((y) => ({
    y: y - headH.value / 2,
    html: skinHtml(item, headW.value, headH.value),
  }))
})

const restHtml = computed(() =>
  skinHtml(restItem.value, restItem.value?.w ?? 12, restItem.value?.h ?? 20),
)

const stemHtml = computed(() => {
  const item = stemItem.value
  if (!item || props.chronaxie >= 256) return ''
  return skinHtml(item, item.w || 1, stemH.value)
})

const tailHtml = computed(() => {
  const item = tailItem.value
  if (!item) return ''
  return skinHtml(item, item.w ?? 10, item.h ?? 24)
})

// —— 简谱 ——
const DIGIT_STACK_GAP = 4
const OCTAVE_DOT_GAP = 3

const numberCenterY = computed(() => props.staffTop + 2 * FLATTEN_LINE_GAP)

const numberGlyphs = computed(() => {
  if (!isNumber.value) return []
  const list = props.syllables.length
    ? props.syllables
    : props.isRest
      ? ([0] as const)
      : []
  const dots = props.octaveDots
  return list.map((syllable, i) => {
    const key = getSyllableSkinKey(syllable)
    const item = numberPack[key]
    const w = item?.w ?? 20
    const h = item?.h ?? 40
    return {
      html: skinHtml(item, w, h),
      w,
      h,
      octaveDot: dots[i] ?? 0,
    }
  })
})

const numberStack = computed(() => {
  const glyphs = numberGlyphs.value
  if (!glyphs.length) return []
  const totalH =
    glyphs.reduce((s, g) => s + g.h, 0) + DIGIT_STACK_GAP * Math.max(0, glyphs.length - 1)
  let y = numberCenterY.value - totalH / 2
  return glyphs.map((g) => {
    const top = y
    y += g.h + DIGIT_STACK_GAP
    return {...g, y: top}
  })
})

const reduceLineHtml = computed(() => {
  if (!isNumber.value || props.chronaxie >= 64) return ''
  const key = getReduceLineSkinKey(props.chronaxie)
  const item = numberPack[key]
  if (!item) return ''
  const w = Math.max(...numberGlyphs.value.map((g) => g.w), 20)
  return skinHtml(item, w, item.h ?? 10)
})

const reduceLineY = computed(() => {
  if (!numberStack.value.length) return numberCenterY.value + 20
  const last = numberStack.value[numberStack.value.length - 1]!
  return last.y + last.h + 2
})

/** 加时线条数：二分 1、全音符 2（与 getAddLineOnsetOffsets 无附点时一致） */
const addLineCount = computed(() => {
  if (!isNumber.value || props.chronaxie <= QUARTER_CHRONAXIE) return 0
  let n = 0
  for (let o = QUARTER_CHRONAXIE; o < props.chronaxie; o += QUARTER_CHRONAXIE) n++
  return n
})

const digitMaxW = computed(() =>
  Math.max(...numberGlyphs.value.map((g) => g.w), 20),
)

const addLineItem = computed(
  () => numberPack[NumberNotationSkinKeyEnum.Addline],
)

const addLineHtml = computed(() => {
  const item = addLineItem.value
  if (!item) return ''
  return skinHtml(item, ADD_LINE_SHORT_W, item.h ?? 4)
})

const addLineY = computed(() => {
  const h = addLineItem.value?.h ?? 4
  return numberCenterY.value - h / 2
})

const addLineXs = computed(() => {
  const count = addLineCount.value
  if (!count) return []
  const start = digitMaxW.value + ADD_LINE_PAD
  return Array.from({length: count}, (_, k) => start + k * (ADD_LINE_SHORT_W + ADD_LINE_GAP))
})

const octaveDotItem = computed(() => numberPack.octaveDot)
const octaveDotHtml = computed(() => {
  const item = octaveDotItem.value
  if (!item) return ''
  return skinHtml(item, item.w ?? 3, item.h ?? 3)
})
</script>

<template>
  <g class="dr-to-note">
    <!-- 简谱：defaultSkin.numberNotation 数字 -->
    <template v-if="isNumber">
      <g v-for="(g, i) in numberStack" :key="i" :transform="`translate(0, ${g.y})`">
        <g v-html="g.html"/>
        <!-- 高八度点：数字上方 -->
        <template v-if="g.octaveDot > 0 && octaveDotHtml">
          <g
            v-for="di in g.octaveDot"
            :key="`u${di}`"
            :transform="`translate(${g.w / 2 - 1.5}, ${-OCTAVE_DOT_GAP - (di - 1) * (3 + OCTAVE_DOT_GAP)})`"
            v-html="octaveDotHtml"
          />
        </template>
        <!-- 低八度点：数字下方（减时线之上） -->
        <template v-if="g.octaveDot < 0 && octaveDotHtml">
          <g
            v-for="di in -g.octaveDot"
            :key="`d${di}`"
            :transform="`translate(${g.w / 2 - 1.5}, ${g.h + OCTAVE_DOT_GAP + (di - 1) * (3 + OCTAVE_DOT_GAP)})`"
            v-html="octaveDotHtml"
          />
        </template>
      </g>
      <g
        v-if="reduceLineHtml"
        :transform="`translate(0, ${reduceLineY})`"
        v-html="reduceLineHtml"
      />
      <!-- 加时线：超短横杠，二分 1 条、全音符 2 条 -->
      <g
        v-for="(x, i) in addLineXs"
        :key="`add${i}`"
        :transform="`translate(${x}, ${addLineY})`"
        v-html="addLineHtml"
      />
    </template>

    <!-- 五线 -->
    <template v-else-if="isRest">
      <g :transform="`translate(0, ${restY})`" v-html="restHtml"/>
    </template>
    <template v-else>
      <g
        v-for="(h, i) in headsHtml"
        :key="i"
        :transform="`translate(0, ${h.y})`"
        v-html="h.html"
      />
      <g
        v-if="stemHtml"
        :transform="`translate(${stemX}, ${stemTop})`"
        v-html="stemHtml"
      />
      <g
        v-if="tailHtml"
        :transform="`translate(${stemX}, ${stemTop})`"
        v-html="tailHtml"
      />
    </template>
  </g>
</template>
