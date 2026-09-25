declare var __VLS_5: {}, __VLS_23: {};
type __VLS_Slots = {} & {
    title?: (props: typeof __VLS_5) => any;
} & {
    default?: (props: typeof __VLS_23) => any;
};
declare const __VLS_component: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    modelValue: {
        type: BooleanConstructor;
        default: boolean;
    };
    initialX: {
        type: NumberConstructor;
        default: number;
    };
    initialY: {
        type: NumberConstructor;
        default: number;
    };
    center: {
        type: BooleanConstructor;
        default: boolean;
    };
    dragHandleHeight: {
        type: NumberConstructor;
        default: number;
    };
    onlyLeftHandleWidth: {
        type: NumberConstructor;
        default: null;
    };
    restrictToViewport: {
        type: BooleanConstructor;
        default: boolean;
    };
    title: {
        type: StringConstructor;
        default: string;
    };
    zIndex: {
        type: NumberConstructor;
        default: number;
    };
    height: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: StringConstructor;
        default: string;
    };
    ballImage: {
        type: StringConstructor;
        default: string;
    };
    ballSize: {
        type: NumberConstructor;
        default: number;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: (...args: any[]) => void;
    move: (...args: any[]) => void;
    "update:modelValue": (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    modelValue: {
        type: BooleanConstructor;
        default: boolean;
    };
    initialX: {
        type: NumberConstructor;
        default: number;
    };
    initialY: {
        type: NumberConstructor;
        default: number;
    };
    center: {
        type: BooleanConstructor;
        default: boolean;
    };
    dragHandleHeight: {
        type: NumberConstructor;
        default: number;
    };
    onlyLeftHandleWidth: {
        type: NumberConstructor;
        default: null;
    };
    restrictToViewport: {
        type: BooleanConstructor;
        default: boolean;
    };
    title: {
        type: StringConstructor;
        default: string;
    };
    zIndex: {
        type: NumberConstructor;
        default: number;
    };
    height: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: StringConstructor;
        default: string;
    };
    ballImage: {
        type: StringConstructor;
        default: string;
    };
    ballSize: {
        type: NumberConstructor;
        default: number;
    };
}>> & Readonly<{
    onClose?: (...args: any[]) => any;
    onMove?: (...args: any[]) => any;
    "onUpdate:modelValue"?: (...args: any[]) => any;
}>, {
    width: string;
    height: string;
    center: boolean;
    title: string;
    zIndex: number;
    modelValue: boolean;
    initialX: number;
    initialY: number;
    dragHandleHeight: number;
    onlyLeftHandleWidth: number;
    restrictToViewport: boolean;
    ballImage: string;
    ballSize: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const _default: __VLS_WithSlots<typeof __VLS_component, __VLS_Slots>;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
