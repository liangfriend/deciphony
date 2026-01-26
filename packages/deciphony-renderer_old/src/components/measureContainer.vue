<template>
  <div>
    <div v-for="(multipleStaves, multipleStavesIndex) in musicScore.multipleStavesArray"
         :key="'multipleStaves'+multipleStavesIndex"
         :style="multipleStavesStyle(multipleStaves)"
         class="multipleStaves"
         @mousedown.self="(e:MouseEvent)=>emits('multipleStavesMouseDown',e,multipleStaves)">
      <slot name="multipleStaves"></slot>
      <div v-for="(singleStaff,singleStaffIndex) in multipleStaves.singleStaffArray"
           :key="'singleStaff'+singleStaffIndex"
           :style="singleStaffStyle(singleStaff,multipleStaves)"
           class="singleStaff"
           @mousedown.self="(e:MouseEvent)=>emits('singleStaffMouseDown',e,singleStaff)">
        <slot name="singleStaff"></slot>
        <div v-for="(measure,measureIndex) in singleStaff.measureArray"
             :key="'measure'+measureIndex"
             :style="measureSlotStyle(measure, singleStaff, multipleStaves,musicScore,componentWidth)"
             class="measureSlot">
          <!-- 使用作用域插槽，传递 measure 等数据 -->
          <slot
              :measure="measure"
              :measureIndex="measureIndex"
              :measureWidth="measureWidth(measure, singleStaff, multipleStaves,musicScore,componentWidth)"
              :multipleStaves="multipleStaves"
              :multipleStavesIndex="multipleStavesIndex"
              :singleStaff="singleStaff"
              :singleStaffIndex="singleStaffIndex"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type {CSSProperties, PropType} from 'vue';
import {computed} from "vue";
import type {
  Measure,
  MsSymbol,
  MultipleStaves,
  MusicScore,
  SingleStaff,
  WidthConstant
} from "deciphony-core";
import {
  getMeasureWidth,
} from "../utils/widthUtil";


const props = defineProps({
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  },
  componentWidth: {
    type: Number,
    default: 1000,
  },
  height: {
    type: Number,
    default: 800,
  },

});


const emits = defineEmits(["singleStaffMouseDown", "multipleStavesMouseDown"]);
// 边距全部用padding避免margin折叠
const multipleStavesStyle = computed(() => (multipleStaves: MultipleStaves): CSSProperties => {
  return {
    'grid-template-rows': `repeat(${multipleStaves.singleStaffArray.length},1fr)`,
    'padding-top': multipleStaves.multipleStavesPaddingTop + 'px',
    'padding-bottom': multipleStaves.multipleStavesPaddingBottom + 'px',
    'margin-bottom': multipleStaves.multipleStavesMarginBottom + 'px',
    'pointer-events': props.disabled ? 'none' : 'auto',
    'outline': `1px solid ` + (multipleStaves.options.highlight ? multipleStaves.options.highlightColor : multipleStaves.options.color),
  };
});
const singleStaffStyle = computed(() => (singleStaff: SingleStaff, _multipleStaves: MultipleStaves): CSSProperties => {
  return {
    'grid-template-columns': `repeat(${singleStaff.measureArray.length},1fr)`,
    'padding-top': singleStaff.singleStaffPaddingTop + 'px',
    'padding-bottom': singleStaff.singleStaffPaddingBottom + 'px',
    'margin-bottom': singleStaff.singleStaffMarginBottom + 'px',
    'pointer-events': props.disabled ? 'none' : 'auto',
    'outline': `1px solid ` + (singleStaff.options.highlight ? singleStaff.options.highlightColor : singleStaff.options.color),
  };
});
const measureWidth = computed(() => (measure: Measure, singleStaff: SingleStaff, _multipleStaves: MultipleStaves, musicScore: MusicScore, componentWidth: number) => {
  return getMeasureWidth(measure, singleStaff, musicScore, componentWidth)
});
const measureSlotStyle = computed(() => (measure: Measure, singleStaff: SingleStaff, multipleStaves: MultipleStaves, musicScore: MusicScore, componentWidth: number): CSSProperties => {
  let style: CSSProperties = {};
  style.height = props.musicScore.measureHeight + 'px';
  style.width = measureWidth.value(measure, singleStaff, multipleStaves, musicScore, componentWidth) + 'px';
  style.pointerEvents = props.disabled ? 'none' : 'auto';
  return style;
});

</script>
<style scoped>
.singleStaff {
  display: grid;
  grid-template-rows: 1fr;
}

.measureSlot {
  display: grid;
  position: relative;
}
</style>