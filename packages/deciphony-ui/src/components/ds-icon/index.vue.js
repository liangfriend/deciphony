import { onMounted } from 'vue';
defineOptions({
    name: 'DsIcon' // 给组件一个全局 name
});
// 批量引入 svg 原始内容
const modules = import.meta.glob('../../assets/svg/ds-icon/*.svg', { as: 'raw', eager: true });
// 整理成 { 文件名: svg字符串 } 形式
const icons = {};
for (const path in modules) {
    // 取文件名（不带扩展名）
    const match = path.match(/\/([^/]+)\.svg$/);
    if (match) {
        icons[match[1]] = modules[path];
    }
}
onMounted(() => {
});
const props = withDefaults(defineProps(), {
    size: '1rem',
    color: '#000'
});
function getSvgBlob() {
    const svgContent = icons[props.name];
    return new Blob([svgContent], { type: 'image/svg+xml' });
}
const __VLS_exposed = { getSvgBlob };
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    size: '1rem',
    color: '#000'
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['ds-icon']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ style: ({ width: __VLS_ctx.size, height: __VLS_ctx.size, color: __VLS_ctx.color }) },
    ...{ class: "ds-icon" },
});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.icons[__VLS_ctx.name]) }, null, null);
/** @type {__VLS_StyleScopedClasses['ds-icon']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            icons: icons,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
