import { CSSProperties, PropType } from 'vue';
import { KeyCodeEnum } from "../../types/enum";
declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    width: {
        type: StringConstructor;
        default: string;
    };
    height: {
        type: StringConstructor;
        default: string;
    };
    highlightStyle: {
        type: () => CSSProperties;
        default: () => {
            backgroundColor: string;
            color: string;
        };
    };
    config: {
        type: PropType<{
            code: KeyCodeEnum;
            showText?: string;
            fontSize?: string;
        }[]>;
        default: () => never[];
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    keyDown: (...args: any[]) => void;
    keyUp: (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    width: {
        type: StringConstructor;
        default: string;
    };
    height: {
        type: StringConstructor;
        default: string;
    };
    highlightStyle: {
        type: () => CSSProperties;
        default: () => {
            backgroundColor: string;
            color: string;
        };
    };
    config: {
        type: PropType<{
            code: KeyCodeEnum;
            showText?: string;
            fontSize?: string;
        }[]>;
        default: () => never[];
    };
}>> & Readonly<{
    onKeyDown?: (...args: any[]) => any;
    onKeyUp?: (...args: any[]) => any;
}>, {
    width: string;
    height: string;
    config: {
        code: KeyCodeEnum;
        showText?: string;
        fontSize?: string;
    }[];
    highlightStyle: CSSProperties;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
