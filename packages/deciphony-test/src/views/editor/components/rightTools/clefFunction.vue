<script setup lang="ts">
import {getDataWithIndex} from "deciphony-core";
import {
  removeMsSymbolContainer
} from "deciphony-core";
import {PropType, UnwrapRef} from "vue";
import {
  ClefMsSymbol,
  MusicScore,
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
  clef: {
    type: Object as PropType<ClefMsSymbol>,
    required: true
  }
})

function deleteClef() {
  const msSymbolContainer = getDataWithIndex(props.clef.index, props.musicScore).msSymbolContainer
  if (!msSymbolContainer) {
    console.error("索引数据出错，谱号删除失败")
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
