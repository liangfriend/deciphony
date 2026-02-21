<template>
  <music-score ref="msRef" :slot-config="{'g-r':{w:50}}" music-score="" skin-name="default"
               @pointerdown="handlePointerDown">
    <template #g>
      <rect></rect>
    </template>
  </music-score>
</template>
<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import MusicScore from "deciphony-renderer";

const msRef = ref(null)
onMounted(() => {
  msRef.value.updateVDom((vdom) => {
    // console.log('chicken', vdom)
    // vdom[9].skinName = 'red'
    return vdom
  })
})

function handlePointerDown(e) {

  const targetId = e.target.getAttribute('data-target-id')
  msRef.value.updateVDom((vdom) => {
    console.log('chicken', vdom)
    const target = vdom.forEach(item => {
      if (item.targetId === targetId) {
        item.skinName = 'red'
      } else {
        item.skinName = 'default'
      }
    })


    return vdom
  })
}

</script>