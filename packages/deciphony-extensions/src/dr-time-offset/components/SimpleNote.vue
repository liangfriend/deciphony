<script lang="ts" setup>
/**
 * 用 renderer 默认皮肤拼装：符头 / 休止符 / 符干 / 符尾（全部朝上）。
 */
import {computed} from 'vue'
import {
  StandardStaffSkinKeyEnum,
  applySkinContentTemplate,
  defaultSkin,
  getNoteHeadSkinKey,
  getNoteTailSkinKey,
  getRestSkinKey,
  type SkinItem,
} from '@deciphony/renderer'
import {FLATTEN_LINE_GAP, FLATTEN_STEM_LENGTH} from '../constants'

const props = defineProps<{
  chronaxie: number
  regions: number[]
  isRest: boolean
  staffTop: number
}>()

const staffPack = defaultSkin.standardStaff as Record<string, SkinItem | undefined>

function regionY(region: number): number {
  const bottomLineY = props.staffTop + 4 * FLATTEN_LINE_GAP
  return bottomLineY - region * (FLATTEN_LINE_GAP / 2)
}

function skinHtml(item: SkinItem | undefined, w: number, h: number): string {
  if (!item?.content) return ''
  // 与 group.vue 一致：把模板里的 node.w/h 替换，并为嵌套 svg 写尺寸
  let html = applySkinContentTemplate(item.content, {w, h})
  html = html.replace(
    /<svg([^>]*)>/i,
    (_, attrs) => `<svg${attrs} style="width:${w}px;height:${h}px;display:block">`,
  )
  return html
}

const noteYs = computed(() =>
  props.isRest ? [] : props.regions.map((r) => regionY(r)),
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
</script>

<template>
  <g class="dr-to-note">
    <template v-if="isRest">
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
