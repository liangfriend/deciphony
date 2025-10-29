<script lang="ts" setup>
import type {
    Measure, MsSymbol,
    MsSymbolContainer,
    MultipleStaves, MusicScore,
    SingleStaff,
} from "deciphony-core";
import {computed, CSSProperties, onMounted, PropType} from "vue";
import MsSymbolSlot from "./msSymbolSlot.vue";
import {
    getMsSymbolContainerWidth,
} from "../utils/widthUtil";
import {getContainerLeftToMeasure} from "../utils/leftUtil";

const props = defineProps({
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
    measureHeight: {
        type: Number,
        required: true,
    },
    measure: {
        type: Object as PropType<Measure>,
        required: true,
    },
    measureWidth: {
        type: Number,
        required: true,
    },
    componentWidth: {
        type: Number,
        required: true,
    },
    componentHeight: {
        type: Number,
        required: true,
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
        required: true, // 改为必须传入，移除 default: {}
    },

});


const msSymbolContainerStyle = computed<CSSProperties>(() => {
    if (!props.msSymbolContainer || !props.measure || !props.singleStaff) {
        console.error("缺少必要的参数，坐标计算出错")
        return {}
    }


    return {
        left: containerLeft.value + 'px',
        height: props.measureHeight + 'px',
        width: containerWidth.value + 'px',
        bottom: 0 + 'px',
        pointerEvents: 'none',

    }
});

// 符号容器宽度计算
const containerWidth = computed(() => {
    return getMsSymbolContainerWidth(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.componentWidth)
})
// 符号容器横坐标计算
const containerLeft = computed(() => {
    return getContainerLeftToMeasure(props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.measureWidth)
})
const emits = defineEmits(['msSymbolMouseDown', 'msSymbolMouseUp']);

</script>
<template>
    <div :style="msSymbolContainerStyle"
         class="msSymbolContainer">
        <ms-symbol-slot v-for="msSymbol in msSymbolContainer?.msSymbolArray"
                        :componentHeight="componentHeight"
                        :componentWidth="componentWidth"
                        :containerWidth="containerWidth"
                        :measure="props.measure"
                        :measureHeight="props.measureHeight"
                        :measureWidth="props.measureWidth"
                        :msSymbol="msSymbol"
                        :msSymbolContainer="props.msSymbolContainer"
                        :multipleStaves="props.multipleStaves"
                        :musicScore="props.musicScore"
                        :nextContainer="props.nextContainer?props.nextContainer:null"
                        :preContainer="props.preContainer?props.preContainer:null"
                        :singleStaff="props.singleStaff"
                        @msSymbolMouseDown="(e:MouseEvent, msSymbol:MsSymbol) => emits('msSymbolMouseDown',e,msSymbol)"
                        @msSymbolMouseUp="(e:MouseEvent, msSymbol:MsSymbol) => emits('msSymbolMouseUp',e,msSymbol)"></ms-symbol-slot>
    </div>


</template>

<style scoped>
.msSymbolContainer {
    overflow: visible;
    position: absolute;
}


</style>