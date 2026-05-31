<script lang="ts" setup>
import {computed} from 'vue'
import {NumberNotationSkinPack, Skin, SkinItem, SkinPack, StandardStaffSkinPack, VDom} from "@/types/common";
import {MusicScoreTypeEnum} from "@/enums/musicScoreEnum";
import {defaultSkin} from "@/skins/defaultSkin";
import {vdomOuterTransform} from "@/render/vdomScale";
import {applySkinContentTemplate} from "@/render/skinContent";

defineOptions({
  name: 'Group',
})

const props = defineProps<{
  node: VDom
  /** 曲谱模式：五线谱用 standardStaff，简谱用 numberNotation */
  notationType?: MusicScoreTypeEnum
  /** 多套皮肤包：skinName -> SkinPack；skinName=default 或未找到时使用内置 defaultSkin */
  skin?: Skin
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

const notationPack = computed<StandardStaffSkinPack | NumberNotationSkinPack | undefined>(() => {
  const pack = skinPack.value
  return props.notationType === MusicScoreTypeEnum.NumberNotation ? pack.numberNotation : pack.standardStaff
})

const outerTransform = computed(() => vdomOuterTransform(props.node))

const handleSkin = computed(() => {
  return (skinItem: SkinItem | undefined, node: VDom) => {
    if (!skinItem) return ''
    let temp = applySkinContentTemplate(skinItem.content, node)
    temp = temp.replace(/<svg([^>]*)>/i, (_, attrs) => `<svg${attrs} style="width:${node.w}px;height:${node.h}px;display:block">`)
    const targetId = node.targetId ?? ''
    const escapedId = String(targetId).replace(/"/g, '&quot;')
    temp = temp.replace(/<(\w+)(\s[^>]*?)?(\/?>)/g, (_, tagName, rest = '', closing) =>
        `<${tagName}${rest} data-target-id="${escapedId}"${closing}`)
    return temp
  }
})
</script>

<template>
  <g
      :data-comment="comment"
      :data-slot-name="node.slotName"
      :data-tag="node.tag"
      :data-target-id="node.targetId"
      :transform="outerTransform"
      v-html="(node.skinKey && notationPack ? handleSkin((notationPack as Record<string, SkinItem>)[node.skinKey], node) : '')"
  />
</template>
