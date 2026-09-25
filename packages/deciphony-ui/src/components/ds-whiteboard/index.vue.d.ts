import { Ref } from 'vue';
import { AddElementOptions } from "./types";
import { whiteBoardState } from "./enum";
import { ElementSerializedData, WhiteboardSerializedData } from "@/types/types";
declare function cacheElement(element: Element, key?: string): void;
declare function delCacheElement(key?: string): void;
declare function addElement(options: AddElementOptions, key?: string): void;
declare function exportJson(): string;
declare function importJson(jsonData: string | WhiteboardSerializedData, elementFactory: (data: ElementSerializedData) => Element): void;
declare function switchState(param: whiteBoardState): void;
declare var __VLS_1: {};
type __VLS_Slots = {} & {
    menu?: (props: typeof __VLS_1) => any;
};
declare const __VLS_component: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    width: {
        type: NumberConstructor;
        default: string;
    };
    height: {
        type: NumberConstructor;
        default: string;
    };
    floatBoardWidth: {
        type: NumberConstructor;
        default: string;
    };
    floatBoardHeight: {
        type: NumberConstructor;
        default: string;
    };
    floatBoardPosition: {
        type: StringConstructor;
        default: string;
    };
    drag: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, {
    addElement: typeof addElement;
    cacheElement: typeof cacheElement;
    delCacheElement: typeof delCacheElement;
    switchState: typeof switchState;
    state: Ref<whiteBoardState, whiteBoardState>;
    exportJson: typeof exportJson;
    importJson: typeof importJson;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    width: {
        type: NumberConstructor;
        default: string;
    };
    height: {
        type: NumberConstructor;
        default: string;
    };
    floatBoardWidth: {
        type: NumberConstructor;
        default: string;
    };
    floatBoardHeight: {
        type: NumberConstructor;
        default: string;
    };
    floatBoardPosition: {
        type: StringConstructor;
        default: string;
    };
    drag: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{}>, {
    width: number;
    height: number;
    drag: boolean;
    floatBoardWidth: number;
    floatBoardHeight: number;
    floatBoardPosition: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const _default: __VLS_WithSlots<typeof __VLS_component, __VLS_Slots>;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
