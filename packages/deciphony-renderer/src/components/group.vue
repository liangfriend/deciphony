<script lang="ts" setup>
import {computed} from 'vue'
import {Skin, SkinItem, SkinPack, VDom} from "@/types/common";
import {MusicScoreTypeEnum} from "@/enums/musicScoreEnum";
import {defaultSkin} from "@/skins/defaultSkin";
import {vdomOuterTransform, vdomScaleTransform} from "@/render/vdomScale";
import {PIXEL_SNAP_TAGS, snapToDevicePixel} from "@/render/pixelSnap";
import {applySkinContentTemplate} from "@/render/skinContent";
import {resolveLayoutNotationPack} from "@/render/resolveNotation";
import {EMPTY_SKIN_ITEM, EMPTY_SKIN_SIZE} from "@/skins/emptySkin";

defineOptions({
  name: 'Group',
})

const props = defineProps<{
  node: VDom
  /** 曲谱模式：五线谱 / 简谱 / 吉他谱等，决定使用 SkinPack 中哪一套符号皮肤 */
  notationType?: MusicScoreTypeEnum
  /** 多套皮肤包：skinName -> SkinPack；skinName=default 或未找到时使用内置 defaultSkin */
  skin?: Skin
  /** 父级已 translate(node.x, node.y)（附属 g）：只保留缩放，不再平移 */
  local?: boolean
}>()

const comment = computed(() => {
  const {tag, slotName, dataComment} = props.node
  if (dataComment) return dataComment
  if (tag === 'slot' && slotName) return slotName
  switch (tag) {
    case 'grandStaff':
      return '复谱表'
    case 'singleStaff':
      return '单谱表'
    case 'measure':
      return '小节'
    case 'noteHead':
      return '音符头'
    case 'rest':
      return '休止符'
    case 'clef_f':
      return '前置谱号'
    case 'clef_b':
      return '后置谱号'
    case 'keySignature_f':
      return '前置调号'
    case 'keySignature_b':
      return '后置调号'
    case 'timeSignature_f':
      return '前置拍号'
    case 'timeSignature_b':
      return '后置拍号'
    case 'barline_f':
      return '前置小节线'
    case 'barline_b':
      return '后置小节线'
    case 'linked_barline':
      return '连谱小节线'
    case 'close_line':
      return '闭合线'
    case 'linked_close_line':
      return '连谱闭合线'
    case 'bracket':
      return '连谱号'
    case 'repeat_f':
      return '小节前反复'
    case 'repeat_b':
      return '小节末反复'
    case 'noteStem':
      return '符干'
    case 'noteTail':
      return '符尾'
    case 'space':
      return '空白'
    default:
      return ''
  }
})

const skinPack = computed<SkinPack>(() => {
  const name = props.node.skinName ?? 'default'
  return props.skin?.[name] ?? defaultSkin
})

/** 与排版一致：皮肤包缺整套谱种符号时回落内置默认 */
const notationPack = computed(() => (
  resolveLayoutNotationPack(skinPack.value, props.notationType ?? MusicScoreTypeEnum.StandardStaff) as unknown as Record<string, SkinItem>
))

/** 有 skinKey 但皮肤包里没有：画内置 empty 占位 */
const skinMissing = computed(() => !!props.node.skinKey && !notationPack.value[props.node.skinKey])

const outerTransform = computed(() => {
  if (props.local) return vdomScaleTransform(props.node)
  return PIXEL_SNAP_TAGS.has(props.node.tag)
    ? vdomOuterTransform(props.node, snapToDevicePixel)
    : vdomOuterTransform(props.node)
})

const SVG_TAGS_WITH_TARGET_ID = /^(g|text|svg|path|rect|circle|line|polyline|polygon|ellipse|tspan)$/i

const handleSkin = computed(() => {
  return (skinItem: SkinItem | undefined, node: VDom) => {
    if (!skinItem) return ''
    let temp = applySkinContentTemplate(skinItem.content, node)
    // 内嵌 svg 只认 width/height 属性（CSS 宽高不生效）：按节点尺寸覆盖，viewBox 内容随之缩放
    temp = temp.replace(/<svg([^>]*)>/i, (_, attrs: string) => {
      const rest = attrs.replace(/\s(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      return `<svg${rest} width="${node.w}" height="${node.h}" style="display:block">`
    })
    const targetId = node.targetId ?? ''
    const escapedId = String(targetId).replace(/"/g, '&quot;')
    temp = temp.replace(/<(\w+)(\s[^>]*?)?(\/?>)/g, (_, tagName, rest = '', closing) => {
      if (!SVG_TAGS_WITH_TARGET_ID.test(tagName)) {
        return `<${tagName}${rest}${closing}`
      }
      return `<${tagName}${rest} data-target-id="${escapedId}"${closing}`
    })
    return temp
  }
})

const skinHtml = computed(() => {
  const {node} = props
  if (!node.skinKey) return ''
  if (!skinMissing.value) return handleSkin.value(notationPack.value[node.skinKey], node)
  // 排版时就没查到皮肤的节点尺寸为 0，按占位尺寸画
  return handleSkin.value(EMPTY_SKIN_ITEM, {
    ...node,
    w: node.w > 0 ? node.w : EMPTY_SKIN_SIZE.w,
    h: node.h > 0 ? node.h : EMPTY_SKIN_SIZE.h,
  })
})

/** 减时线：多段水平线首尾相接，关掉抗锯齿后接缝处按像素中心归属一边，不发白也不发深 */
const shapeRendering = computed(() => (
  /^reduceLine_\d$/.test(String(props.node.skinKey ?? '')) ? 'crispEdges' : undefined
))

const knockoutMaskId = `dr-knockout-${++knockoutMaskSeq}`

/** 挖空矩形：外层 translate 做了像素吸附时补回吸附误差，断口才对得上数字 */
const knockoutRects = computed(() => {
  const list = props.node.knockouts
  if (!list?.length) return null
  const {x, y} = props.node
  const snapped = !props.local && PIXEL_SNAP_TAGS.has(props.node.tag)
  const dx = snapped ? x - snapToDevicePixel(x) : 0
  const dy = snapped ? y - snapToDevicePixel(y) : 0
  return list.map((k) => ({x: k.x + dx, y: k.y + dy, w: k.w, h: k.h}))
})
</script>

<script lang="ts">
let knockoutMaskSeq = 0
</script>

<template>
  <g
      v-if="knockoutRects"
      :data-comment="comment"
      :data-skin-missing="skinMissing ? node.skinKey : undefined"
      :data-slot-name="node.slotName"
      :data-tag="node.tag"
      :data-target-id="node.targetId"
      :transform="outerTransform"
  >
    <mask
        :id="knockoutMaskId"
        maskUnits="userSpaceOnUse"
        :x="-node.w"
        :y="-node.h"
        :width="node.w * 3"
        :height="node.h * 3"
    >
      <rect :x="-node.w" :y="-node.h" :width="node.w * 3" :height="node.h * 3" fill="white"/>
      <rect
          v-for="(k, i) in knockoutRects"
          :key="i"
          :x="k.x"
          :y="k.y"
          :width="k.w"
          :height="k.h"
          fill="black"
      />
    </mask>
    <g :mask="`url(#${knockoutMaskId})`" v-html="skinHtml"/>
  </g>
  <g
      v-else
      :data-comment="comment"
      :data-skin-missing="skinMissing ? node.skinKey : undefined"
      :data-slot-name="node.slotName"
      :data-tag="node.tag"
      :data-target-id="node.targetId"
      :transform="outerTransform"
      :shape-rendering="shapeRendering"
      v-html="skinHtml"
  />

</template>
