import { PropType } from 'vue';
import { KeyCodeEnum } from "../../types/enum";
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
    blackKeyHeightRatio: {
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
    pitchNotation: {
        type: StringConstructor;
        default: string;
    };
    intervalRuler: {
        type: BooleanConstructor;
        default: boolean;
    };
    chordBox: {
        type: BooleanConstructor;
        default: boolean;
    };
    group: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    keyDown: (key: {
        midi: number;
        black: boolean;
        scientificNoteName: string[];
        helmholtzNoteName: string[];
    }) => any;
    keyUp: (key: {
        midi: number;
        black: boolean;
        scientificNoteName: string[];
        helmholtzNoteName: string[];
    }) => any;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
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
    blackKeyHeightRatio: {
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
    pitchNotation: {
        type: StringConstructor;
        default: string;
    };
    intervalRuler: {
        type: BooleanConstructor;
        default: boolean;
    };
    chordBox: {
        type: BooleanConstructor;
        default: boolean;
    };
    group: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{
    onKeyDown?: (key: {
        midi: number;
        black: boolean;
        scientificNoteName: string[];
        helmholtzNoteName: string[];
    }) => any;
    onKeyUp?: (key: {
        midi: number;
        black: boolean;
        scientificNoteName: string[];
        helmholtzNoteName: string[];
    }) => any;
}>, {
    height: string;
    config: {
        keyboard: {
            code: KeyCodeEnum;
            midi: number;
        }[];
    };
    midi: {
        min: number;
        max: number;
    };
    group: boolean;
    whiteKeyWidth: string;
    blackKeyWidthRatio: number;
    blackKeyHeightRatio: number;
    pitchNotation: string;
    intervalRuler: boolean;
    chordBox: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
