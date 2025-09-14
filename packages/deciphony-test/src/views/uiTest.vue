<script setup lang="ts">

import {onMounted, ref} from "vue";

const dsModelBoxRef = ref(null)

onMounted(() => {


})

function open() {
  dsModelBoxRef.value.modelRef.toggleEmission('hole1', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole2', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole3', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole4', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole5', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole6', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole7', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole8', true)
}

function close() {
  dsModelBoxRef.value.modelRef.toggleEmission('hole1', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole2', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole3', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole4', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole5', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole6', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole7', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole8', false)
}
</script>

<template>
  <button @click="open">亮灯</button>
  <button @click="close">关灯</button>
  <ds-model-box ref="dsModelBoxRef" name="magnifier"></ds-model-box>
</template>

<style scoped>

</style>