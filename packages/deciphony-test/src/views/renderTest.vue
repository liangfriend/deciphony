<template>
  <music-score ref="msRef" :slot-config="{'g-r':{w:50}}" music-score="" skin-name="default"
               @pointerdown="handlePointerDown">
    <template #g-r>
      <text>插槽测试</text>
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
  console.log('chicken', e)
}

</script>