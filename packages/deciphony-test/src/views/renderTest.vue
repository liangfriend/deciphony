<template>
  <music-score ref="msRef" :skin="{red:redSkin}" music-score=""></music-score>
</template>
<script lang="ts" setup>
import {ref, onMounted} from 'vue'
import MusicScore from "deciphony-renderer";
import {redSkin} from '../test/redSkin'

const msRef = ref(null)
onMounted(() => {
  msRef.value.updateVDom((vdom) => {
    console.log('chicken', vdom)
    vdom[9].skinName = 'red'
    return vdom
  })
})

</script>