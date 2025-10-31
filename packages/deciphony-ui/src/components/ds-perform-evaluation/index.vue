<script lang="ts" setup>
import {computed, PropType} from "vue";
import {KeyCodeEnum} from "../../types/enum";
import {defaultCodeConfig} from "../../utils/constant";
import {parseAndFormatDimension} from "../../utils/commonUtil";

defineOptions({
    name: 'DsPerformEvaluation',
})
const props = defineProps({
    height: {type: String, default: '180px'},
    config: {
        type: Object as PropType<{
            keyboard: {
                code: KeyCodeEnum,
                midi: number,
            }[]
        }>,
        default: () => ({
            keyboard: defaultCodeConfig
        })
    },
    bpm: { // performSequence为sequence时生效
        type: Number,
        default: 120
    },
    columnWidthConstant: {// 水柱高度系数
        type: Number,
        default: 0.05
    },
    showMode: { // 展示模式， 乐器模式和演唱模式，乐器模式水柱均匀分布，演唱模式按midi大小分布

    },
    prepareTime: {
        type: Number,
        default: 3000 // 三秒的预备时间
    },
    performSequence: {
        default: () => {
            return {
                '60': [[0, 600], [600, 1200], [3200, 4200], [4800, 5600]],
                '61': [[1200, 1800], [1800, 3200]],
                '62': [[0, 600], [1800, 2400]],
            }
        }
    },
    // 基准线位置
    baseLineLeft: {
        type: Number,
        default: 100
    },

})
/** 解析容器高度，单位*/
const containerHeightNum = computed(() => {
    const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)
    return containerHeightNum
})
const containerHeightUnit = computed(() => {
    const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)
    return heightUnit
})
</script>
<template>
    <div>

    </div>

</template>
<style>

</style>