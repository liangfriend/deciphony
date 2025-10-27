<script lang="ts" setup>
import measureVue from "@/components/measure.vue";
import {computed, onBeforeMount, onMounted, onUnmounted, type PropType, provide, Ref, ref} from 'vue';
import type {
  Measure,
  MsSymbol,
  MsType,
  MultipleStaves,
  MusicScore,
  SingleStaff,

  SpanSymbol
} from "../../deciphony-core/src/types";
import MeasureContainer from "./components/measureContainer.vue";

import MsSymbolContainer
  from "./components/msSymbolContainer.vue";

import SpanSymbolVue from "./components/spanSymbol.vue";
import {
  mapGenerate,
  setMultipleStavesIndex
} from "deciphony-core";
import {
  ChronaxieEnum,
  MsMode,
  MsSymbolContainerTypeEnum,
  MsSymbolTypeEnum, MusicScoreShowModeEnum,
  ReserveMsSymbolType,
} from "../../deciphony-core/src/musicScoreEnum";
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
  from "./components/virtualSymbolContainer.vue";
import {msSymbolTemplate} from "deciphony-core";
import {MusicScoreRef, ReserveMsSymbolMapType, StyleMapItem} from "./types";
import {numberNotationToStandardStaff, standardStaffToNumberNotation} from "deciphony-core";
import {useSkin} from "@/composables/useSkin";


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
  styleMap: {
    type: Array as PropType<Record<number, StyleMapItem>>,

  }

});

// 皮肤
const {isOriginSkin, svgSkin, resetSkin} = useSkin()

function setSkin(newSkin: Record<string, { url: string; }>) {
  svgSkin.value = newSkin
}

// 是否与其它音连成组
const isGroup = computed(() => {
  return (measure: Measure): boolean[] => {
    const arr: boolean[] = [];

    measure.msSymbolContainerArray.forEach((container) => {
      let grouped = false;

      for (const symbol of container.msSymbolArray) {
        if (symbol.type === MsSymbolTypeEnum.NoteHead) {
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
  const note = msSymbolTemplate({type: MsSymbolTypeEnum.NoteHead, chronaxie: ChronaxieEnum.quarter})
  const rest = msSymbolTemplate({type: MsSymbolTypeEnum.Rest, chronaxie: ChronaxieEnum.quarter})
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
const styleMap = ref({})

function beforeMount() {
  if (!props.musicScore) {
    // console.error("musicScore不存在")
    return
  }
  // 索引生成 TODO 这个似乎没有用了，renderer会进行严格的生成
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

function switchShowMode(musicScore: MusicScore) {

  if (musicScore.showMode === MusicScoreShowModeEnum.standardStaff) {
    standardStaffToNumberNotation(musicScore)
  } else if (musicScore.showMode === MusicScoreShowModeEnum.numberNotation) {
    numberNotationToStandardStaff(musicScore)
  }
}

onMounted(() => {

})
onUnmounted(() => {

});


provide('msState', {
  mode,
  currentSelected,
  reserveMsSymbolMap,
  currentResevedType,
})
provide('skin', {svgSkin})
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
  cancelSelect,
  switchShowMode,
  setSkin,
  resetSkin
})
</script>
<template>
  <div ref="musicScoreRef" :style="musicScoreStyle" class="musicScore stack" @mousedown.stop="handleMouseDown"
       @mousemove.stop="handleMouseMove" @mouseup.stop="handleMouseUp">
    <measure-container :disabled="false" :musicScore="musicScore" :style="{width:width+'px',height:height+'px'}"
                       class="stackItem lineLayer"
                       comment="谱线层1"
                       @multipleStavesMouseDown="handleMultipleStavesMouseDown"
                       @single-staff-mouse-down="handleSingleStaffMouseDown">
      <template #default="{ measure, measureIndex, singleStaff, multipleStaves, measureWidth }">
        <measureVue
            :key="'measure'+measureIndex"
            :componentHeight="height"
            :componentWidth="width"
            :height="musicScore.measureHeight"
            :measure="measure"
            :musicScore="musicScore"
            :strokeWidth="strokeWidth"
            :width="measureWidth"
            :x="measureIndex * measureWidth"
            @measureMouseDown="handleMeasureMouseDown"
        >
        </measureVue>
      </template>
    </measure-container>
    <!--    跨小节符号目前只有小节跟随型和符号（音符头）跟随型-->
    <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" :viewBox="`0 0 ${width} ${height}`"
         :width="width"
         :height="height" class="stackItem spanSymbolLayer" comment="跨小节符号层">

      <span-symbol-vue v-for="(spanSymbol,spanSymbolIndex) in musicScore.spanSymbolArray"
                       :key="spanSymbol.vueKey"
                       :componentHeight="height"
                       :componentWidth="width"
                       :musicScore="musicScore"
                       :spanSymbol="spanSymbol"
                       @spanSymbolMouseUp="handleSpanSymbolMouseUp"
                       @span-symbol-mouse-down="handleSpanSymbolMouseDown"></span-symbol-vue>
    </svg>

    <measure-container :musicScore="musicScore" :style="{width:width+'px',height:height+'px', pointerEvents:'none'}"
                       class="stackItem symbolLayer"
                       comment="符号层2">
      <template #default="{ measure, measureIndex, singleStaff, multipleStaves, measureWidth }">
        <ms-symbol-container v-for="(msSymbolContainer,symbolIndex) in measure.msSymbolContainerArray"
                             :key="'note-symbol'+symbolIndex"
                             :componentHeight="height"
                             :componentWidth="width"
                             :measure="measure"
                             :measureHeight="musicScore.measureHeight"
                             :measureWidth="measureWidth"
                             :msSymbolContainer="msSymbolContainer"
                             :multipleStaves="multipleStaves"
                             :musicScore="musicScore"
                             :nextContainer="measure.msSymbolContainerArray.length!==(symbolIndex+1)?
                             measure.msSymbolContainerArray[symbolIndex+1]:undefined"
                             :preContainer="measure.msSymbolContainerArray.length!==0?
                             measure.msSymbolContainerArray[symbolIndex-1]:undefined"
                             :singleStaff="singleStaff"
                             @msSymbolMousUp="handleMsSymbolMouseUp"
                             @msSymbolMouseDown="handleMsSymbolMouseDown"
        ></ms-symbol-container>
      </template>
    </measure-container>

    <measure-container v-show="mode === MsMode.edit" :musicScore="musicScore"
                       :style="{width:width+'px',height:height+'px', pointerEvents:'none'}"
                       class="stackItem symbolLayer"
                       comment="编辑模式虚拟音符层">
      <template
          #default="{ measure, measureIndex, singleStaff, multipleStaves, measureWidth }">
        <template v-if="currentSelected === measure">
          <virtual-symbol-container
              v-if="!variableContainerArray(measure).length"
              :componentHeight="height"
              :componentWidth="width"
              :measure="measure"
              :measureHeight="musicScore.measureHeight"
              :measureWidth="measureWidth"
              :multipleStaves="multipleStaves"
              :musicScore="musicScore"
              :singleStaff="singleStaff"
              comment="小节无变宽符号时的虚拟音符容器"
              type="front"
          ></virtual-symbol-container>
          <virtual-symbol-container
              :componentHeight="height"
              :componentWidth="width"
              :measure="measure"
              :measureHeight="musicScore.measureHeight"
              :measureWidth="measureWidth"
              :msSymbolContainer="variableContainerArray(measure)[0]"
              :multipleStaves="multipleStaves"
              :musicScore="musicScore"
              :singleStaff="singleStaff"
              comment="第一个变宽容器"
              type="front"
          ></virtual-symbol-container>
          <virtual-symbol-container
              v-for="(msSymbolContainer,symbolIndex) in variableContainerArray(measure)"
              :key="'virtual-symbol'+symbolIndex"
              :componentHeight="height"
              :componentWidth="width"
              :ind="symbolIndex"
              :measure="measure"
              :measureHeight="musicScore.measureHeight"
              :measureWidth="measureWidth"
              :msSymbolContainer="msSymbolContainer"
              :multipleStaves="multipleStaves"
              :musicScore="musicScore"
              :singleStaff="singleStaff"
              type="self"
          ></virtual-symbol-container>
          <virtual-symbol-container
              v-for="(msSymbolContainer,symbolIndex) in variableContainerArray(measure)"

              :key="'virtual-symbol'+symbolIndex"
              :componentHeight="height"
              :componentWidth="width"
              :ind="symbolIndex"
              :measure="measure"
              :measureHeight="musicScore.measureHeight"
              :measureWidth="measureWidth"
              :msSymbolContainer="msSymbolContainer"
              :multipleStaves="multipleStaves"
              :musicScore="musicScore"
              :singleStaff="singleStaff"
              :type="(symbolIndex === (variableContainerArray(measure).length - 1))?'end':'middle'"
          ></virtual-symbol-container>
        </template>

      </template>
    </measure-container>

  </div>
</template>
<style comment="布局" lang="scss" scoped>

</style>
<style lang="scss" scoped>
.lineLayer {
  align-items: start;
}

.symbolLayer {
  align-items: start;
}

.spanSymbolLayer {
}

</style>