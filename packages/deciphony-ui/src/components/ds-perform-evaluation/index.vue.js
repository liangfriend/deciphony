import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { parseAndFormatDimension } from '../../utils/commonUtil';
import { defaultCodeConfig } from "../../utils/constant";
defineOptions({
    name: 'DsPerformEvaluation'
});
const props = defineProps({
    height: { type: String, default: '180px' },
    config: {
        type: Object,
        default: () => ({
            keyboard: defaultCodeConfig
        })
    },
    bpm: {
        type: Number,
        default: 120
    },
    columnWidthConstant: {
        type: Number,
        default: 0.05
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
            };
        }
    },
    // 基准线位置
    baseLineLeft: {
        type: Number,
        default: 100
    },
    highlightPolicy: {
        type: Object,
        default: () => ({}),
    },
});
const performSequenceComputed = computed(() => {
    const res = {};
    for (const [midiStr, seq] of Object.entries(props.performSequence)) {
        const midi = Number(midiStr);
        res[midi] = seq.map(([start, end]) => [
            start + props.prepareTime,
            end + props.prepareTime,
        ]);
    }
    return res;
});
// 总时长（毫秒）
const duration = computed(() => {
    let maxTime = 0;
    for (let i of Object.keys(performSequenceComputed.value)) {
        const waterColumns = performSequenceComputed.value[i];
        for (let j in waterColumns) {
            const endTime = waterColumns[j][1];
            if (endTime > maxTime) {
                maxTime = endTime;
            }
        }
    }
    return maxTime;
});
/** 解析容器高度，单位*/
const containerHeightNum = computed(() => {
    const { value: containerHeightNum, unit: heightUnit } = parseAndFormatDimension(props.height);
    return containerHeightNum;
});
const containerHeightUnit = computed(() => {
    const { value: containerHeightNum, unit: heightUnit } = parseAndFormatDimension(props.height);
    return heightUnit;
});
const maxMidi = computed(() => {
    let max = -Infinity;
    for (let key of Object.keys(performSequenceComputed.value)) {
        max = Math.max(max, +key);
    }
    return max;
});
const minMidi = computed(() => {
    let min = Infinity;
    for (let key of Object.keys(performSequenceComputed.value)) {
        min = Math.min(min, +key);
    }
    return min;
});
// 计算出每块midi的高度
const midiHeight = computed(() => {
    return containerHeightNum.value / (maxMidi.value - minMidi.value + 1);
});
/*
* 样式
* */
/** 样式 - 外容器（带滚动） */
const pianoWaterfallContainerStyle = computed(() => ({
    width: '100%',
    height: props.height,
    outline: '1px dashed black',
    position: 'relative',
    overflow: 'hidden',
}));
const waterfallStyle = computed(() => {
    const precent = currentTime.value * props.columnWidthConstant;
    // 当前时间在该区间时，计算下落动画
    const res = {
        height: props.height,
        position: 'absolute',
        left: props.baseLineLeft + 'px',
        transform: `translateX(-${precent}px)`, // 这里从containerHeightNum.value + waterfallHeight到0，如果transform不好做暂停，改用修改bottom
        userSelect: 'none',
    };
    return res;
});
const keyStyle = computed(() => {
    return (midi) => {
        const res = {
            width: '100%',
            height: midiHeight.value + 'px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative',
        };
        return res;
    };
});
const midiEventStyle = computed(() => {
    return (midi) => {
        const res = {
            width: '0.1px',
            height: midiHeight.value + 'px',
            boxShadow: '0 0px 5px 1px red',
            visibility: activeKeys.value.has(midi) ? 'visible' : 'hidden',
        };
        return res;
    };
});
// 水柱样式
const waterColumnStyle = computed(() => {
    return (item) => {
        const start = item[0];
        const end = item[1];
        const res = {
            width: (end - start) * props.columnWidthConstant + 'px',
            height: '10px',
            backgroundColor: 'blue',
            position: 'absolute',
            flexShrink: 0,
            borderRadius: '5px',
            left: (start) * props.columnWidthConstant + 'px',
        };
        return res;
    };
});
// 水柱激活样式
const waterColumnActiveStyle = computed(() => {
    return (item) => {
        const start = item[0];
        const end = item[1];
        return {
            height: '10px',
            width: (end - start) * props.columnWidthConstant + 'px',
            background: `red`,
            flexShrink: 0,
            borderRadius: '5px',
            position: 'absolute',
            left: (start) * props.columnWidthConstant + 'px',
        };
    };
});
/** 按键交互 */
// 高亮效果
const midiEventContainerStyle = computed(() => {
    return {
        height: '100%',
        width: '1px',
        left: props.baseLineLeft + 'px',
        outline: '1px dashed yellow',
    };
});
/*
* 事件
* */
const defaultHighlightPolicy = {
    allowRepeat: false, // 有了后两个触发时间的限制，这个暂时可以不要，现在无实际功能
    startTriggerThreshold: 100,
    postTriggerThreshold: 100
};
const policy = computed(() => ({
    ...defaultHighlightPolicy,
    ...props.highlightPolicy,
}));
const activeKeys = ref(new Set());
const activeParts = ref(new Map());
onMounted(() => {
    // 绑定键盘按下与抬起事件
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
});
onBeforeUnmount(() => {
    // 移除事件绑定
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});
function handleKeyDown(e) {
    const midi = props.config.keyboard?.find(item => item.code === e.code)?.midi;
    if (!midi)
        return;
    // 防止重复按下
    if (activeKeys.value.has(midi))
        return;
    activeKeys.value.add(midi);
    if (state.value !== 'playing')
        return;
    // 记录高亮部分
    const timeStamp = currentTime.value;
    if (activeParts.value.has(midi)) {
        const arr = activeParts.value.get(midi);
        arr.push([timeStamp]);
    }
    else {
        activeParts.value.set(midi, [[timeStamp]]);
    }
}
function handleKeyUp(e) {
    const midi = props.config.keyboard?.find(item => item.code === e.code)?.midi;
    if (!midi)
        return;
    activeKeys.value.delete(midi);
    if (state.value !== 'playing')
        return;
    // 记录高亮部分
    const timeStamp = currentTime.value;
    const arr = activeParts.value.get(midi);
    // 其实这个防护不一定能用到
    if (!arr || arr.length === 0)
        return;
    const last = arr[arr.length - 1];
    if (last.length === 1)
        last.push(timeStamp);
}
// 高亮数据
const highlightSegments = computed(() => {
    const result = {};
    for (const [midiStr, seq] of Object.entries(performSequenceComputed.value)) {
        const midi = Number(midiStr);
        const activeSeq = activeParts.value.get(midi) || [];
        const highlightParts = [];
        for (const [pStart, pEnd] of seq) {
            // 根据策略计算允许的触发区间
            const validStart = pStart - policy.value.startTriggerThreshold;
            const validEnd = pStart + policy.value.postTriggerThreshold;
            // 若不允许重复，则只取第一个激活区间
            const parts = activeSeq;
            for (const part of parts) {
                const aStart = part[0];
                const aEnd = part[1] ?? currentTime.value; // 若还未抬键，则动态增长
                // 若整个按下区间完全不在允许区间内，则跳过
                if (aStart < validStart || aStart > validEnd)
                    continue;
                // 有效交集
                const overlapStart = Math.max(pStart, aStart);
                const overlapEnd = Math.min(pEnd, aEnd);
                if (overlapStart < overlapEnd) {
                    highlightParts.push([overlapStart, overlapEnd]);
                }
            }
        }
        // 若有高亮区间，则存入结果
        if (highlightParts.length > 0) {
            result[midi] = highlightParts;
        }
    }
    return result;
});
// 播放功能
// 当前播放时间（ms）
const currentTime = ref(0);
// 是否正在播放
const state = ref('stopped'); // stopped playing paused
// 播放起点（用于恢复播放）
let lastTimestamp = 0;
let rafId = null;
/** 播放函数 */
function play() {
    if (state.value === 'playing')
        return;
    state.value = 'playing';
    lastTimestamp = performance.now();
    requestFrame();
}
/** 暂停函数 */
function pause() {
    if (state.value !== 'playing')
        return;
    state.value = 'paused';
    if (rafId)
        cancelAnimationFrame(rafId);
}
/** 停止函数（回到开头） */
function stop() {
    if (state.value === 'stopped')
        return;
    state.value = 'stopped';
    if (rafId)
        cancelAnimationFrame(rafId);
    currentTime.value = 0;
}
/** 动画循环 */
function requestFrame() {
    rafId = requestAnimationFrame((timestamp) => {
        if (state.value !== 'playing')
            return;
        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        currentTime.value += delta;
        // 若播放超出总时长，停止动画，但保留状态
        if (currentTime.value >= duration.value) {
            if (rafId)
                cancelAnimationFrame(rafId);
            return;
        }
        requestFrame();
    });
}
const __VLS_exposed = {
    play,
    pause,
    stop
};
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['hide-scrollbar']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: (__VLS_ctx.pianoWaterfallContainerStyle) },
    ...{ class: "hide-scrollbar stack" },
    comment: "滚动容器",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: (__VLS_ctx.waterfallStyle) },
    ...{ class: "stackItem" },
    comment: "瀑布流容器",
});
for (const [midi] of __VLS_getVForSourceType((Array.from({ length: __VLS_ctx.maxMidi - __VLS_ctx.minMidi + 1 }, (_, i) => __VLS_ctx.maxMidi - i)))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (midi),
        ...{ style: (__VLS_ctx.keyStyle(midi)) },
    });
    for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.performSequenceComputed[midi]))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (index),
            ...{ style: (__VLS_ctx.waterColumnStyle(item)) },
            comment: "音符水柱,后续改插槽自定义样式",
        });
    }
    for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.highlightSegments[midi] || []))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (index),
            ...{ style: (__VLS_ctx.waterColumnActiveStyle(item)) },
            comment: "音符水柱激活态,后续改插槽自定义样式",
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: (__VLS_ctx.midiEventContainerStyle) },
    ...{ class: "stackItem" },
    comment: "瀑布流容器,midi按下效果",
});
for (const [midi] of __VLS_getVForSourceType((Array.from({ length: __VLS_ctx.maxMidi - __VLS_ctx.minMidi + 1 }, (_, i) => __VLS_ctx.maxMidi - i)))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (midi),
        ...{ style: (__VLS_ctx.midiEventStyle(midi)) },
        comment: "midi按下效果,后续改插槽自定义样式",
    });
}
/** @type {__VLS_StyleScopedClasses['hide-scrollbar']} */ ;
/** @type {__VLS_StyleScopedClasses['stack']} */ ;
/** @type {__VLS_StyleScopedClasses['stackItem']} */ ;
/** @type {__VLS_StyleScopedClasses['stackItem']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            performSequenceComputed: performSequenceComputed,
            maxMidi: maxMidi,
            minMidi: minMidi,
            pianoWaterfallContainerStyle: pianoWaterfallContainerStyle,
            waterfallStyle: waterfallStyle,
            keyStyle: keyStyle,
            midiEventStyle: midiEventStyle,
            waterColumnStyle: waterColumnStyle,
            waterColumnActiveStyle: waterColumnActiveStyle,
            midiEventContainerStyle: midiEventContainerStyle,
            highlightSegments: highlightSegments,
        };
    },
    props: {
        height: { type: String, default: '180px' },
        config: {
            type: Object,
            default: () => ({
                keyboard: defaultCodeConfig
            })
        },
        bpm: {
            type: Number,
            default: 120
        },
        columnWidthConstant: {
            type: Number,
            default: 0.05
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
                };
            }
        },
        // 基准线位置
        baseLineLeft: {
            type: Number,
            default: 100
        },
        highlightPolicy: {
            type: Object,
            default: () => ({}),
        },
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    props: {
        height: { type: String, default: '180px' },
        config: {
            type: Object,
            default: () => ({
                keyboard: defaultCodeConfig
            })
        },
        bpm: {
            type: Number,
            default: 120
        },
        columnWidthConstant: {
            type: Number,
            default: 0.05
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
                };
            }
        },
        // 基准线位置
        baseLineLeft: {
            type: Number,
            default: 100
        },
        highlightPolicy: {
            type: Object,
            default: () => ({}),
        },
    },
});
; /* PartiallyEnd: #4569/main.vue */
