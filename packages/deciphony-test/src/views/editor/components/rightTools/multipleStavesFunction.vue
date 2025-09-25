<script setup lang="ts">

import {PropType, UnwrapRef} from "vue";
import {

  MultipleStaves,
  MusicScore,
} from "deciphony-core";
import {
  multipleStavesTemplate
} from "deciphony-core";
import {
  addMultipleStaves,
  removeMultipleStaves
} from "deciphony-core";
import type {MusicScoreRef} from "deciphony-renderer";

const props = defineProps({
  multipleStaves: {
    type: Object as PropType<MultipleStaves>,
    required: true
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    required: true
  },
  msRef: {
    type: Object as PropType<UnwrapRef<MusicScoreRef>>,
    required: true
  },
})

function handleRightToolsBtn(key: String, multipleStaves: MultipleStaves, musicScore: MusicScore) {
  switch (key) {
    case 'insertBefore': {
      const newMultipleStaves = multipleStavesTemplate({})
      if (!multipleStaves) return console.error("缺乏定位元素，复谱表添加失败")
      addMultipleStaves(newMultipleStaves, multipleStaves, musicScore, 'before')
      break
    }
    case 'insertAfter': {
      const newMultipleStaves = multipleStavesTemplate({})
      if (!multipleStaves) return console.error("缺乏定位元素，复谱表添加失败")
      addMultipleStaves(newMultipleStaves, multipleStaves, musicScore, 'after')
      break
    }
    case 'delete':
      removeMultipleStaves(multipleStaves, musicScore)
      break;

  }


}
</script>

<template>
  <div>
    <el-button @click="handleRightToolsBtn('insertBefore',multipleStaves,musicScore)"
    >
      向前插入复谱表
    </el-button>
    <el-button @click="handleRightToolsBtn('insertAfter',multipleStaves,musicScore)"
    >
      向后插入复谱表
    </el-button>
    <el-button @click="handleRightToolsBtn('delete',multipleStaves,musicScore)"
    >
      删除复谱表
    </el-button>
  </div>
</template>

<style scoped>

</style>
