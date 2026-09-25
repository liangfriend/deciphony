import { PropType } from 'vue';
import { KeyCodeEnum } from "../../types/enum";
import { HighlightPolicy } from "@/types/types";
/** 播放函数 */
declare function play(): void;
/** 暂停函数 */
declare function pause(): void;
/** 停止函数（回到开头） */
declare function stop(): void;
declare function clearActiveParts(): void;
declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    height: {
        type: StringConstructor;
        default: string;
    };
    whiteKeyWidth: {
        type: StringConstructor;
        default: string;
    };
    blackKeyWidthRatio: {
        type: NumberConstructor;
        default: number;
    };
    config: {
        type: PropType<{
            keyboard: {
                code: KeyCodeEnum;
                midi: number;
            }[];
        }>;
        default: () => {
            keyboard: {
                code: string;
                midi: number;
            }[];
        };
    };
    bpm: {
        type: NumberConstructor;
        default: number;
    };
    columnHeightConstant: {
        type: NumberConstructor;
        default: number;
    };
    prepareTime: {
        type: NumberConstructor;
        default: number;
    };
    performSequence: {
        default: () => {
            '60': number[][];
            '61': number[][];
            '62': number[][];
        };
    };
    midi: {
        type: PropType<{
            min: number;
            max: number;
        }>;
        default: () => {
            min: number;
            max: number;
        };
    };
    baseLineBottom: {
        type: NumberConstructor;
        default: number;
    };
    highlightPolicy: {
        type: PropType<Partial<HighlightPolicy>>;
        default: () => {};
    };
}>, {
    play: typeof play;
    pause: typeof pause;
    stop: typeof stop;
    clearActiveParts: typeof clearActiveParts;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    height: {
        type: StringConstructor;
        default: string;
    };
    whiteKeyWidth: {
        type: StringConstructor;
        default: string;
    };
    blackKeyWidthRatio: {
        type: NumberConstructor;
        default: number;
    };
    config: {
        type: PropType<{
            keyboard: {
                code: KeyCodeEnum;
                midi: number;
            }[];
        }>;
        default: () => {
            keyboard: {
                code: string;
                midi: number;
            }[];
        };
    };
    bpm: {
        type: NumberConstructor;
        default: number;
    };
    columnHeightConstant: {
        type: NumberConstructor;
        default: number;
    };
    prepareTime: {
        type: NumberConstructor;
        default: number;
    };
    performSequence: {
        default: () => {
            '60': number[][];
            '61': number[][];
            '62': number[][];
        };
    };
    midi: {
        type: PropType<{
            min: number;
            max: number;
        }>;
        default: () => {
            min: number;
            max: number;
        };
    };
    baseLineBottom: {
        type: NumberConstructor;
        default: number;
    };
    highlightPolicy: {
        type: PropType<Partial<HighlightPolicy>>;
        default: () => {};
    };
}>> & Readonly<{}>, {
    height: string;
    config: {
        keyboard: {
            code: KeyCodeEnum;
            midi: number;
        }[];
    };
    bpm: number;
    midi: {
        min: number;
        max: number;
    };
    whiteKeyWidth: string;
    blackKeyWidthRatio: number;
    prepareTime: number;
    performSequence: {
        '60': number[][];
        '61': number[][];
        '62': number[][];
    };
    highlightPolicy: HighlightPolicy;
    columnHeightConstant: number;
    baseLineBottom: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
