<script setup lang="ts">

import {computed, onMounted, PropType, ref, UnwrapRef, watch} from "vue";
import {
  MsSymbolContainer,
  MusicScore,
  Rest
} from "deciphony-core";
import {
  ChronaxieEnum, MsSymbolTypeEnum,
  SpanSymbolTypeEnum
} from "deciphony-core";
import {
  spanSymbolTemplate
} from "deciphony-core";
import {
  addSpanSymbol, changeRestChronaxie, removeMsSymbolContainer
} from "deciphony-core";
import {
  getDataWithIndex,
  getNext
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
  rest: {
    type: Object as PropType<Rest>,
    required: true
  }
})

function handleRightToolsBtn(key: String, musicScore: MusicScore) {
  switch (key) {
    case 'selectNote':
      break
  }
}


const noteList = ref([{
  text: '全音符',
  chronaxie: ChronaxieEnum.whole,
}, {
  text: '二分音符',
  chronaxie: ChronaxieEnum.half,
}, {
  text: '四分音符',
  chronaxie: ChronaxieEnum.quarter,
}, {
  text: '八分音符',
  chronaxie: ChronaxieEnum.eighth,
}, {
  text: '十六分音符',
  chronaxie: ChronaxieEnum.sixteenth,
},])
const noteType = ref(false)

// 改变预备音符
function changeChronaxie(chronaxie: ChronaxieEnum) {
  changeRestChronaxie(props.rest, chronaxie, props.musicScore)
}

function addSlur() {
  const startTargetId = props.rest.id

  const msSymbolContainer = getDataWithIndex(props.rest.index, props.musicScore).msSymbolContainer
  if (!msSymbolContainer) {
    console.error("索引数据出错，slur添加失败")
    return
  }
  const next = getNext(msSymbolContainer, props.musicScore, 1) as MsSymbolContainer
  // TODO 这里没有考虑多声部，暂时先写成0了
  const nextMsSymbol = next.msSymbolArray[0]
  if (next === msSymbolContainer || nextMsSymbol.type !== MsSymbolTypeEnum.Rest) {
    console.warn("当前音符已在小节末位，无法添加连音线")
    return
  }
  const endTargetId = nextMsSymbol.id
  const slur = spanSymbolTemplate({
    type: SpanSymbolTypeEnum.slur
    , endTargetId: endTargetId, startTargetId: startTargetId
  })
  if (!slur) return console.error('获取slur数据模版错误，spanSymbol添加失败')
  addSpanSymbol(slur, props.rest, nextMsSymbol, props.musicScore)
}

// 删除音符
function deleteNote() {
  const msSymbolContainer = getDataWithIndex(props.rest.index, props.musicScore).msSymbolContainer
  if (!msSymbolContainer) {
    console.error("索引数据出错，音符删除失败")
    return
  }
  removeMsSymbolContainer(msSymbolContainer, props.musicScore)
}

watch(() => props.rest, () => {
  init()
}, {
  deep: true
})

function init() {

}

const beamId = ref<number | null>(null)
onMounted(() => {
  init()
})
</script>

<template>

  <div class="noteBoxContainer">
    <div :class="{activeBox:rest.chronaxie === item.chronaxie}"
         class="noteBox"
         @click="changeChronaxie(item.chronaxie)"
         v-for="(item,index) in noteList">
      {{ item.text }}
    </div>
  </div>

  <div>
    <el-button @click="deleteNote">删除</el-button>
  </div>
</template>

<style scoped>
.noteBoxContainer {
  display: flex;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 10px;
}

.noteBox {
  width: 50px;
  height: 50px;
  border: 1px solid black;
  border-radius: 5px;
  font-size: 12px;
}

.activeBox {
  background-color: #FF7882;
}
</style>
