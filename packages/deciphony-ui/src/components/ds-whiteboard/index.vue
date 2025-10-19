<template>
  <div :style="whiteboardStyle" ref="whiteboard" class="hidden-scrollbar" comment="白板容器"
       @pointerup="whiteboardPointerup">
    <div ref="floatBoard" v-drag="{enable:state === whiteBoardState.Show?drag:false}" :style="floatBoardStyle"
         comment="浮动展示白板，此元素可被拖动位移，背景为白色"
         @pointerup="pointerup">
    </div>
    <div v-show="showMenu" :style="menuStyle" @pointerup.stop>
      <slot name="menu"></slot>
    </div>
  </div>

</template>
<script lang="ts" setup>
import {computed, createApp, CSSProperties, onMounted, onUnmounted, Ref, ref, StyleValue} from 'vue';
import vDrag from '../../directivces/drag';
import {AddElementOptions} from "./types";
import {whiteBoardState} from "./enum";
import TransformShell from "./transformShell.vue";
import {getRotationAngleFromMatrix, parseAndFormatDimension} from "../../utils/commonUtil";

defineOptions({
  name: 'DsWhiteboard' // 给组件一个全局 name
});
//展示板实例
const floatBoard: Ref<HTMLElement> = ref(null!);
const whiteboard: Ref<HTMLElement> = ref(null!);
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

interface ElementSerializedData {
  id: string;
  type: string;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
  };
  data: any;
  version?: string;
}

interface WhiteboardSerializedData {
  version: string;
  elements: ElementSerializedData[];
  floatBoard: {
    width: number;
    height: number;
    position: string;
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
}

// 存储元素序列化数据的Map
const elementDataMap = new Map<string, ElementSerializedData>();
// 模式 展示模式 编辑模式
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

// 修改addElement方法
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

  if (options.cloneNode) {
    element = cacheMap.get(key).cloneNode(true);
  } else {
    element = cacheMap.get(key)
  }

  // 创建 TransformShell 组件实例
  const app = createApp(TransformShell, {
    initX: options.left,
    initY: options.top,
    initW: options.width,
    initH: options.height,
    initAngle: options.angle || 0,
    mode: state
  })

  // 创建容器并挂载
  const container = document.createElement('div');
  app.mount(container);

  // shell 就是 TransformShell 组件本身的根元素
  const shell = container.firstElementChild as HTMLElement;

  // 获取内容插槽并添加元素
  const contentSlot = shell.querySelector('.content-slot');
  contentSlot?.appendChild(element);

  // 设置样式
  shell.style.position = 'absolute';
  const rect = shell.getBoundingClientRect();

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

  // 添加到白板
  floatBoard.value.appendChild(container);

  // 存储序列化数据
  if (options.serializableData) {
    const elementId = options.serializableData.id || `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const serializedData: ElementSerializedData = {
      id: elementId,
      type: options.serializableData.type,
      transform: {
        x: options.left,
        y: options.top,
        width: options.width || rect.width,
        height: options.height || rect.height,
        angle: options.angle || 0
      },
      data: options.serializableData.data,
      version: options.serializableData.version || '1.0'
    };

    // 使用元素ID作为key存储
    elementDataMap.set(elementId, serializedData);

    // 设置数据属性，方便查找
    container.setAttribute('data-element-id', elementId);
  }
}

// 导出序列化数据
// 修改exportJson方法
function exportJson(): string {
  const data: WhiteboardSerializedData = {
    version: '1.0.0',
    elements: [],
    floatBoard: {
      width: props.floatBoardWidth,
      height: props.floatBoardHeight,
      position: props.floatBoardPosition
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  };

  // 收集所有元素的序列化数据
  const containers = floatBoard.value.querySelectorAll('div[data-element-id]');
  containers.forEach(container => {
    const elementId = container.getAttribute('data-element-id');
    if (elementId) {
      const elementData = elementDataMap.get(elementId);
      if (elementData) {
        // 获取 TransformShell 的根元素
        const shell = container.firstElementChild as HTMLElement;
        if (shell) {
          // 更新当前的变换信息
          const style = window.getComputedStyle(shell);
          elementData.transform.x = parseFloat(style.left || '0');
          elementData.transform.y = parseFloat(style.top || '0');
          elementData.transform.width = parseFloat(style.width || '0');
          elementData.transform.height = parseFloat(style.height || '0');

          // 获取旋转角度
          const transform = style.transform;
          elementData.transform.angle = getRotationAngleFromMatrix(transform);
          data.elements.push(elementData);
        }
      }
    }
  });

  return JSON.stringify(data, null, 2);
}

// 导入序列化数据
function importJson(jsonData: string | WhiteboardSerializedData, elementFactory: (data: ElementSerializedData) => Element): void {
  if (state.value !== whiteBoardState.Edit) {
    console.error('只能在编辑模式下导入数据');
    return;
  }

  const data: WhiteboardSerializedData = typeof jsonData === 'string'
      ? JSON.parse(jsonData)
      : jsonData;

  // 清空当前白板
  clearWhiteboard();

  // 重建元素
  data.elements.forEach(elementData => {
    // 使用开发者提供的工厂函数创建元素
    const element = elementFactory(elementData);

    // 缓存元素
    const cacheKey = `import-${elementData.id}`;
    cacheElement(element, cacheKey);

    // 添加到白板
    addElement({
      left: elementData.transform.x,
      top: elementData.transform.y,
      width: elementData.transform.width,
      height: elementData.transform.height,
      angle: elementData.transform.angle,
      cloneNode: false,
      serializableData: {
        type: elementData.type,
        id: elementData.id,
        data: elementData.data,
        version: elementData.version
      }
    }, cacheKey);

    // 清理缓存
    setTimeout(() => {
      delCacheElement(cacheKey);
    }, 0);
  });
}

// 清空白板
function clearWhiteboard(): void {
  const shells = floatBoard.value.querySelectorAll('.transform-shell');
  shells.forEach(shell => {
    const elementId = shell.getAttribute('data-element-id');
    if (elementId) {
      elementDataMap.delete(elementId);
    }
    shell.remove();
  });
}

// 获取elementDataMap
function getElementData(elementId: string): ElementSerializedData | undefined {
  return elementDataMap.get(elementId);
}

// 更新elementDataMap
function updateElementData(elementId: string, newData: any): void {
  const elementData = elementDataMap.get(elementId);
  if (elementData) {
    elementData.data = newData;
  }
}

// 最外层点击事件
function whiteboardPointerup() {
  showMenu.value = false
}

function switchState(param: whiteBoardState) {
  state.value = param
}

const showMenu = ref(false)
const menuPoint = ref({
  left: '',
  top: '',
})
const menuStyle = computed((): CSSProperties => {
  return {
    position: 'absolute',
    left: menuPoint.value.left,
    top: menuPoint.value.top,
  }
})
// 鼠标右键事件监听
onMounted(() => {
  addEventListener('contextmenu', (event) => {
    event.preventDefault();
    showMenu.value = true
    console.log('chicken', event)
    menuPoint.value.left = event.clientX - whiteboard.value.offsetLeft + 'px'
    menuPoint.value.top = event.clientY - whiteboard.value.offsetTop + 'px'
  })
})
//-------------------------------------变量-------------------------------------------
//暴露方法
defineExpose({
  addElement, cacheElement, delCacheElement, switchState, state,
  exportJson,     // 新增
  importJson,     // 新增
});

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

