import { computed, onMounted, ref } from 'vue';
import { parseAndFormatDimension } from '../../utils/commonUtil';
import { AccidentalEnum, midiToNoteName, noteNameToHelmholtz, noteNameToNoteString } from "@deciphony/core";
import vDrag from '../../directivces/drag';
import { defaultCodeConfig } from "../../utils/constant";
defineOptions({
    name: 'DsPiano'
});
const props = defineProps({
    height: { type: String, default: '180px' },
    whiteKeyWidth: { type: String, default: '40px' },
    blackKeyWidthRatio: {
        type: Number,
        default: 0.7
    },
    blackKeyHeightRatio: {
        type: Number,
        default: 0.65
    },
    config: {
        type: Object,
        default: () => ({
            keyboard: defaultCodeConfig
        })
    },
    midi: {
        type: Object,
        default: () => ({ min: 21, max: 108 })
    },
    pitchNotation: {
        type: String, // Scientific Helmholtz None
        default: 'None'
    },
    intervalRuler: {
        type: Boolean,
        default: false
    },
    chordBox: {
        type: Boolean,
        default: false
    },
    group: {
        type: Boolean,
        default: false
    },
});
/** 判断该 midi 是否为黑键（1,3,6,8,10 实际上是 1,3,6,8,10 — 但你之前用 1,3,5,8,10；通常 black indices: 1,3,6,8,10） */
function isBlackKey(midi) {
    const noteIndex = midi % 12;
    return [1, 3, 6, 8, 10].includes(noteIndex);
}
/** 原始键数组（含黑白标识） */
const rawKeys = computed(() => {
    const out = [];
    for (let i = props.midi.min; i <= props.midi.max; i++) {
        out.push({
            midi: i,
            black: isBlackKey(i),
            scientificNoteName: [noteNameToNoteString(midiToNoteName(i, AccidentalEnum.Sharp)), noteNameToNoteString(midiToNoteName(i, AccidentalEnum.Flat))],
            helmholtzNoteName: [noteNameToHelmholtz(midiToNoteName(i, AccidentalEnum.Sharp)), noteNameToHelmholtz(midiToNoteName(i, AccidentalEnum.Flat))]
        });
    }
    return out;
});
/** 白键数组（带索引） */
const whiteKeys = computed(() => {
    const arr = [];
    let wi = 0;
    for (const k of rawKeys.value) {
        if (!k.black) {
            arr.push({
                whiteIndex: wi,
                ...k
            });
            wi++;
        }
    }
    return arr;
});
/** 黑键数组 */
const blackKeys = computed(() => {
    // 只包含黑键，不带索引（位置按前面的白键数量计算）
    return rawKeys.value.filter(k => {
        return k.black;
    });
});
/** 从 midi 找到前面的白键数量（whiteIndexBefore） */
function whiteIndexBeforeMidi(midi) {
    // count white keys with midi < target
    let count = 0;
    for (let m = props.midi.min; m < midi; m++) {
        if (!isBlackKey(m))
            count++;
    }
    return count; // 等价于前面有多少白键
}
/** 解析容器高度，单位*/
const containerHeightNum = computed(() => {
    const { value: containerHeightNum, unit: heightUnit } = parseAndFormatDimension(props.height);
    return containerHeightNum;
});
const containerHeightUnit = computed(() => {
    const { value: containerHeightNum, unit: heightUnit } = parseAndFormatDimension(props.height);
    return heightUnit;
});
/** 解析白键宽、容器高度单位/数值 */
const whiteKeyWidthNum = computed(() => {
    const { value: whiteKeyWidthNum, unit } = parseAndFormatDimension(props.whiteKeyWidth);
    return whiteKeyWidthNum;
});
const keyUnit = computed(() => {
    const { value, unit } = parseAndFormatDimension(props.whiteKeyWidth);
    return unit;
});
const blackKeyWidthNum = computed(() => whiteKeyWidthNum.value * props.blackKeyWidthRatio);
const blackKeyHeightNum = computed(() => containerHeightNum.value * props.blackKeyHeightRatio);
/** 计算内层总宽度（所有白键） */
const innerWidth = computed(() => {
    const totalWhite = whiteKeys.value.length;
    return `${totalWhite * whiteKeyWidthNum.value}${keyUnit.value}`;
});
/** 样式 - 外容器（带滚动） */
const pianoContainerStyle = computed(() => ({
    width: totalWidth.value,
    height: props.height,
    position: 'relative',
    background: '#eee'
}));
/** 生成白键样式 left 值 */
function leftForWhiteByIndex(whiteIndex) {
    return `${whiteIndex * whiteKeyWidthNum.value}${keyUnit.value}`;
}
/** 生成黑键 left 值（将黑键居中放在相邻两个白键之间） */
function leftForBlackByMidi(midi) {
    const beforeWhiteCount = whiteIndexBeforeMidi(midi); // number of white keys strictly before this midi
    // place at (beforeWhiteCount + 1) * whiteWidth - blackWidth/2  => between the white before and the next white
    const leftNum = (beforeWhiteCount) * whiteKeyWidthNum.value - (blackKeyWidthNum.value / 2);
    return `${leftNum}${keyUnit.value}`;
}
/** 按键交互 */
const activeKeys = ref(new Set());
const emits = defineEmits();
function emitKey(type, midi) {
    if (!activeKeys.value.has(midi) && type === 'keyDown') {
        activeKeys.value.add(midi);
    }
    else if (activeKeys.value.has(midi) && type === 'keyUp') {
        activeKeys.value.delete(midi);
    }
    // 抛出事件
    const keyInfo = {
        midi: midi,
        black: isBlackKey(midi),
        scientificNoteName: [noteNameToNoteString(midiToNoteName(midi, AccidentalEnum.Sharp)), noteNameToNoteString(midiToNoteName(midi, AccidentalEnum.Flat))],
        helmholtzNoteName: [noteNameToHelmholtz(midiToNoteName(midi, AccidentalEnum.Sharp)), noteNameToHelmholtz(midiToNoteName(midi, AccidentalEnum.Flat))],
    };
    if (type === 'keyDown') {
        emits('keyDown', keyInfo);
    }
    else {
        emits('keyUp', keyInfo);
    }
    // 这样写报错,但是并没有错误，ts bug
    // emits(type, keyInfo)
}
function handlePointerDown(event, key) {
    emitKey('keyDown', key.midi);
    const el = event.target;
    el.setPointerCapture(event.pointerId);
}
function handlePointerUp(event, key) {
    emitKey('keyUp', key.midi);
    const el = event.target;
    el.releasePointerCapture(event.pointerId);
}
function isKeyActive(midi) {
    return activeKeys.value.has(midi);
}
/* 整体宽度 */
const totalWidth = computed(() => {
    let whiteKeyCount = 0;
    for (let i = props.midi.min; i <= props.midi.max; i++) {
        if (isWhiteKey(i)) {
            whiteKeyCount += 1;
        }
    }
    const { value, unit } = parseAndFormatDimension(props.whiteKeyWidth);
    return value * whiteKeyCount + unit;
});
/** 判断是否是白键 */
function isWhiteKey(midi) {
    const noteIndex = midi % 12;
    return ![1, 3, 6, 8, 10].includes(noteIndex);
}
const groupColorMap = ref({
    '大字三组': 'rgba(255, 99, 132, 0.2)', // 粉红
    '大字二组': 'rgba(54, 162, 235, 0.2)', // 天蓝
    '大字一组': 'rgba(255, 206, 86, 0.2)', // 明黄
    '小字组': 'rgba(75, 192, 192, 0.2)', // 青绿
    '小字一组': 'rgba(153, 102, 255, 0.2)', // 紫色
    '小字二组': 'rgba(255, 159, 64, 0.2)', // 橙色
    '小字三组': 'rgba(0, 200, 83, 0.2)', // 草绿
    '小字四组': 'rgba(233, 30, 99, 0.2)', // 洋红
    '小字五组': 'rgba(0, 188, 212, 0.2)', // 湖蓝
    '小字六组': 'rgba(255, 87, 34, 0.2)', // 橘红
    '小字七组': 'rgba(63, 81, 181, 0.2)', // 靛蓝
    '小字八组': 'rgba(139, 195, 74, 0.2)', // 苹果绿
});
// 分组蒙层数组
const groupMaskList = computed(() => {
    const min = props.midi.min;
    const max = props.midi.max;
    const groupNames = [
        '大字三组',
        '大字二组',
        '大字一组',
        '小字组',
        '小字一组',
        '小字二组',
        '小字三组',
        '小字四组',
        '小字五组',
        '小字六组',
        '小字七组',
        '小字八组',
    ];
    const res = [];
    let whiteKeyCount = 0;
    for (let i = min; i <= max; i++) {
        whiteKeyCount += isWhiteKey(i) ? 1 : 0;
        const ocatve = Math.floor(i / 12);
        let groupName = '';
        switch (ocatve) {
            case 0: {
                groupName = '大字四组';
                break;
            }
            case 1: {
                groupName = '大字三组';
                break;
            }
            case 2: {
                groupName = '大字二组';
                break;
            }
            case 3: {
                groupName = '大字一组';
                break;
            }
            case 4: {
                groupName = '小字组';
                break;
            }
            case 5: {
                groupName = '小字一组';
                break;
            }
            case 6: {
                groupName = '小字二组';
                break;
            }
            case 7: {
                groupName = '小字三组';
                break;
            }
            case 8: {
                groupName = '小字四组';
                break;
            }
            case 9: {
                groupName = '小字五组';
                break;
            }
        }
        const cur = {
            whiteKeyCount,
            groupName,
            color: groupColorMap.value[groupName],
        };
        // 加上最后一组
        if (max % 12 !== 11 && i === max) {
            res.push(cur);
        }
        if (i % 12 === 11) {
            res.push(cur);
            whiteKeyCount = 0;
        }
    }
    return res;
});
const groupStyle = computed(() => {
    return (item) => {
        const { value, unit } = parseAndFormatDimension(props.whiteKeyWidth);
        const width = item.whiteKeyCount * value + unit;
        return {
            width,
            backgroundColor: item.color,
            height: props.height,
            flexShrink: 0,
            pointerEvents: 'none',
        };
    };
});
const groupNameStyle = computed(() => {
    return (item) => {
        const { value, unit } = parseAndFormatDimension(props.whiteKeyWidth);
        const width = item.whiteKeyCount * value + unit;
        return {
            width,
            backgroundColor: item.color,
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
            bottom: 0,
            pointerEvents: 'none',
        };
    };
});
// 音程尺
const intervalRulerStyle = computed(() => {
    const { value, unit } = parseAndFormatDimension(props.whiteKeyWidth);
    const res = {
        width: value * 26 + unit,
        height: props.height,
        backgroundColor: 'white',
        boxShadow: '0px 0px 5px 2px rgba(200,200,200,1)',
        borderRadius: '10px',
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
    };
    return res;
});
// 音程尺刻度样式
const intervalRulerTickStyle = computed(() => {
    return (index) => {
        const { value, unit } = parseAndFormatDimension(props.height);
        const res = {
            width: '1px',
            height: index % 2 ? (value * 0.1 + unit) : (value * 0.07 + unit),
            backgroundColor: '#111',
        };
        return res;
    };
});
const intervalRulerData = ref([
    { name: '纯一度', semitones: 0, wholeTones: 0 },
    { name: '小二度', semitones: 1, wholeTones: 0.5 },
    { name: '大二度', semitones: 2, wholeTones: 1 },
    { name: '小三度', semitones: 3, wholeTones: 1.5 },
    { name: '大三度', semitones: 4, wholeTones: 2 },
    { name: '纯四度', semitones: 5, wholeTones: 2.5 },
    { name: '增四度', semitones: 6, wholeTones: 3 },
    { name: '纯五度', semitones: 7, wholeTones: 3.5 },
    { name: '小六度', semitones: 8, wholeTones: 4 },
    { name: '大六度', semitones: 9, wholeTones: 4.5 },
    { name: '小七度', semitones: 10, wholeTones: 5 },
    { name: '大七度', semitones: 11, wholeTones: 5.5 },
    { name: '纯八度', semitones: 12, wholeTones: 6 },
    { name: '小九度', semitones: 13, wholeTones: 6.5 },
    { name: '大九度', semitones: 14, wholeTones: 7 },
    { name: '小十度', semitones: 15, wholeTones: 7.5 },
    { name: '大十度', semitones: 16, wholeTones: 8 },
    { name: '纯十一度', semitones: 17, wholeTones: 8.5 },
    { name: '增十一度', semitones: 18, wholeTones: 9 },
    { name: '纯十二度', semitones: 19, wholeTones: 9.5 },
    { name: '小十三度', semitones: 20, wholeTones: 10 },
    { name: '大十三度', semitones: 21, wholeTones: 10.5 },
    { name: '小十四度', semitones: 22, wholeTones: 11 },
    { name: '大十四度', semitones: 23, wholeTones: 11.5 },
    { name: '纯十五度', semitones: 24, wholeTones: 12 },
]);
const intervalRulerItemStyle = computed(() => {
    const res = {
        width: props.whiteKeyWidth,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
    };
    return res;
});
// 和弦滑块
const chordList = ref([
    // 三和弦 Triads
    { name: '大三和弦', keyList: [0, 4, 7] }, // Major
    { name: '小三和弦', keyList: [0, 3, 7] }, // Minor
    { name: '增三和弦', keyList: [0, 4, 8] }, // Augmented
    { name: '减三和弦', keyList: [0, 3, 6] }, // Diminished
    { name: '挂四和弦', keyList: [0, 5, 7] }, // Sus4
    { name: '挂二和弦', keyList: [0, 2, 7] }, // Sus2
    // 七和弦 Seventh Chords
    { name: '大七和弦', keyList: [0, 4, 7, 11] }, // Major 7 (maj7)
    { name: '属七和弦', keyList: [0, 4, 7, 10] }, // Dominant 7 (7)
    { name: '小七和弦', keyList: [0, 3, 7, 10] }, // Minor 7 (m7)
    { name: '半减七和弦', keyList: [0, 3, 6, 10] }, // Half-diminished 7 (m7♭5)
    { name: '减七和弦', keyList: [0, 3, 6, 9] }, // Fully diminished 7 (dim7)
    { name: '小大七和弦', keyList: [0, 3, 7, 11] }, // Minor Major 7 (mMaj7)
    { name: '增大七和弦', keyList: [0, 4, 8, 11] }, // Augmented Major 7 (augMaj7)
    { name: '增七和弦', keyList: [0, 4, 8, 10] }, // Augmented 7 (aug7)
    // 六和弦 Sixth Chords
    { name: '大六和弦', keyList: [0, 4, 7, 9] }, // Major 6 (6)
    { name: '小六和弦', keyList: [0, 3, 7, 9] }, // Minor 6 (m6)
    // 九和弦 Ninth Chords
    { name: '属九和弦', keyList: [0, 4, 7, 10, 14] }, // 9
    { name: '大九和弦', keyList: [0, 4, 7, 11, 14] }, // maj9
    { name: '小九和弦', keyList: [0, 3, 7, 10, 14] }, // m9
    // 十一和弦 Eleventh Chords
    { name: '属十一和弦', keyList: [0, 4, 7, 10, 14, 17] }, // 11
    { name: '小十一和弦', keyList: [0, 3, 7, 10, 14, 17] }, // m11
    { name: '大十一和弦', keyList: [0, 4, 7, 11, 14, 17] }, // maj11
    // 十三和弦 Thirteenth Chords
    { name: '属十三和弦', keyList: [0, 4, 7, 10, 14, 21] }, // 13
    { name: '小十三和弦', keyList: [0, 3, 7, 10, 14, 21] }, // m13
    { name: '大十三和弦', keyList: [0, 4, 7, 11, 14, 21] }, // maj13
    // 其他常见扩展与变化
    { name: 'sus4 加七', keyList: [0, 5, 7, 10] }, // 7sus4
    { name: 'sus2 加七', keyList: [0, 2, 7, 10] }, // 7sus2
    { name: '大七#11', keyList: [0, 4, 7, 11, 18] }, // maj7#11
    { name: '大七#5', keyList: [0, 4, 8, 11] }, // maj7#5
    { name: '属七b9', keyList: [0, 4, 7, 10, 13] }, // 7b9
    { name: '属七#9', keyList: [0, 4, 7, 10, 15] }, // 7#9
]);
const chordBoxStyle = computed(() => {
    const { value, unit } = parseAndFormatDimension(props.whiteKeyWidth);
    const whiteKeyWidth = props.whiteKeyWidth;
    return {
        width: value * 5 + unit,
        height: value * 1 + unit,
        backgroundColor: 'white',
        boxShadow: '0px 0px 5px 2px rgba(200,200,200,1)',
        bottom: '0',
        borderRadius: '10px',
        position: 'absolute',
        display: 'flex'
    };
});
const curChord = ref({
    name: '大三和弦',
    keyList: [0, 4, 7]
});
const chordBoxRef = ref(null);
const curActiveChordMidi = ref(new Set());
function chordBoxPointerDown(event) {
    const el = event.target;
    el.setPointerCapture(event.pointerId);
    // 滑块距离左侧位置 TODO 因为这里的left只能是px,所以外部传入的值也必须px,否则计算出错
    const { value: left, unit } = parseAndFormatDimension(getComputedStyle(chordBoxRef.value).left);
    // 键盘起始midi
    const startMidi = props.midi.min;
    // 起始midi固定唱名索引
    const solmizationIndex = startMidi % 12; // 比如21键起始9
    // 计算左侧未出现的已经经过的当前组的宽度，只计算白键
    const passWidth = {
        '0': 0,
        '1': 1,
        '2': 1,
        '3': 2,
        '4': 2,
        '5': 3,
        '6': 4,
        '7': 4,
        '8': 5,
        '9': 5,
        '10': 6,
        '11': 6
    }['' + solmizationIndex] * whiteKeyWidthNum.value;
    // 当前琴键已经走过的八度
    const baseMidi = (Math.floor((left + passWidth) / (whiteKeyWidthNum.value * 7)) + Math.floor(startMidi / 12)) * 12; // 比如21键,baseMidi=12
    // 每组对应位置相对增加点midi值
    const relativeMidiAdd = [{
            relativeMidi: 0,
            gte: 0,
            lt: whiteKeyWidthNum.value - blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 1,
            gte: whiteKeyWidthNum.value - blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value + blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 2,
            gte: whiteKeyWidthNum.value + blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 2 - blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 3,
            gte: whiteKeyWidthNum.value * 2 - blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 2 + blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 4,
            gte: whiteKeyWidthNum.value * 2 + blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 3
        }, {
            relativeMidi: 5,
            gte: whiteKeyWidthNum.value * 3,
            lt: whiteKeyWidthNum.value * 4 - blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 6,
            gte: whiteKeyWidthNum.value * 4 - blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 4 + blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 7,
            gte: whiteKeyWidthNum.value * 4 + blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 5 - blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 8,
            gte: whiteKeyWidthNum.value * 5 - blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 5 + blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 9,
            gte: whiteKeyWidthNum.value * 5 + blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 6 - blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 10,
            gte: whiteKeyWidthNum.value * 6 - blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 6 + blackKeyWidthNum.value / 2
        }, {
            relativeMidi: 11,
            gte: whiteKeyWidthNum.value * 6 + blackKeyWidthNum.value / 2,
            lt: whiteKeyWidthNum.value * 7
        }];
    let midiAdd = relativeMidiAdd.find((e) => {
        const relativeLeft = (left + passWidth) % (7 * whiteKeyWidthNum.value);
        if (relativeLeft >= e.gte && relativeLeft < e.lt) {
            return true;
        }
    }).relativeMidi;
    let midi = baseMidi + midiAdd;
    // 特殊逻辑，如果当前钢琴以白键开始，但是原本左侧的0.5的黑键还会参与计算就会导致计算出错,这里进行修正
    if (midi < startMidi) {
        midi = startMidi;
    }
    // 高亮和弦对应琴键
    curChord.value.keyList.forEach(key => {
        curActiveChordMidi.value.add(key + midi);
        emitKey('keyDown', key + midi);
    });
}
function chordBoxPointerUp(event) {
    const el = event.currentTarget;
    el.releasePointerCapture(event.pointerId);
    curActiveChordMidi.value.forEach((midi => {
        emitKey('keyUp', midi);
    }));
    curActiveChordMidi.value.clear();
}
// 键盘事件
onMounted(() => {
    document.addEventListener('keydown', e => {
        if (activeKeys.value)
            props.config.keyboard.forEach(key => {
                if (e.code === key.code && !activeKeys.value.has(key.midi)) {
                    console.log('chicken', '按下');
                    emitKey('keyDown', key.midi);
                }
            });
    });
    document.addEventListener('keyup', e => {
        props.config.keyboard.forEach(key => {
            if (e.code === key.code && activeKeys.value.has(key.midi)) {
                emitKey('keyUp', key.midi);
            }
        });
    });
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['white-key']} */ ;
/** @type {__VLS_StyleScopedClasses['black-key']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['hide-scrollbar']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: (__VLS_ctx.pianoContainerStyle) },
    ...{ class: "ds-piano-container hide-scrollbar stack" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stackItem" },
    comment: "白键和黑键",
});
for (const [wk] of __VLS_getVForSourceType((__VLS_ctx.whiteKeys))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onPointerdown: (...[$event]) => {
                __VLS_ctx.handlePointerDown($event, wk);
            } },
        ...{ onPointerup: (...[$event]) => {
                __VLS_ctx.handlePointerUp($event, wk);
            } },
        key: (wk.midi),
        ...{ class: ({ active: __VLS_ctx.isKeyActive(wk.midi) }) },
        ...{ style: ({
                width: props.whiteKeyWidth,
                height: '100%',
                position: 'absolute',
                left: __VLS_ctx.leftForWhiteByIndex(wk.whiteIndex)
            }) },
        ...{ class: "white-key" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "noteName" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.pitchNotation !== 'None') }, null, null);
    (__VLS_ctx.pitchNotation === 'Scientific' ? __VLS_ctx.noteNameToNoteString(__VLS_ctx.midiToNoteName(wk.midi, __VLS_ctx.AccidentalEnum.Sharp)) : __VLS_ctx.noteNameToHelmholtz(__VLS_ctx.midiToNoteName(wk.midi, __VLS_ctx.AccidentalEnum.Sharp)));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
for (const [bk] of __VLS_getVForSourceType((__VLS_ctx.blackKeys))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onPointerdown: (...[$event]) => {
                __VLS_ctx.handlePointerDown($event, bk);
            } },
        ...{ onPointerup: (...[$event]) => {
                __VLS_ctx.handlePointerUp($event, bk);
            } },
        key: (bk.midi),
        ...{ class: ({ active: __VLS_ctx.isKeyActive(bk.midi) }) },
        ...{ style: ({
                width: __VLS_ctx.blackKeyWidthNum + __VLS_ctx.keyUnit,
                height: __VLS_ctx.blackKeyHeightNum + __VLS_ctx.keyUnit,
                left: __VLS_ctx.leftForBlackByMidi(bk.midi),
            }) },
        ...{ class: "black-key" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "noteNameSharp" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.pitchNotation !== 'None') }, null, null);
    (__VLS_ctx.pitchNotation === 'Scientific' ? bk.scientificNoteName[0] : bk.helmholtzNoteName[0]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "noteNameFlat" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.pitchNotation !== 'None') }, null, null);
    (__VLS_ctx.pitchNotation === 'Scientific' ? bk.scientificNoteName[1] : bk.helmholtzNoteName[1]);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stackItem group" },
    comment: "分组遮罩",
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.group) }, null, null);
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.groupMaskList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (item.groupName),
        ...{ style: (__VLS_ctx.groupStyle(item)) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ height: 0, zIndex: 100 }) },
    ...{ class: "stackItem " },
    comment: "滑块功能层",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ pointerEvents: 'none', height: __VLS_ctx.containerHeightNum * 0.2 + __VLS_ctx.containerHeightUnit }) },
    ...{ class: "groupName" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.group) }, null, null);
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.groupMaskList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (item.groupName),
        ...{ style: (__VLS_ctx.groupNameStyle(item)) },
    });
    (item.groupName);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: (__VLS_ctx.intervalRulerStyle) },
    comment: "音程尺",
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.intervalRuler) }, null, null);
__VLS_asFunctionalDirective(__VLS_directives.vDrag)(null, { ...__VLS_directiveBindingRestFields, value: ({ enabled: true, axis: 'x', limit: true }) }, null, null);
for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.intervalRulerData))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.intervalRulerItemStyle) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ writingMode: 'vertical-rl' }) },
    });
    (item.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.intervalRulerTickStyle(index)) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chordBoxRef",
    ...{ style: (__VLS_ctx.chordBoxStyle) },
    comment: "和弦滑块",
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.chordBox) }, null, null);
__VLS_asFunctionalDirective(__VLS_directives.vDrag)(null, { ...__VLS_directiveBindingRestFields, value: ({ enabled: true, axis: 'x', limit: true }) }, null, null);
/** @type {typeof __VLS_ctx.chordBoxRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.curChord),
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.chordList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        label: (item.name),
        value: (item),
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onPointerup: (...[$event]) => {
            __VLS_ctx.chordBoxPointerUp($event);
        } },
    ...{ onPointerdown: (...[$event]) => {
            __VLS_ctx.chordBoxPointerDown($event);
        } },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['ds-piano-container']} */ ;
/** @type {__VLS_StyleScopedClasses['hide-scrollbar']} */ ;
/** @type {__VLS_StyleScopedClasses['stack']} */ ;
/** @type {__VLS_StyleScopedClasses['stackItem']} */ ;
/** @type {__VLS_StyleScopedClasses['white-key']} */ ;
/** @type {__VLS_StyleScopedClasses['noteName']} */ ;
/** @type {__VLS_StyleScopedClasses['black-key']} */ ;
/** @type {__VLS_StyleScopedClasses['noteNameSharp']} */ ;
/** @type {__VLS_StyleScopedClasses['noteNameFlat']} */ ;
/** @type {__VLS_StyleScopedClasses['stackItem']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['stackItem']} */ ;
/** @type {__VLS_StyleScopedClasses['groupName']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AccidentalEnum: AccidentalEnum,
            midiToNoteName: midiToNoteName,
            noteNameToHelmholtz: noteNameToHelmholtz,
            noteNameToNoteString: noteNameToNoteString,
            vDrag: vDrag,
            whiteKeys: whiteKeys,
            blackKeys: blackKeys,
            containerHeightNum: containerHeightNum,
            containerHeightUnit: containerHeightUnit,
            keyUnit: keyUnit,
            blackKeyWidthNum: blackKeyWidthNum,
            blackKeyHeightNum: blackKeyHeightNum,
            pianoContainerStyle: pianoContainerStyle,
            leftForWhiteByIndex: leftForWhiteByIndex,
            leftForBlackByMidi: leftForBlackByMidi,
            handlePointerDown: handlePointerDown,
            handlePointerUp: handlePointerUp,
            isKeyActive: isKeyActive,
            groupMaskList: groupMaskList,
            groupStyle: groupStyle,
            groupNameStyle: groupNameStyle,
            intervalRulerStyle: intervalRulerStyle,
            intervalRulerTickStyle: intervalRulerTickStyle,
            intervalRulerData: intervalRulerData,
            intervalRulerItemStyle: intervalRulerItemStyle,
            chordList: chordList,
            chordBoxStyle: chordBoxStyle,
            curChord: curChord,
            chordBoxRef: chordBoxRef,
            chordBoxPointerDown: chordBoxPointerDown,
            chordBoxPointerUp: chordBoxPointerUp,
        };
    },
    __typeEmits: {},
    props: {
        height: { type: String, default: '180px' },
        whiteKeyWidth: { type: String, default: '40px' },
        blackKeyWidthRatio: {
            type: Number,
            default: 0.7
        },
        blackKeyHeightRatio: {
            type: Number,
            default: 0.65
        },
        config: {
            type: Object,
            default: () => ({
                keyboard: defaultCodeConfig
            })
        },
        midi: {
            type: Object,
            default: () => ({ min: 21, max: 108 })
        },
        pitchNotation: {
            type: String, // Scientific Helmholtz None
            default: 'None'
        },
        intervalRuler: {
            type: Boolean,
            default: false
        },
        chordBox: {
            type: Boolean,
            default: false
        },
        group: {
            type: Boolean,
            default: false
        },
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    props: {
        height: { type: String, default: '180px' },
        whiteKeyWidth: { type: String, default: '40px' },
        blackKeyWidthRatio: {
            type: Number,
            default: 0.7
        },
        blackKeyHeightRatio: {
            type: Number,
            default: 0.65
        },
        config: {
            type: Object,
            default: () => ({
                keyboard: defaultCodeConfig
            })
        },
        midi: {
            type: Object,
            default: () => ({ min: 21, max: 108 })
        },
        pitchNotation: {
            type: String, // Scientific Helmholtz None
            default: 'None'
        },
        intervalRuler: {
            type: Boolean,
            default: false
        },
        chordBox: {
            type: Boolean,
            default: false
        },
        group: {
            type: Boolean,
            default: false
        },
    },
});
; /* PartiallyEnd: #4569/main.vue */
