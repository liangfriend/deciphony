<script lang="ts" setup>
import {computed, CSSProperties, onMounted, PropType, ref} from 'vue'
import {parseAndFormatDimension} from '../../utils/commonUtil'
import {AccidentalEnum, midiToNoteName, noteNameToHelmholtz, noteNameToNoteString} from "deciphony-core";
import vDrag from '../../directivces/drag';
import {KeyCodeEnum} from "../../types/enum";

defineOptions({
    name: 'DsPianoWaterfall'
})

const props = defineProps({
    height: {type: String, default: '180px'},
    whiteKeyWidth: {type: String, default: '40px'},
    blackKeyWidthRatio: {
        type: Number,
        default: 0.7
    },
    config: {
        type: Object as PropType<{
            keyboard: {
                code: KeyCodeEnum,
                midi: number,
            }[]
        }>,
        default: () => ({
            keyboard: [{
                code: 'KeyA',
                midi: 21,
            }]
        })
    },
    bpm: {
        type: Number,
        default: 120
    },
    toneSequence: {
        default: () => {
            return {
                '60': [[0, 20], [40, 60]],
                '61': [[20, 20], [40, 60]],
            }
        }
    },
    midi: {
        type: Object as PropType<{
            min: number
            max: number
        }>,
        default: () => ({min: 21, max: 108})
    },
})

/** 判断该 midi 是否为黑键（1,3,6,8,10 实际上是 1,3,6,8,10 — 但你之前用 1,3,5,8,10；通常 black indices: 1,3,6,8,10） */
function isBlackKey(midi: number) {
    const noteIndex = midi % 12
    return [1, 3, 6, 8, 10].includes(noteIndex)
}

/** 解析容器高度，单位*/
const containerHeightNum = computed(() => {
    const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)
    return containerHeightNum
})
const containerHeightUnit = computed(() => {
    const {value: containerHeightNum, unit: heightUnit} = parseAndFormatDimension(props.height)
    return heightUnit
})
/** 解析白键宽、容器高度单位/数值 */
const whiteKeyWidthNum = computed(() => {
    const {value: whiteKeyWidthNum, unit} = parseAndFormatDimension(props.whiteKeyWidth)
    return whiteKeyWidthNum
})
const keyUnit = computed(() => {
    const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
    return unit
})

/** 样式 - 外容器（带滚动） */
const pianoContainerStyle = computed((): CSSProperties => ({
    width: totalWidth.value,
    height: props.height,
    position: 'relative',
    background: '#eee',
    userSelect: 'none',
    display: 'flex',

}))
const keyStyle = computed(() => {
    // props.whiteKeyWidth 例 100
    // props.blackKeyWidthRatio 例 0.6
    // midi=60的宽度就是100 - 0.6/2*100（黑键的一半） = 70
    console.log('chicken',)
    return (midi: number) => {
        let width = 0
        switch (midi % 12) {
            case 0: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                break
            }
            case 1: {
                width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
                break
            }
            case 2: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value
                break
            }
            case 3: {
                width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
                break
            }
            case 4: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                break
            }
            case 5: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                break
            }
            case 6: {
                width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
                break
            }
            case 7: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value
                break
            }
            case 8: {
                width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
                break
            }
            case 9: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value
                break
            }
            case 10: {
                width = whiteKeyWidthNum.value * props.blackKeyWidthRatio
                break
            }
            case 11: {
                width = whiteKeyWidthNum.value - props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                break
            }

        }
        console.log(midi, width, whiteKeyWidthNum.value)
        // 开始位置偏差
        if (midi === props.midi.min) {
            switch (midi % 12) {
                case 2: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                }

                case 4: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }
                case 7: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }

                case 9: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }

                case 11: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }
            }
            // 黑键开始
            if ([1, 3, 6, 8, 10].includes(midi % 12)) {
                width -= props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
            }
        }
        // 结束位置偏差
        if (midi === props.midi.max) {
            switch (midi % 12) {
                case 0: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }

                case 2: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }
                case 4: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }

                case 5: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }

                case 7: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }
                case 9: {
                    width += props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
                    break
                }
            }
            // 黑键结束
            if ([1, 3, 6, 8, 10].includes(midi % 12)) {
                width -= props.blackKeyWidthRatio * whiteKeyWidthNum.value / 2
            }
        }
        const res = {
            width: width + keyUnit.value,
            height: '100%',
            flexShrink: 0,
        }
        return res
    }
})

/** 按键交互 */
const activeKeys = ref<Set<number>>(new Set())
const emits = defineEmits<{
    (e: 'keyDown', key: {
        midi: number
        black: boolean
        scientificNoteName: string[]
        helmholtzNoteName: string[]
    }): void
    (e: 'keyUp', key: {
        midi: number
        black: boolean
        scientificNoteName: string[]
        helmholtzNoteName: string[]
    }): void
}>()

function emitKey(type: 'keyUp' | 'keyDown', midi: number) {
    if (!activeKeys.value.has(midi) && type === 'keyDown') {
        activeKeys.value.add(midi)
    } else if (activeKeys.value.has(midi) && type === 'keyUp') {
        activeKeys.value.delete(midi)
    }
    // 抛出事件
    const keyInfo = {
        midi: midi,
        black: isBlackKey(midi),
        scientificNoteName: [noteNameToNoteString(midiToNoteName(midi, AccidentalEnum.Sharp)), noteNameToNoteString(midiToNoteName(midi, AccidentalEnum.Flat))],
        helmholtzNoteName: [noteNameToHelmholtz(midiToNoteName(midi, AccidentalEnum.Sharp)), noteNameToHelmholtz(midiToNoteName(midi, AccidentalEnum.Flat))],
    }
    if (type === 'keyDown') {
        emits('keyDown', keyInfo)
    } else {
        emits('keyUp', keyInfo)
    }
    // 这样写报错,但是并没有错误，ts bug
    // emits(type, keyInfo)
}

function handlePointerDown(event: PointerEvent, key: {
    midi: number
    black: boolean
    scientificNoteName: [string, string]
    helmholtzNoteName: [string, string]
}) {
    emitKey('keyDown', key.midi)
    const el = event.target as HTMLAnchorElement
    el.setPointerCapture(event.pointerId);

}

function handlePointerUp(event: PointerEvent, key: {
    midi: number
    black: boolean
    scientificNoteName: [string, string]
    helmholtzNoteName: [string, string]
}) {
    emitKey('keyUp', key.midi)
    const el = event.target as HTMLAnchorElement
    el.releasePointerCapture(event.pointerId);
}

function isKeyActive(midi: number) {
    return activeKeys.value.has(midi)
}

/* 整体宽度 */
const totalWidth = computed(() => {
    let whiteKeyCount = 0
    for (let i = props.midi.min; i <= props.midi.max; i++) {
        if (isWhiteKey(i)) {
            whiteKeyCount += 1
        }
    }
    const {value, unit} = parseAndFormatDimension(props.whiteKeyWidth)
    return value * whiteKeyCount + unit
})

/** 判断是否是白键 */
function isWhiteKey(midi: number) {
    const noteIndex = midi % 12
    return ![1, 3, 6, 8, 10].includes(noteIndex)
}


// 键盘事件

onMounted(() => {
    document.addEventListener('keydown', e => {
        props.config.keyboard.forEach(key => {
            if (e.code === key.code) {
                emitKey('keyDown', key.midi)
            }
        })
    })
    document.addEventListener('keyup', e => {
        props.config.keyboard.forEach(key => {
            if (e.code === key.code) {
                emitKey('keyUp', key.midi)
            }
        })
    })
})
</script>

<template>
    <div :style="pianoContainerStyle" class=" hide-scrollbar ">
        <div
            v-for="midi in Array.from({ length: midi.max - midi.min + 1 }, (_, i) =>midi.min + i)"
            :key="midi"
            :style="keyStyle(midi)"
            @pointerdown="handlePointerDown($event)"
            @pointerup="handlePointerUp($event)"
        >
            <slot></slot>
        </div>


    </div>

</template>

<style scoped>

.hide-scrollbar {
    -ms-overflow-style: none; /* IE & Edge */
    scrollbar-width: none; /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome */
}
</style>
<style scoped>
.stack {
    position: relative;
    height: 100%;
    width: 100%;
}

.stackItem {
    pointer-events: none;
    position: absolute;
    height: 100%;
    width: 100%;

    > * {
        pointer-events: auto;
    }
}


</style>
