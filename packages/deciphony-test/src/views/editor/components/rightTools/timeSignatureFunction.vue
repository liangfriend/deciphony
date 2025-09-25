<script setup lang="ts">
import {getDataWithIndex} from "deciphony-core";
import {
  removeMsSymbolContainer
} from "deciphony-core";
import {PropType, UnwrapRef} from "vue";
import {
  MusicScore,
  TimeSignatureMsSymbol
} from "deciphony-core";
import type {MusicScoreRef} from "deciphony-renderer";


const props = defineProps({
  musicScore: {
    type: Object as PropType<MusicScore>,
    required: true
  },
  msRef: {
    type: Object as PropType<UnwrapRef<MusicScoreRef>>,
    required: true
  },
  timeSignature: {
    type: Object as PropType<TimeSignatureMsSymbol>,
    required: true
  }
})

function deleteClef() {
  const msSymbolContainer = getDataWithIndex(props.timeSignature.index, props.musicScore).msSymbolContainer
  if (!msSymbolContainer) {
    console.error("索引数据出错，拍号删除失败")
    return
  }
  removeMsSymbolContainer(msSymbolContainer, props.musicScore)
}
</script>

<template>
  <div>
    <el-button @click="deleteClef">删除</el-button>
  </div>
</template>

<style scoped>

</style>
