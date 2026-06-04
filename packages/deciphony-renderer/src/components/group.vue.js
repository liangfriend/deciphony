import { computed } from 'vue';
import { MusicScoreTypeEnum } from "@/enums/musicScoreEnum";
import { defaultSkin } from "@/skins/defaultSkin";
import { vdomOuterTransform } from "@/render/vdomScale";
import { applySkinContentTemplate } from "@/render/skinContent";
defineOptions({
    name: 'Group',
});
const props = defineProps();
const comment = computed(() => {
    const { tag, slotName, dataComment } = props.node;
    if (dataComment)
        return dataComment;
    if (tag === 'slot' && slotName)
        return slotName;
    switch (tag) {
        case 'grandStaff':
            return '复谱表';
        case 'singleStaff':
            return '单谱表';
        case 'measure':
            return '小节';
        case 'noteHead':
            return '音符头';
        case 'rest':
            return '休止符';
        case 'clef_f':
            return '前置谱号';
        case 'clef_b':
            return '后置谱号';
        case 'keySignature_f':
            return '前置调号';
        case 'keySignature_b':
            return '后置调号';
        case 'timeSignature_f':
            return '前置拍号';
        case 'timeSignature_b':
            return '后置拍号';
        case 'barline_f':
            return '前置小节线';
        case 'barline_b':
            return '后置小节线';
        case 'linked_barline':
            return '连谱小节线';
        case 'close_line':
            return '闭合线';
        case 'linked_close_line':
            return '连谱闭合线';
        case 'bracket':
            return '连谱号';
        case 'repeat_f':
            return '小节前反复';
        case 'repeat_b':
            return '小节末反复';
        case 'noteStem':
            return '符干';
        case 'noteTail':
            return '符尾';
        case 'space':
            return '空白';
        default:
            return '';
    }
});
const skinPack = computed(() => {
    const name = props.node.skinName ?? 'default';
    return props.skin?.[name] ?? defaultSkin;
});
const notationPack = computed(() => {
    const pack = skinPack.value;
    return props.notationType === MusicScoreTypeEnum.NumberNotation ? pack.numberNotation : pack.standardStaff;
});
const outerTransform = computed(() => vdomOuterTransform(props.node));
const handleSkin = computed(() => {
    return (skinItem, node) => {
        if (!skinItem)
            return '';
        let temp = applySkinContentTemplate(skinItem.content, node);
        temp = temp.replace(/<svg([^>]*)>/i, (_, attrs) => `<svg${attrs} style="width:${node.w}px;height:${node.h}px;display:block">`);
        const targetId = node.targetId ?? '';
        const escapedId = String(targetId).replace(/"/g, '&quot;');
        temp = temp.replace(/<(\w+)(\s[^>]*?)?(\/?>)/g, (_, tagName, rest = '', closing) => `<${tagName}${rest} data-target-id="${escapedId}"${closing}`);
        return temp;
    };
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.g)({
    'data-comment': (__VLS_ctx.comment),
    'data-slot-name': (__VLS_ctx.node.slotName),
    'data-tag': (__VLS_ctx.node.tag),
    'data-target-id': (__VLS_ctx.node.targetId),
    transform: (__VLS_ctx.outerTransform),
});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: ((__VLS_ctx.node.skinKey && __VLS_ctx.notationPack ? __VLS_ctx.handleSkin(__VLS_ctx.notationPack[__VLS_ctx.node.skinKey], __VLS_ctx.node) : '')) }, null, null);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            comment: comment,
            notationPack: notationPack,
            outerTransform: outerTransform,
            handleSkin: handleSkin,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
