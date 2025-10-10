<script setup lang="ts">

import {computed, PropType, ref, UnwrapRef} from "vue";
import {MusicScore} from "deciphony-core";
import {
  ChronaxieEnum,
  MsSymbolTypeEnum,
  ReserveMsSymbolType
} from "deciphony-core";
import {msSymbolTemplate} from "deciphony-core";
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
  currentResevedType: {
    type: Object as PropType<ReserveMsSymbolType>,
    required: true
  },
})
const emits = defineEmits(["changeCurrentReservedType"])
const noteType = computed({
  get: () => {
    return props.currentResevedType === ReserveMsSymbolType.rest
  },
  set: (val) => {
    if (val) {
      emits("changeCurrentReservedType", ReserveMsSymbolType.rest)

    } else {
      emits("changeCurrentReservedType", ReserveMsSymbolType.note)
    }
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

// 改变预备音符
function changeReserveNote(chronaxie: ChronaxieEnum) {
  const note = msSymbolTemplate({type: MsSymbolTypeEnum.NoteHead, chronaxie: chronaxie});
  props.msRef?.reserveMsSymbolMap?.set(ReserveMsSymbolType.note, note)
}

function changeReserveRest(chronaxie: ChronaxieEnum) {
  const rest = msSymbolTemplate({type: MsSymbolTypeEnum.Rest, chronaxie: chronaxie});
  props.msRef?.reserveMsSymbolMap?.set(ReserveMsSymbolType.rest, rest)
}

// 获取musicScore的预备符号时值
const curReserveChronaxie = computed(() => {
  const noteHead = props.msRef?.reserveMsSymbolMap?.get(props.currentResevedType)
  if (noteHead && 'chronaxie' in noteHead) {
    return noteHead.chronaxie
  }
  return null
})

</script>

<template>
  <div>音符
    <el-switch
        v-model="noteType"
        active-color="#13ce66"
        inactive-color="#ff4949">
    </el-switch>
    休止符
  </div>
  <div class="noteBoxContainer" v-if="currentResevedType === ReserveMsSymbolType.note">
    <div :class="{activeBox:curReserveChronaxie === item.chronaxie}"
         class="noteBox"
         @click="changeReserveNote(item.chronaxie)"
         v-for="(item,index) in noteList">
      {{ item.text }}
    </div>
  </div>
  <div class="noteBoxContainer" v-else-if="currentResevedType === ReserveMsSymbolType.rest">
    <div :class="{activeBox:curReserveChronaxie === item.chronaxie}"
         class="noteBox"
         @click="changeReserveRest(item.chronaxie)"
         v-for="(item,index) in noteList">
      {{ item.text }}
    </div>
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
