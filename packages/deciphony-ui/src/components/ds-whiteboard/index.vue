<template>
    <div :style="whiteboardStyle" class="hidden-scrollbar" comment="白板容器">
        <div ref="floatBoard" v-drag="state === whiteBoardState.Show?drag:false" :style="floatBoardStyle"
             comment="浮动展示白板，此元素可被拖动位移，背景为白色"
             @pointerup="pointerup">
        </div>
    </div>
</template>
<script lang="ts" setup>
import {computed, createApp, CSSProperties, onMounted, onUnmounted, Ref, ref, StyleValue} from 'vue';
import vDrag from './directives/drag';
import {AddElementOptions} from "./types";
import {whiteBoardState} from "./enum";
import {parseAndFormatDimension} from './utils'
import TransformShell from "./transformShell.vue";

defineOptions({
    name: 'DsWhiteboard' // 给组件一个全局 name
});
//展示板实例
const floatBoard: Ref<HTMLElement> = ref(null!);
//宽高只允许传入px,为了保证缩放功能的正常进行
const props = defineProps({
    width: {
        type: Number,
        default: '500px'
    },
    height: {
        type: Number,
        default: '500px'
    },
    floatBoardWidth: {
        type: Number,
        default: '100px'
    },
    floatBoardHeight: {
        type: Number,
        default: '100px'
    },
    floatBoardPosition: {
        type: String, //leftTop center
        default: 'center'
    },
    drag: {
        type: Boolean,
        default: true
    }
});
const state = ref<whiteBoardState>(whiteBoardState.Show);

onMounted(() => {

});
onUnmounted(() => {

});
const whiteboardStyle = computed((): CSSProperties => {
    const res: CSSProperties = {
        position: 'relative',
        overflow: 'scroll',
        outline: '1px solid #ccc',
        width: props.width,
        height: props.height,
    }
    return res
})
const floatBoardStyle = computed((): CSSProperties => {
    const style: StyleValue = {
        backgroundColor: '#fff',
        position: 'absolute',
        boxShadow: '0px 0px 5px 5px rgba(0, 0, 0, 0.1)',
        width: props.floatBoardWidth,
        height: props.floatBoardHeight,
    };
    // 解析出值和单位
    const {value: widthValue, unit: widthUnit} = parseAndFormatDimension(props.floatBoardWidth);
    const {value: heightValue, unit: heightUnit} = parseAndFormatDimension(props.floatBoardHeight);
    switch (props.floatBoardPosition) {
        case 'leftTop':
            //
            break;
        case 'center': {
            // 解析宽度和高度
            style.left = `calc(50% - ${widthValue / 2}${widthUnit})`;
            style.top = `calc(50% - ${heightValue / 2}${heightUnit})`;

            break;
        }
        default:
            break;
    }
    return style;
});
//-------------------------------------添加元素逻辑-------------------------------------------
//白板组件暂存区
const cacheMap = new Map();

//添加元素到暂存区
function cacheElement(element: Element, key = 'element'): void {
    cacheMap.set(key, element);

}

// 删除暂存区元素
function delCacheElement(key = 'element'): void {
    cacheMap.delete(key);
}

function pointerup(e: PointerEvent): void {

}

//元素添加
function addElement(options: AddElementOptions, key = 'element'): void {
    if (state.value !== whiteBoardState.Edit) {
        console.error('展示模式不可以添加元素')
        return
    }
    if (!cacheMap.has(key)) {
        console.error('目标dom没有被缓存进白板，请执行catchMap缓存dom或检查传入key')
        return
    }
    let element: Element = null!

    if (options.cloneNode) { // 完全克隆，不会携带addEventListener。 适合简单的dom,静态资源的添加
        element = cacheMap.get(key).cloneNode(true);
    } else { // 如果cloneNode没有传true,执行浅复制
        element = cacheMap.get(key)
        // 为了避免异常，直接删除缓存的元素
        // cacheMap.delete(key)
    }

    //这里还要套一层壳，把元素全部放到这层壳里，防止svg元素设置top,left不生效
    const shell = document.createElement('div')
    const app = createApp(TransformShell, {
        initX: options.left,
        initY: options.top,
        mode: state.value === whiteBoardState.Edit ? 'edit' : 'show'
    })
    // 这里挂载插入的目标
    app.mount(shell)
    shell.querySelector('.content-slot')?.appendChild(element)

    shell.style.position = 'absolute';
    const rect = shell.getBoundingClientRect()
    if (!options.center) {
        shell.style.top = options.top + 'px';
        shell.style.left = options.left + 'px';
    } else {
        if (element instanceof HTMLElement) {
            switch (options.center) {
                case 'vertical':
                    shell.style.top = parseAndFormatDimension(props.floatBoardHeight).value / 2 - rect.height / 2 + 'px';
                    break;
                case 'horizontal':
                    shell.style.left = parseAndFormatDimension(props.floatBoardWidth).value / 2 - rect.width / 2 + 'px';
                    break
                case 'center':
                    shell.style.top = parseAndFormatDimension(props.floatBoardHeight).value / 2 - rect.height / 2 + 'px';
                    shell.style.left = parseAndFormatDimension(props.floatBoardWidth).value / 2 - rect.width / 2 + 'px';
                    break;
                default:
                    console.error('addElement方法参数center值有误')
                    break;
            }
        } else {
            console.error('center属性只能用于html元素，否则无效')
        }

    }

    floatBoard.value.appendChild(shell);
}

function switchState(param: whiteBoardState) {
    state.value = param
}

//-------------------------------------变量-------------------------------------------
//暴露方法
defineExpose({addElement, cacheElement, delCacheElement, switchState, state});

</script>
<style>
.hidden-scrollbar {
    /* 保留滚动功能 */
    overflow: auto;
    /* IE 和 Edge */
    -ms-overflow-style: none;
    /* Firefox */
    scrollbar-width: none;
}

/* Chrome、Safari、Edge（Webkit内核） */
.hidden-scrollbar::-webkit-scrollbar {
    display: none;
}

</style>

