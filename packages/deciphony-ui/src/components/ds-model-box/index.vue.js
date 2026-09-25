import { ref } from 'vue';
import instrument from './prefab/instrument.vue';
import { BoxType } from "@/types/enum";
defineOptions({
    name: 'DsModelBox'
});
const props = defineProps({
    type: {
        default: 'Instrument',
        type: String,
    },
    model: {
        default: 'Xiao', // TODO 后期改为require
        type: String,
    }
});
const modelRef = ref(null);
const __VLS_exposed = {
    modelRef
};
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.type === __VLS_ctx.BoxType.Instrument) {
    /** @type {[typeof instrument, typeof instrument, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(instrument, new instrument({
        ref: "modelRef",
        model: (__VLS_ctx.model),
    }));
    const __VLS_1 = __VLS_0({
        ref: "modelRef",
        model: (__VLS_ctx.model),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    /** @type {typeof __VLS_ctx.modelRef} */ ;
    var __VLS_3 = {};
    var __VLS_2;
}
// @ts-ignore
var __VLS_4 = __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            instrument: instrument,
            BoxType: BoxType,
            modelRef: modelRef,
        };
    },
    props: {
        type: {
            default: 'Instrument',
            type: String,
        },
        model: {
            default: 'Xiao', // TODO 后期改为require
            type: String,
        }
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    props: {
        type: {
            default: 'Instrument',
            type: String,
        },
        model: {
            default: 'Xiao', // TODO 后期改为require
            type: String,
        }
    },
});
; /* PartiallyEnd: #4569/main.vue */
