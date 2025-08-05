<template>
  <div class="musicScore stack" :style="musicScoreStyle" ref="musicScoreRef" @mousedown.stop="handleMouseDown"
       @mousemove.stop="handleMouseMove" @mouseup.stop="handleMouseUp">

    <measure-container :disabled="false" :musicScoreData="musicScore" class="stackItem lineLayer"
                       :style="{width:width+'px',height:height+'px'}"
                       @multipleStavesMouseDown="handleMultipleStavesMouseDown"
                       @single-staff-mouse-down="handleSingleStaffMouseDown"
                       comment="谱线层">
      <template #default="{ measure, measureIndex, singleStaff, multipleStaves, measureWidth }">
        <measure
            :key="'measure'+measureIndex"
            :strokeWidth="strokeWidth"
            :x="measureIndex * measureWidth"
            :width="measureWidth"
            :height="musicScore.measureHeight"
            :componentWidth="width"
            @measureMouseDown="handleMeasureMouseDown"
            :componentHeight="height"
            :measure="measure"
        >
        </measure>
      </template>
    </measure-container>
    <!--    跨小节符号目前只有小节跟随型和符号（音符头）跟随型-->
    <span-symbol-vue :key="spanSymbol.vueKey"
                     :musicScore="musicScore"
                     v-for="(spanSymbol,spanSymbolIndex) in musicScore.spanSymbolArray"
                     :componentWidth="width"
                     :componentHeight="height"
                     @span-symbol-mouse-down="handleSpanSymbolMouseDown"
                     @spanSymbolMouseUp="handleSpanSymbolMouseUp"
                     :spanSymbol="spanSymbol"></span-symbol-vue>
    <measure-container :musicScoreData="musicScore" class="stackItem symbolLayer"
                       :style="{width:width+'px',height:height+'px', pointerEvents:'none'}"
                       comment="符号层">
      <template #default="{ measure, measureIndex, singleStaff, multipleStaves, measureWidth }">
        <ms-symbol-container v-for="(msSymbolContainer,symbolIndex) in measure.msSymbolContainerArray"
                             :msSymbolContainer="msSymbolContainer"
                             :nextContainer="measure.msSymbolContainerArray.length!==(symbolIndex+1)?
                             measure.msSymbolContainerArray[symbolIndex+1]:null"
                             :preContainer="measure.msSymbolContainerArray.length!==0?
                             measure.msSymbolContainerArray[symbolIndex-1]:null"
                             :measure="measure"
                             :musicScore="musicScore"
                             :measureWidth="measureWidth"
                             :singleStaff="singleStaff"
                             :multipleStaves="multipleStaves"
                             :measureHeight="musicScore.measureHeight"
                             @msSymbolMouseDown="handleMsSymbolMouseDown"
                             @msSymbolMousUp="handleMsSymbolMouseUp"
                             :key="'note-symbol'+symbolIndex"
                             :componentWidth="width"
                             :componentHeight="height"
        ></ms-symbol-container>
      </template>
    </measure-container>

    <measure-container v-show="mode === MsMode.edit" :musicScoreData="musicScore"
                       class="stackItem symbolLayer"
                       :style="{width:width+'px',height:height+'px', pointerEvents:'none'}"
                       comment="编辑模式虚拟音符层">
      <template
          #default="{ measure, measureIndex, singleStaff, multipleStaves, measureWidth }">
        <template v-if="currentSelected === measure">
          <virtual-symbol-container
              comment="第一个变宽容器"
              :msSymbolContainer="variableContainerArray(measure)[0]"
              :measure="measure"
              type="front"
              :musicScore="musicScore"
              :measureWidth="measureWidth"
              :singleStaff="singleStaff"
              :multipleStaves="multipleStaves"
              :measureHeight="musicScore.measureHeight"
              :componentWidth="width"
              :componentHeight="height"
          ></virtual-symbol-container>
          <virtual-symbol-container
              v-for="(msSymbolContainer,symbolIndex) in variableContainerArray(measure)"
              :msSymbolContainer="msSymbolContainer"
              :measure="measure"
              type="self"
              :musicScore="musicScore"
              :measureWidth="measureWidth"
              :ind="symbolIndex"
              :singleStaff="singleStaff"
              :multipleStaves="multipleStaves"
              :measureHeight="musicScore.measureHeight"
              :key="'virtual-symbol'+symbolIndex"
              :componentWidth="width"
              :componentHeight="height"
          ></virtual-symbol-container>
          <virtual-symbol-container
              v-for="(msSymbolContainer,symbolIndex) in variableContainerArray(measure)"

              :msSymbolContainer="msSymbolContainer"
              :measure="measure"
              :type="(symbolIndex === (variableContainerArray(measure).length - 1))?'end':'middle'"
              :musicScore="musicScore"
              :measureWidth="measureWidth"
              :ind="symbolIndex"
              :singleStaff="singleStaff"
              :multipleStaves="multipleStaves"
              :measureHeight="musicScore.measureHeight"
              :key="'virtual-symbol'+symbolIndex"
              :componentWidth="width"
              :componentHeight="height"
          ></virtual-symbol-container>
        </template>

      </template>
    </measure-container>

  </div>
</template>
<script setup lang="ts">
import measure from './components/measure.vue';
import {computed, onBeforeMount, onMounted, onUnmounted, type PropType, provide, Ref, ref} from 'vue';
import type {
  Measure,
  MsSymbol,
  MsType,
  MultipleStaves,
  MusicScore,
  SingleStaff,
  SpanSymbol
} from "deciphony-core/constant";
import MeasureContainer from "src/components/measureContainer.vue";

import MsSymbolContainer
  from "src/components/msSymbolContainer.vue";

import SpanSymbolVue from "src/components/spanSymbol.vue";
import {
  mapGenerate,
  setMultipleStavesIndex
} from "deciphony-core/utils/musicScoreDataUtil";
import {
  ChronaxieEnum,
  MsMode,
  MsSymbolContainerTypeEnum,
  MsSymbolTypeEnum,
  ReserveMsSymbolType,
} from "deciphony-core/musicScoreEnum";
import {
  eventConstant,
  handleMouseMoveSelected,
  measureMouseDown,
  msSymbolMouseDown,
  msSymbolMouseUp,
  multipleStavesMouseDown,
  singleStaffMouseDown,
  spanSymbolMouseDown,
  spanSymbolMouseUp
} from "./utils/eventUtil";
import VirtualSymbolContainer
  from "src/components/virtualSymbolContainer.vue";
import {msSymbolTemplate} from "deciphony-core/utils/objectTemplateUtil";
import {ReserveMsSymbolMapType} from "../types";


const props = defineProps({
  musicScore: {
    type: Object as PropType<MusicScore>,
    required: true,
  },
  width: {
    type: Number,
    default: 1000,
  },
  height: {
    type: Number,
    default: 800,
  },
  //小节的线条宽度
  strokeWidth: {
    type: Number,
    default: 1
  },

});
// 是否与其它音连成组
const isGroup = computed(() => {
  return (measure: Measure): boolean[] => {
    const arr: boolean[] = [];

    measure.msSymbolContainerArray.forEach((container) => {
      let grouped = false;

      for (const symbol of container.msSymbolArray) {
        if (symbol.type === MsSymbolTypeEnum.noteHead) {
          // symbol 为 NoteHead 类型，有 chronaxie 属性
          if (
              symbol.chronaxie === ChronaxieEnum.eighth ||
              symbol.chronaxie === ChronaxieEnum.sixteenth
          ) {
            grouped = true;
            break; // 有一个就够，认为成组
          }
        }
      }

      arr.push(grouped); // 只要有符合的 noteHead 就是 true，否则 false
    });

    return arr;
  };
});
const mode = ref(MsMode.edit)

// 预备符号
const reserveMsSymbolMap = ref(new Map()) as Ref<ReserveMsSymbolMapType>;
// spanSymbol快速索引对象
// 当前选择对象
const currentSelected = ref<MsType | null>(null)


function initReserveMsSymbolMap() {
  const note = msSymbolTemplate({type: MsSymbolTypeEnum.noteHead, chronaxie: ChronaxieEnum.quarter})
  const rest = msSymbolTemplate({type: MsSymbolTypeEnum.rest, chronaxie: ChronaxieEnum.quarter})
  reserveMsSymbolMap.value.set(ReserveMsSymbolType.note, note);
  reserveMsSymbolMap.value.set(ReserveMsSymbolType.rest, rest);

}

function setReserveMsSymbol(key: ReserveMsSymbolType, msData: MsType) {
  reserveMsSymbolMap.value.set(key, msData);
}

function getReserveMsSymbol(key: ReserveMsSymbolType): MsType | null {
  if (reserveMsSymbolMap.value.has(key)) {
    return reserveMsSymbolMap.value.get(key)!;
  }
  return null
}

const currentResevedType = ref(ReserveMsSymbolType.note) // 当前预备符号类型
function setCurrentResevedType(value: ReserveMsSymbolType) {
  currentResevedType.value = value;
}

// 变宽符号容器
const variableContainerArray = computed(() => {
  return (measure: Measure) => {
    return measure.msSymbolContainerArray.filter(e => {
      return e.type === MsSymbolContainerTypeEnum.variable
    })
  }
})
const emits = defineEmits(['spanSymbolMouseDown', 'spanSymbolMouseUp', 'msSymbolMouseDown', 'measureMouseDown', 'singleStaffMouseDown', 'multipleStavesMouseDown', 'update:mode', 'msSymbolMouseUp'])

function handleSpanSymbolMouseDown(e: MouseEvent, spanSymbol: SpanSymbol) {
  spanSymbolMouseDown(e, mode, currentSelected, spanSymbol);
  emits('spanSymbolMouseDown')
}

function handleSpanSymbolMouseUp(e: MouseEvent, spanSymbol: SpanSymbol) {
  spanSymbolMouseUp(e, mode, currentSelected, spanSymbol);
  emits('spanSymbolMouseUp')
}

function handleMsSymbolMouseDown(e: MouseEvent, msSymbol: MsSymbol) {
  msSymbolMouseDown(e, mode, currentSelected, msSymbol);
  emits('msSymbolMouseDown')
}

function handleMsSymbolMouseUp(e: MouseEvent, msSymbol: MsSymbol) {
  msSymbolMouseUp(e, mode, currentSelected, msSymbol);
  emits('msSymbolMouseUp')
}

function handleMeasureMouseDown(e: MouseEvent, measure: Measure) {
  measureMouseDown(e, mode, currentSelected, measure);
  emits('measureMouseDown')
}

function handleSingleStaffMouseDown(e: MouseEvent, singleStaff: SingleStaff) {
  singleStaffMouseDown(e, mode, currentSelected, singleStaff)
  emits('singleStaffMouseDown')
}

function handleMultipleStavesMouseDown(e: MouseEvent, multipleStaves: MultipleStaves) {
  multipleStavesMouseDown(e, mode, currentSelected, multipleStaves)
  emits('multipleStavesMouseDown')
}

// 切换模式
function changeMode(newMode: MsMode) {
  mode.value = newMode
}

const musicScoreStyle = computed(() => {
  return {
    width: props.width + 'px',
    height: props.height + 'px',
    overflow: 'visible',
  };
});

function beforeMount() {

  // 索引生成
  setMultipleStavesIndex(props.musicScore)
  // 初始化预备音符
  initReserveMsSymbolMap()
  // 遍历生成hashMap方便快速查找
  mapGenerate(props.musicScore)
  // window.musicScore = props.musicScore
}


onBeforeMount(beforeMount)
const musicScoreRef = ref<HTMLElement>(null!)

const downLock = ref(false) // 鼠标按下锁，鼠标抬起解锁
function handleMouseDown(e: MouseEvent) {
  e.preventDefault(); // 默认行为会导致msSymbol拖拽事件出现鼠标禁用状态，原因不明
  eventConstant.startX = e.clientX;
  eventConstant.startY = e.clientY;
  downLock.value = true
}

function handleMouseUp(e: MouseEvent) {
  eventConstant.startX = 0
  eventConstant.startY = 0
  downLock.value = false
}

function handleMouseMove(e: MouseEvent) {
  if (downLock.value) {
    handleMouseMoveSelected(e, props.musicScore?.measureHeight, currentSelected, props.musicScore)
  }
}

function cancelSelect() {
  if (currentSelected.value) {
    currentSelected.value.options.highlight = false
  }
  currentSelected.value = null
}

onMounted(() => {
  // 生成map

})
// onMounted(mounted);
onUnmounted(() => {

});


provide('msState', {
  mode,
  currentSelected,
  reserveMsSymbolMap,
  currentResevedType,
})
// TODO 这个应该设置为已读，不知道能不能实现
defineExpose<MusicScoreRef>({
  changeMode,
  root: musicScoreRef,
  mode,
  currentSelected,
  currentResevedType,
  setReserveMsSymbol,
  getReserveMsSymbol,
  reserveMsSymbolMap,
  setCurrentResevedType,
  cancelSelect
})
</script>
<style scoped lang="scss" comment="布局">
.stack {
  position: relative;

  > .stackItem {
    position: absolute;
  }
}
</style>
<style scoped lang="scss">
.lineLayer {
  align-items: start;
}

.symbolLayer {
  align-items: start;
}


</style>