<script lang="ts" setup>
/**
 * bpm 基准拍音符符号（五线符头/符干/符尾），样式对齐谱音同步 SimpleNote。
 * 用皮肤原始几何拼装，再整体 scale，保证符头与符干接合正确。
 */
import {computed} from 'vue'
import {
  StandardStaffSkinKeyEnum,
  applySkinContentTemplate,
  defaultSkin,
  getNoteHeadSkinKey,
  getNoteTailSkinKey,
  type SkinItem,
} from '@deciphony/renderer'
import {beatUnitToChronaxie, normalizeBeatUnit} from '../beatUnit'

const STEM_H = 22
/** 相对皮肤原始尺寸整体缩小 */
const SCALE = 0.62

const props = withDefaults(
  defineProps<{
    beatUnit?: number
    /** 展示行高（px），符头在此高度内垂直居中 */
    height?: number
  }>(),
  {
    beatUnit: 4,
    height: 24,
  },
)

const chronaxie = computed(() => beatUnitToChronaxie(normalizeBeatUnit(props.beatUnit)))
const isWhole = computed(() => chronaxie.value >= 256)
const staffPack = defaultSkin.standardStaff as Record<string, SkinItem | undefined>

function skinHtml(item: SkinItem | undefined, w: number, h: number): string {
  if (!item?.content) return ''
  let html = applySkinContentTemplate(item.content, {w, h})
  if (/<svg[\s>]/i.test(html)) {
    html = html.replace(
      /<svg([^>]*)>/i,
      (_, attrs) => `<svg${attrs} style="width:${w}px;height:${h}px;display:block">`,
    )
  } else {
    html = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="width:${w}px;height:${h}px;display:block;overflow:visible">${html}</svg>`
  }
  return html
}

const headItem = computed(() => staffPack[getNoteHeadSkinKey(chronaxie.value)])
const stemItem = computed(() => staffPack[StandardStaffSkinKeyEnum.NoteStem])
const tailItem = computed(() =>
  chronaxie.value < 64 ? staffPack[getNoteTailSkinKey(chronaxie.value, 'up')] : undefined,
)

const headW = computed(() => headItem.value?.w ?? 14)
const headH = computed(() => headItem.value?.h ?? 10)
const stemW = computed(() => stemItem.value?.w ?? 1)
const tailNativeW = computed(() => tailItem.value?.w ?? 10)
const tailNativeH = computed(() => tailItem.value?.h ?? 24)

/** 未缩放时的拼装框尺寸 */
const nativeW = computed(() => {
  if (isWhole.value) return headW.value
  return Math.max(headW.value + (tailItem.value ? tailNativeW.value * 0.4 : 0), 18)
})
const nativeH = computed(() => {
  if (isWhole.value) return headH.value
  return STEM_H + headH.value / 2
})

const boxW = computed(() => Math.ceil(nativeW.value * SCALE))
const boxH = computed(() => props.height)

const headHtml = computed(() => skinHtml(headItem.value, headW.value, headH.value))
const stemHtml = computed(() => {
  if (!stemItem.value || isWhole.value) return ''
  return skinHtml(stemItem.value, stemW.value, STEM_H)
})
const tailHtml = computed(() => {
  if (!tailItem.value) return ''
  return skinHtml(tailItem.value, tailNativeW.value, tailNativeH.value)
})

/** 原生坐标系：符头贴底（有符干时），全音符在 nativeH 内居中 */
const headY = computed(() =>
  isWhole.value ? (nativeH.value - headH.value) / 2 : nativeH.value - headH.value,
)
const stemX = computed(() => headW.value - stemW.value)
const stemTop = computed(() => headY.value + headH.value / 2 - STEM_H)
const tailTop = computed(() => stemTop.value)

/** 缩放后内容在行高内垂直居中 */
const scaleOffsetY = computed(
  () => (props.height - nativeH.value * SCALE) / 2,
)
</script>

<template>
  <span
    class="beat-unit-glyph"
    :style="{width: `${boxW}px`, height: `${boxH}px`}"
  >
    <span
      class="beat-unit-glyph__scale"
      :style="{
        width: `${nativeW}px`,
        height: `${nativeH}px`,
        transform: `translateY(${scaleOffsetY}px) scale(${SCALE})`,
      }"
    >
      <span
        v-if="headHtml"
        class="beat-unit-glyph__abs"
        :style="{left: '0', top: `${headY}px`}"
        v-html="headHtml"
      />
      <span
        v-if="stemHtml"
        class="beat-unit-glyph__abs"
        :style="{left: `${stemX}px`, top: `${stemTop}px`}"
        v-html="stemHtml"
      />
      <span
        v-if="tailHtml"
        class="beat-unit-glyph__abs"
        :style="{left: `${stemX}px`, top: `${tailTop}px`}"
        v-html="tailHtml"
      />
    </span>
  </span>
</template>

<style scoped>
.beat-unit-glyph {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  overflow: visible;
  color: #303133;
  flex-shrink: 0;
}

.beat-unit-glyph__scale {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: top left;
}

.beat-unit-glyph :deep(path),
.beat-unit-glyph :deep(ellipse),
.beat-unit-glyph :deep(circle),
.beat-unit-glyph :deep(rect) {
  fill: currentColor;
  stroke: currentColor;
}

.beat-unit-glyph__abs {
  position: absolute;
  line-height: 0;
}
</style>
