<template>
  <music-score ref="msRef" music-score=""></music-score>
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

</script>