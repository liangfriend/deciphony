import { computed, ref, watch } from 'vue';
import { musicScoreToVDom as musicScoreToVDomNumber } from '@/numberNotation/render/musicScoreToVDom';
import { musicScoreToVDom as musicScoreToVDomStandard } from '@/standardStaff/render/musicScoreToVDom';
import { applyVDomUpdate, diffAndMergeVDom } from '@/render/update';
import { defaultSkin, defaultSkinBlue, defaultSkinRed } from '@/skins/defaultSkin';
import { MusicScoreTypeEnum } from '@/enums/musicScoreEnum';
import Group from './group.vue';
import Slur from './slur.vue';
import Volta from './volta.vue';
import Beam from './beam.vue';
const AFFILIATION_TAGS = new Set(['slot', 'affiliation', 'beam', 'noteBeam']);
const props = defineProps();
// 测试：更改谱子类型
const notationType = computed(() => props.data?.type ?? MusicScoreTypeEnum.NumberNotation);
const data = computed(() => props.data); //?? defaultMock.value
const skin = computed(() => props.skin ?? {
    default: defaultSkin,
    red: defaultSkinRed,
    blue: defaultSkinBlue,
});
/** skinName 在 skin 中查得到则用 skinName，否则用 default */
const effectiveSkinName = computed(() => {
    const sn = props.skinName;
    const s = skin.value;
    return sn && s && sn in s ? sn : 'default';
});
const skinPackForLayout = computed(() => skin.value?.[effectiveSkinName.value] ?? defaultSkin);
const emit = defineEmits();
const vDom = ref([]);
function onDrClick(event, node) {
    emit('dr-click', event, node);
}
function onDrDown(event, node) {
    emit('dr-down', event, node);
}
function onDrUp(event, node) {
    emit('dr-up', event, node);
}
function onDrMove(event, node) {
    emit('dr-move', event, node);
}
function onDrEnter(event, node) {
    emit('dr-enter', event, node);
}
function onDrLeave(event, node) {
    emit('dr-leave', event, node);
}
const musicScoreToVDom = computed(() => notationType.value === MusicScoreTypeEnum.NumberNotation ? musicScoreToVDomNumber : musicScoreToVDomStandard);
// data、slotConfig、skin、skinName 变化时重新计算 vDom，使用 diff 原地更新以提升性能
watch([data, () => props.slotConfig, skinPackForLayout, effectiveSkinName], ([d, slotConfig]) => {
    const next = d
        ? musicScoreToVDom.value(d, slotConfig, { skin: skin.value, skinName: effectiveSkinName.value })
        : [];
    vDom.value = diffAndMergeVDom(vDom.value, next); //next//
    emit('renderMusicScore', vDom.value);
}, { immediate: true, deep: true });
/**
 * 更新 VDom：传入 updater 对深拷贝后的 vDom 做修改（如替换某符号 skinName），仅替换有变化的节点，实现部分重渲染
 * @param updater (vDom: VDom[]) => VDom[] 用户修改后 return
 */
function updateVDomHandler(updater) {
    vDom.value = applyVDomUpdate(vDom.value, updater);
}
const __VLS_exposed = { updateVDom: updateVDomHandler };
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    height: (__VLS_ctx.data.height),
    viewBox: (`0 0 ${__VLS_ctx.data.width} ${__VLS_ctx.data.height}`),
    width: (__VLS_ctx.data.width),
    ...{ style: ({ touchAction: 'none' }) },
    preserveAspectRatio: "none",
    xmlns: "http://www.w3.org/2000/svg",
});
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.vDom))) {
    (`${node.targetId ?? ''}-${node.tag}-${node.skinKey ?? ''}-${node.skinName ?? 'default'}`);
    if (!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrClick($event, node);
                } },
            ...{ onPointerdown: (...[$event]) => {
                    if (!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrDown($event, node);
                } },
            ...{ onPointerenter: (...[$event]) => {
                    if (!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrEnter($event, node);
                } },
            ...{ onPointerleave: (...[$event]) => {
                    if (!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrLeave($event, node);
                } },
            ...{ onPointermove: (...[$event]) => {
                    if (!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrMove($event, node);
                } },
            ...{ onPointerup: (...[$event]) => {
                    if (!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrUp($event, node);
                } },
        });
        /** @type {[typeof Group, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(Group, new Group({
            node: (node),
            notationType: (__VLS_ctx.data.type),
            skin: (__VLS_ctx.skin),
        }));
        const __VLS_1 = __VLS_0({
            node: (node),
            notationType: (__VLS_ctx.data.type),
            skin: (__VLS_ctx.skin),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    }
    else if (__VLS_ctx.AFFILIATION_TAGS.has(node.tag)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    if (!(__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrClick($event, node);
                } },
            ...{ onPointerdown: (...[$event]) => {
                    if (!!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    if (!(__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrDown($event, node);
                } },
            ...{ onPointerenter: (...[$event]) => {
                    if (!!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    if (!(__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrEnter($event, node);
                } },
            ...{ onPointerleave: (...[$event]) => {
                    if (!!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    if (!(__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrLeave($event, node);
                } },
            ...{ onPointermove: (...[$event]) => {
                    if (!!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    if (!(__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrMove($event, node);
                } },
            ...{ onPointerup: (...[$event]) => {
                    if (!!(!__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    if (!(__VLS_ctx.AFFILIATION_TAGS.has(node.tag)))
                        return;
                    __VLS_ctx.onDrUp($event, node);
                } },
            'data-comment': (node.dataComment),
            'data-slot-name': (node.slotName ?? ''),
            'data-target-id': (node.targetId),
            transform: (`translate(${node.x}, ${node.y})`),
        });
        if (node.special?.slur) {
            /** @type {[typeof Slur, ]} */ ;
            // @ts-ignore
            const __VLS_3 = __VLS_asFunctionalComponent(Slur, new Slur({
                vDom: (node),
            }));
            const __VLS_4 = __VLS_3({
                vDom: (node),
            }, ...__VLS_functionalComponentArgsRest(__VLS_3));
        }
        else if (node.special?.volta !== undefined) {
            /** @type {[typeof Volta, ]} */ ;
            // @ts-ignore
            const __VLS_6 = __VLS_asFunctionalComponent(Volta, new Volta({
                vDom: (node),
            }));
            const __VLS_7 = __VLS_6({
                vDom: (node),
            }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        }
        else if (node.special?.beam) {
            /** @type {[typeof Beam, ]} */ ;
            // @ts-ignore
            const __VLS_9 = __VLS_asFunctionalComponent(Beam, new Beam({
                vDom: (node),
            }));
            const __VLS_10 = __VLS_9({
                vDom: (node),
            }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        }
        else if (node.tag === 'slot') {
            var __VLS_12 = {
                ...({ node }),
            };
            var __VLS_13 = __VLS_tryAsConstant(node.slotName);
        }
        else {
            /** @type {[typeof Group, ]} */ ;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent(Group, new Group({
                node: (node),
                notationType: (__VLS_ctx.data.type),
                skin: (__VLS_ctx.skin),
            }));
            const __VLS_17 = __VLS_16({
                node: (node),
                notationType: (__VLS_ctx.data.type),
                skin: (__VLS_ctx.skin),
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        }
    }
}
// @ts-ignore
var __VLS_14 = __VLS_13, __VLS_15 = __VLS_12;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Group: Group,
            Slur: Slur,
            Volta: Volta,
            Beam: Beam,
            AFFILIATION_TAGS: AFFILIATION_TAGS,
            data: data,
            skin: skin,
            vDom: vDom,
            onDrClick: onDrClick,
            onDrDown: onDrDown,
            onDrUp: onDrUp,
            onDrMove: onDrMove,
            onDrEnter: onDrEnter,
            onDrLeave: onDrLeave,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
