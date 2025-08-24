<template>
  <div>
    <div v-for="(multipleStaves, multipleStavesIndex) in musicScore.multipleStavesArray"
         :key="'multipleStaves'+multipleStavesIndex"
         :style="multipleStavesStyle(multipleStaves)"
         @mousedown.self="(e:MouseEvent)=>emits('multipleStavesMouseDown',e,multipleStaves)"
         class="multipleStaves">
      <slot name="multipleStaves"></slot>
      <div v-for="(singleStaff,singleStaffIndex) in multipleStaves.singleStaffArray"
           :key="'singleStaff'+singleStaffIndex"
           :style="singleStaffStyle(singleStaff,multipleStaves)"
           @mousedown.self="(e:MouseEvent)=>emits('singleStaffMouseDown',e,singleStaff)"
           class="singleStaff">
        <slot name="singleStaff"></slot>
        <div v-for="(measure,measureIndex) in singleStaff.measureArray"
             :style="measureSlotStyle(measure, singleStaff, multipleStaves)" class="measureSlot"
             :key="'measure'+measureIndex">
          <!-- 使用作用域插槽，传递 measure 等数据 -->
          <slot
              :measure="measure"
              :measureIndex="measureIndex"
              :singleStaff="singleStaff"
              :singleStaffIndex="singleStaffIndex"
              :multipleStaves="multipleStaves"
              :multipleStavesIndex="multipleStavesIndex"
              :measureWidth="measureWidth(measure, singleStaff, multipleStaves)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type {CSSProperties, PropType} from 'vue';
import {computed} from "vue";
import type {Measure, MsSymbol, MultipleStaves, MusicScore, SingleStaff, WidthConstant} from "deciphony-core/types";
import {
  getMeasureWidth,
} from "@/utils/widthUtil";
import {MusicScoreShowModeEnum} from "deciphony-core/musicScoreEnum";


const props = defineProps({
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  },
  width: {
    type: Number,
    default: 1000,
  },
  height: {
    type: Number,
    default: 800,
  },
  showMode: {
    type: Object as PropType<MusicScoreShowModeEnum>,
    required: true
  }
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
const measureWidth = computed(() => (measure: Measure, singleStaff: SingleStaff, _multipleStaves: MultipleStaves) => {
  return getMeasureWidth(measure, singleStaff, props.musicScore, props.width, props.showMode)
});
const measureSlotStyle = computed(() => (measure: Measure, singleStaff: SingleStaff, multipleStaves: MultipleStaves): CSSProperties => {
  let style: CSSProperties = {};
  style.height = props.musicScore.measureHeight + 'px';
  style.width = measureWidth.value(measure, singleStaff, multipleStaves) + 'px';
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