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
      v-html="node.tag ? handleSkin(skin[node.tag],node): ''"
  >

  </g>
</template>
