<script lang="ts" setup>
import {computed} from 'vue'
import {VDom, Skin} from "@/types/common";

defineOptions({
  name: 'Group',
})

const props = defineProps<{
  node: VDom
  skin: Skin
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

type SkinItem = Skin[keyof Skin]

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
    :transform="`translate(${node.x}, ${node.y})`"
    v-html="(node.skinKey ? handleSkin(skin[node.skinKey], node) :'')"
  >

  </g>
</template>
