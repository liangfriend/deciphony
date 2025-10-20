<script lang="ts" setup>
import {onMounted, ref} from "vue";
import brokenHeartSrc from '../assets/my_broken_heart.mp3'
import brokenHeartImg from '../assets/xiDuoChuan.jpg'
import whiteboardJson from '../assets/whiteboard.json'
import {KeyCodeEnum} from "deciphony-ui";

const dsModelBoxRef = ref(null)

onMounted(() => {


})

function open() {
  dsModelBoxRef.value.modelRef.toggleEmission('hole1', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole2', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole3', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole4', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole5', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole6', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole7', true)
  dsModelBoxRef.value.modelRef.toggleEmission('hole8', true)
}

function close() {
  dsModelBoxRef.value.modelRef.toggleEmission('hole1', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole2', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole3', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole4', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole5', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole6', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole7', false)
  dsModelBoxRef.value.modelRef.toggleEmission('hole8', false)
}

const showFloatingWindow = ref(true)

const songs = ref([{
  title: '松下優也 - Mr_\'Broken Heart\' (心碎先生)_H',
  src: brokenHeartSrc,
  image: brokenHeartImg
}])

const whiteboardRef = ref()

// 准备一个红色方块
onMounted(() => {
  const redBox = document.createElement('div')
  redBox.style.width = '100px'
  redBox.style.height = '100%'
  redBox.style.backgroundColor = 'red'
  redBox.style.borderRadius = '8px'
  redBox.style.display = 'flex'
  redBox.style.alignItems = 'center'
  redBox.style.justifyContent = 'center'
  redBox.style.color = '#fff'
  redBox.textContent = '方块'
  whiteboardRef.value.switchState('edit')
  // 缓存红色方块
  whiteboardRef.value.cacheElement(redBox, 'red-box')
})

// 切换模式
function switchMode() {
  if (whiteboardRef.value?.state === 'show') {
    whiteboardRef.value.switchState('edit') // 开启编辑模式
  } else {
    whiteboardRef.value?.switchState('show')
  }

}

// 添加方块
function addRedBox() {

  whiteboardRef.value.addElement({left: 200, top: 200, cloneNode: true}, 'red-box')
}

// 添加文本元素
const addTextElement = () => {
  const textElement = document.createElement('div');
  textElement.textContent = '这是一个文本元素';
  textElement.style.color = 'blue';
  textElement.style.fontSize = '16px';

  // 缓存元素
  whiteboardRef.value.cacheElement(textElement, 'text-element');

  // 添加到白板，包含序列化数据
  whiteboardRef.value.addElement({
    left: 100,
    top: 100,
    width: 200,
    height: 50,
    serializableData: {
      type: 'text',
      id: 'text-1',
      data: {
        content: '这是一个文本元素',
        style: {
          color: 'blue',
          fontSize: '16px'
        }
      }
    }
  }, 'text-element');
};

// 添加图片元素
const addImageElement = () => {
  const imgElement = document.createElement('img');
  imgElement.src = '/path/to/image.jpg';
  imgElement.alt = '示例图片';
  imgElement.style.width = '100%';
  imgElement.style.height = '100%';

  whiteboardRef.value.cacheElement(imgElement, 'image-element');

  whiteboardRef.value.addElement({
    left: 200,
    top: 200,
    width: 150,
    height: 150,
    serializableData: {
      type: 'image',
      id: 'image-1',
      data: {
        src: '/path/to/image.jpg',
        alt: '示例图片'
      }
    }
  }, 'image-element');
};

// 导出白板
const exportWhiteboard = () => {
  const json = whiteboardRef.value.exportJson();
  downloadJson(json, 'whiteboard.json');
};

// 导入白板
const importWhiteboard = () => {
  // 假设从文件读取JSON数据
  const importedData = whiteboardJson; // 这里应该是导入的JSON字符串

  // 定义元素工厂函数
  const elementFactory = (data) => {
    switch (data.type) {
      case 'text':
        const textElement = document.createElement('div');
        textElement.textContent = data.data.content;
        Object.assign(textElement.style, data.data.style);
        return textElement;

      case 'image':
        const imgElement = document.createElement('img');
        imgElement.src = data.data.src;
        imgElement.alt = data.data.alt;
        imgElement.style.width = '100%';
        imgElement.style.height = '100%';
        return imgElement;

      default:
        console.warn('未知元素类型:', data.type);
        return document.createElement('div');
    }
  };

  whiteboardRef.value.importJson(importedData, elementFactory);
};

// 下载JSON文件
function downloadJson(json, filename) {
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
<template>
  <!--    <div>-->
  <!--        <div>-->
  <!--            ds-icon-->
  <!--        </div>-->
  <!--        <ds-icon color="red" name="arrowL" size="2rem"></ds-icon>-->
  <!--    </div>-->
  <!--    <div class="group">-->
  <!--        <div>-->
  <!--            ds-model-box-->
  <!--        </div>-->
  <!--        <button @click="open">亮灯</button>-->
  <!--        <button @click="close">关灯</button>-->
  <!--        <ds-model-box ref="dsModelBoxRef" class="modelBox"></ds-model-box>-->
  <!--    </div>-->
  <!--    <ds-floating-window v-model="showFloatingWindow" :initial-x="200" :initial-y="200" height="150px" width="600px">-->
  <!--        <ds-bg-audio-player :songs="songs"/>-->
  <!--    </ds-floating-window>-->
  <!--  白板-->
  <div style="padding: 20px;" v-show="false">
    <div style="margin-bottom: 10px;">
      <button @click="addRedBox">➕ 添加红色方块</button>
      <button @click="switchMode">模式切换</button>
      当前模式：{{ whiteboardRef?.state }}

      <button @click="addTextElement">添加文本元素</button>
      <button @click="addImageElement">添加图片元素</button>
      <button @click="exportWhiteboard">导出白板</button>
      <button @click="importWhiteboard">导入白板</button>
    </div>
    <ds-whiteboard
        ref="whiteboardRef"
        float-board-height="1000px"
        float-board-width="1000px"
        height="800px"
        width="800px"
    >
      <template #menu>
        <div style="width:120px;height:120px;background-color: #FF7882"></div>
      </template>
    </ds-whiteboard>
  </div>
  <div style="margin-top:300px">
    <ds-keyboard v-show="false" height="216.66px" width="781.666px"
                 :config="[{code:KeyCodeEnum.F6,showText:'FF'}]"></ds-keyboard>
    <ds-piano group interval-ruler chord-box></ds-piano>
  </div>

</template>

<style scoped>
.modelBox {

}

.group {
  height: 200px;
  width: 200px;
}
</style>