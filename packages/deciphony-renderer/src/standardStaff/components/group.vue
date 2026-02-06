<script lang="ts" setup>
import {computed} from 'vue'
import {VDom, Skin, SkinPack} from "@/types/common";
import {defaultSkin} from "@/skins/defaultSkin";

defineOptions({
  name: 'Group',
})

const props = defineProps<{
  node: VDom
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
    case 'note':
      return '音符'
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
    case 'barline':
      return '小节线'
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

type SkinItem = SkinPack[keyof SkinPack]

const handleSkin = computed(() => {
  return (skinItem: SkinItem | undefined, node: VDom) => {
    if (!skinItem) return ''
    let temp = skinItem.content
    temp = temp.replaceAll('node.w', '' + node.w).replaceAll('node.h', '' + node.h)
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
    :transform="`translate(${node.x}, ${node.y})`"
    v-html="(node.skinKey ? handleSkin(skinPack[node.skinKey], node) :'')"
  >

  </g>
</template>