<script setup lang="ts">

import {computed, onMounted, PropType, ref, UnwrapRef, watch} from "vue";
import {
  MsSymbolContainer,
  MusicScore,
  NoteHead,
} from "deciphony-core";
import {
  AccidentalEnum,
  ChronaxieEnum, MsSymbolTypeEnum,
  SpanSymbolTypeEnum
} from "deciphony-core";
import {
  spanSymbolTemplate
} from "deciphony-core";
import {
  addSpanSymbol, changeAccidental,
  changeBeamId,
  changeNoteChronaxie, removeMsSymbolContainer
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
  noteHead: {
    type: Object as PropType<NoteHead>,
    required: true
  }
})

function handleRightToolsBtn(key: String, musicScore: MusicScore) {
  switch (key) {
    case 'selectNote':
      break
  }
}

const accidentalList = ref([{
  text: '无',
  accidental: null,
}, {
  text: '重升',
  accidental: AccidentalEnum.DoubleSharp
}, {
  text: '升',
  accidental: AccidentalEnum.Sharp
}, {
  text: '还原',
  accidental: AccidentalEnum.Natural
}, {
  text: '降',
  accidental: AccidentalEnum.Flat
}, {
  text: '重降',
  accidental: AccidentalEnum.DoubleFlat
},])
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
function changeNoteHeadChronaxie(chronaxie: ChronaxieEnum) {
  changeNoteChronaxie(props.noteHead, chronaxie, props.musicScore)
}

function updateAccidental(accidental: AccidentalEnum | null) {
  changeAccidental(props.noteHead, accidental, props.musicScore)
}

function updateBeamId() {
  if (beamId.value && beamId.value !== -1) {
    changeBeamId(beamId.value, props.noteHead, props.musicScore)
  }
}

function addSlur() {
  const startTargetId = props.noteHead.id

  const msSymbolContainer = getDataWithIndex(props.noteHead.index, props.musicScore).msSymbolContainer
  if (!msSymbolContainer) {
    console.error("索引数据出错，slur添加失败")
    return
  }
  const next = getNext(msSymbolContainer, props.musicScore, 1) as MsSymbolContainer
  // TODO 这里没有考虑多声部，暂时先写成0了
  const nextMsSymbol = next.msSymbolArray[0]
  if (next === msSymbolContainer || nextMsSymbol.type !== MsSymbolTypeEnum.NoteHead) {
    console.warn("当前音符已在小节末位，无法添加连音线")
    return
  }
  const endTargetId = nextMsSymbol.id
  const slur = spanSymbolTemplate({
    type: SpanSymbolTypeEnum.slur
    , endTargetId: endTargetId, startTargetId: startTargetId
  })
  if (!slur) return console.error('获取slur数据模版错误，spanSymbol添加失败')
  addSpanSymbol(slur, props.noteHead, nextMsSymbol, props.musicScore)
}

// 删除音符
function deleteNote() {
  const msSymbolContainer = getDataWithIndex(props.noteHead.index, props.musicScore).msSymbolContainer
  if (!msSymbolContainer) {
    console.error("索引数据出错，音符删除失败")
    return
  }
  removeMsSymbolContainer(msSymbolContainer, props.musicScore)
}

watch(() => props.noteHead, () => {
  init()
}, {
  deep: true
})

function init() {
  if (props.noteHead.beamId !== -1) {
    beamId.value = props.noteHead.beamId
  } else {
    beamId.value = null
  }
}

const beamId = ref<number | null>(null)
onMounted(() => {
  init()
})
</script>

<template>

  <div class="noteBoxContainer">
    <div :class="{activeBox:noteHead.chronaxie === item.chronaxie}"
         class="noteBox"
         @click="changeNoteHeadChronaxie(item.chronaxie)"
         v-for="(item,index) in noteList">
      {{ item.text }}
    </div>
  </div>
  <div class="noteBoxContainer">
    <div
        class="noteBox"
        @click="updateAccidental(item.accidental)"
        v-for="(item,index) in accidentalList">
      {{ item.text }}
    </div>
  </div>
  <template v-if="![ChronaxieEnum.whole,ChronaxieEnum.half,ChronaxieEnum.quarter]
  .includes(noteHead.chronaxie)">
    <div>
      连音组号
      <el-button @click="updateBeamId">更新</el-button>
    </div>
    <el-input v-model="beamId" type="number"></el-input>


  </template>
  <div>
    <el-button @click="addSlur">添加连音线</el-button>
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
