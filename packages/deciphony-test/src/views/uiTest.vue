<script lang="ts" setup>
import {onMounted, ref} from "vue";
import brokenHeartSrc from '../assets/my_broken_heart.mp3'
import brokenHeartImg from '../assets/xiDuoChuan.jpg'

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
    redBox.style.height = '100px'
    redBox.style.backgroundColor = 'red'
    redBox.style.borderRadius = '8px'
    redBox.style.display = 'flex'
    redBox.style.alignItems = 'center'
    redBox.style.justifyContent = 'center'
    redBox.style.color = '#fff'
    redBox.textContent = '方块'

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

    whiteboardRef.value.addElement({left: 200, top: 200}, 'red-box')
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
    <div style="padding: 20px;">
        <div style="margin-bottom: 10px;">
            <button @click="addRedBox">➕ 添加红色方块</button>
            <button @click="switchMode">模式切换</button>
            当前模式：{{ whiteboardRef?.state }}
        </div>
        <ds-whiteboard
            ref="whiteboardRef"
            float-board-height="1000px"
            float-board-width="1000px"
            height="800px"
            width="800px"
        />
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