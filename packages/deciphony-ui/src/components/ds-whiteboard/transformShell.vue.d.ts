import { PropType, Ref } from 'vue';
declare var __VLS_1: {};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_1) => any;
};
declare const __VLS_component: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    initX: {
        type: NumberConstructor;
        default: number;
    };
    initY: {
        type: NumberConstructor;
        default: number;
    };
    initW: {
        type: NumberConstructor;
        default: number;
    };
    initH: {
        type: NumberConstructor;
        default: number;
    };
    initAngle: {
        type: NumberConstructor;
        default: number;
    };
    mode: {
        type: PropType<Ref<string>>;
        default: Ref<string, string>;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    update: (rect: {
        x: number;
        y: number;
        w: number;
        h: number;
        angle: number;
    }) => any;
    mousedown: (ev: MouseEvent) => any;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    initX: {
        type: NumberConstructor;
        default: number;
    };
    initY: {
        type: NumberConstructor;
        default: number;
    };
    initW: {
        type: NumberConstructor;
        default: number;
    };
    initH: {
        type: NumberConstructor;
        default: number;
    };
    initAngle: {
        type: NumberConstructor;
        default: number;
    };
    mode: {
        type: PropType<Ref<string>>;
        default: Ref<string, string>;
    };
}>> & Readonly<{
    onUpdate?: (rect: {
        x: number;
        y: number;
        w: number;
        h: number;
        angle: number;
    }) => any;
    onMousedown?: (ev: MouseEvent) => any;
}>, {
    mode: Ref<string, string>;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
    initAngle: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const _default: __VLS_WithSlots<typeof __VLS_component, __VLS_Slots>;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
