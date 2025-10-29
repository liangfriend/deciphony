<script lang="ts" setup>
import {computed, CSSProperties, PropType} from "vue";
import {MsSymbol, TimeSignatureMsSymbol} from "deciphony-core";
import {MsSymbolTypeEnum} from "deciphony-core";

const props = defineProps({
    timeSignature: {
        type: Object as PropType<TimeSignatureMsSymbol>,
        required: true,
    },
    //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
    measureHeight: {
        type: Number,
        default: 60
    },
})

const timeSignatureStyle = computed((): CSSProperties => {
    return {
        fontSize: props.measureHeight / 3 + 'px',
        userSelect: 'none',
        color: props.timeSignature.options.highlight ? props.timeSignature.options.highlightColor : props.timeSignature.options.color,
    }
})
</script>
<template>
    <div v-if="timeSignature && timeSignature.type === MsSymbolTypeEnum.TimeSignature" :style="timeSignatureStyle"
         class="timeSignature">
        <!--   TODO 这里后续要改掉，使用svg数字   -->
        <div>{{ timeSignature.timeSignature.beat }}</div>
        <div>{{ timeSignature.timeSignature.chronaxie }}</div>
    </div>
</template>
<style scoped>
.timeSignature {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex-direction: column;
    font-weight: bold;
}

.timeSignature > div {
    pointer-events: none;
}
</style>