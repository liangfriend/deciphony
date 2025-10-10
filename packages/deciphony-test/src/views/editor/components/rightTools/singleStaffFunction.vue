<script setup lang="ts">


import {PropType, UnwrapRef} from "vue";
import {

  MusicScore,
  SingleStaff
} from "deciphony-core";
import {
  singleStaffTemplate
} from "deciphony-core";
import {
  addSingleStaff,
  removeSingleStaff
} from "deciphony-core";
import type {MusicScoreRef} from "deciphony-renderer";

const props = defineProps({
  singleStaff: {
    type: Object as PropType<SingleStaff>,
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

function handleRightToolsBtn(key: String, singleStaff: SingleStaff, musicScore: MusicScore) {
  switch (key) {
    case 'insertBefore': {
      const newSingleStaff = singleStaffTemplate({})
      if (!singleStaff) return console.error("缺乏定位元素，单谱表添加失败")
      addSingleStaff(newSingleStaff, singleStaff, props.musicScore, 'before')
      break
    }
    case 'insertAfter': {
      const newSingleStaff = singleStaffTemplate({})
      if (!singleStaff) return console.error("缺乏定位元素，单谱表添加失败")
      addSingleStaff(newSingleStaff, singleStaff, props.musicScore, 'after')
      break
    }
    case 'delete':
      removeSingleStaff(singleStaff, props.musicScore)
      break;

  }


}
</script>

<template>
  <div>
    <el-button @click="handleRightToolsBtn('insertBefore',singleStaff,musicScore)"
    >
      向前插入单谱表
    </el-button>
    <el-button @click="handleRightToolsBtn('insertAfter',singleStaff,musicScore)"
    >
      向后插入单谱表
    </el-button>
    <el-button @click="handleRightToolsBtn('delete',singleStaff,musicScore)"
    >
      删除单谱表
    </el-button>
  </div>
</template>

<style scoped>

</style>
