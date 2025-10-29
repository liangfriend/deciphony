<script lang="ts" setup>
import type {
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MultipleStaves, MusicScore,
    SingleStaff,
} from "deciphony-core";
import {computed, CSSProperties, onMounted, PropType} from "vue";
import msSymbolVue from "./msSymbol.vue";

import {getMsSymbolHeight} from "../utils/heightUtil";
import {getSlotTopToMeasure} from "../utils/topUtil";
import {getMsSymbolSlotWidth} from "../utils/widthUtil";
import {getSlotLeftToContainer} from "../utils/leftUtil";
import {getMsSymbolAspectRatio} from "../utils/geometryUtil";

const props = defineProps({
    msSymbol: {
        type: Object as PropType<MsSymbol>,
        required: true,
    },
    msSymbolContainer: {
        type: Object as PropType<MsSymbolContainer>,
        required: true,
    },
    preContainer: {
        type: Object as PropType<MsSymbolContainer | null>,
    },
    nextContainer: {
        type: Object as PropType<MsSymbolContainer | null>,
    },
    containerWidth: {
        type: Number,
        default: 60,
        required: true,
    },
    //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
    measureHeight: {
        type: Number,
        default: 60,
        required: true,
    },
    measure: {
        type: Object as PropType<Measure>,
        required: true,
    },
    measureWidth: {
        type: Number,
        default: 200,
        required: true,
    },
    componentWidth: {
        type: Number,
        default: 1000,
    },
    componentHeight: {
        type: Number,
        default: 800,
    },
    singleStaff: {
        type: Object as PropType<SingleStaff>,
        required: true,
    },
    multipleStaves: {
        type: Object as PropType<MultipleStaves>,
        required: true,
    },
    musicScore: {
        type: Object as PropType<MusicScore>,
        default: {}
    },
})


const msSymbolSlotStyle = computed<CSSProperties>(() => {
    if (!props.msSymbol || !props.measure || !props.singleStaff) {
        console.error("缺少必要的参数，坐标计算出错")
        return {}
    }

    return {
        left: slotLeft.value + 'px',
        height: props.measureHeight + 'px',
        width: slotWidth.value + 'px',
        top: slotTop.value + 'px',
        pointEvents: ' none',

    }
});

const aspectRatio = computed<number>(() => {
    return getMsSymbolAspectRatio(props.msSymbol)
})
const height = computed(() => {
    return getMsSymbolHeight(props.msSymbol, props.musicScore)
})
const slotWidth = computed(() => {
    return getMsSymbolSlotWidth(props.msSymbol, props.musicScore)
})
const slotLeft = computed(() => {
    return getSlotLeftToContainer(props.msSymbol, props.msSymbolContainer, props.measure, props.singleStaff,
        props.musicScore, slotWidth.value, props.componentWidth)
})
const slotTop = computed(() => {
    return getSlotTopToMeasure(props.msSymbol, props.musicScore)
})

const emits = defineEmits(['msSymbolMouseDown', 'msSymbolMouseUp']);


</script>
<template>
    <div :style="msSymbolSlotStyle"

         class="msSymbolSlot p-stackItem">
        <msSymbolVue v-if="msSymbol" ref="mainMsSymbolRef" :componentHeight="componentHeight"
                     :componentWidth="componentWidth"
                     :containerWidth="containerWidth"
                     :isMain="true"
                     :measure="measure"
                     :measure-width="measureWidth"
                     :measureHeight="measureHeight"
                     :ms-symbol="msSymbol"
                     :msSymbolContainer="props.msSymbolContainer"
                     :musicScore="props.musicScore"
                     :nextContainer="props.nextContainer?props.nextContainer:null"
                     :preContainer="props.preContainer?props.preContainer:null"
                     :single-staff="singleStaff"
                     :slot-left="slotLeft"
                     :slot-width="slotWidth"
                     :slotTop="slotTop"
                     @msSymbolMouseDown="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseDown',e,msSymbol)"
                     @msSymbolMouseUp="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseUp',e,msSymbol)"></msSymbolVue>
        <template v-if="msSymbol?.msSymbolArray">
            <msSymbolVue v-for="item in msSymbol.msSymbolArray" :componentHeight="componentHeight"
                         :componentWidth="componentWidth"
                         :containerWidth="containerWidth"
                         :isMain="false"
                         :measure="measure"
                         :measure-width="measureWidth"
                         :measureHeight="measureHeight"
                         :ms-symbol="item"
                         :msSymbolContainer="props.msSymbolContainer"
                         :musicScore="props.musicScore"
                         :nextContainer="props.nextContainer?props.nextContainer:null"
                         :parent-ms-symbol="msSymbol"
                         :preContainer="props.preContainer?props.preContainer:null"
                         :single-staff="singleStaff"
                         :slot-left="slotLeft"
                         :slot-top="slotTop"
                         :slot-width="slotWidth"
                         @msSymbolMouseDown="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseDown',e,msSymbol)"
                         @msSymbolMouseUp="(e:MouseEvent, msSymbol:MsSymbol)=>emits('msSymbolMouseUp',e,msSymbol)"></msSymbolVue>
        </template>
    </div>


</template>


<style scoped>
.msSymbolSlot {
    display: flex;
    position: absolute;
}
</style>