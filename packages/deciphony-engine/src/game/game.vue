<script lang="ts" setup>
// 节点功能
import {useRoute, useRouter} from 'vue-router'
import {computed, CSSProperties, onBeforeUnmount, onMounted, ref, watch, PropType} from 'vue'
import {EngineNode, StoryNode} from '@/types'
import {LayerEnum, NodeEnum} from '@/enum'
import ImageNodeBox from '@/game/components/imageNodeBox.vue'
import VideoNodeBox from '@/game/components/videoNodeBox.vue'
import CaptionNodeBox from '@/game/components/captionNodeBox.vue'
// import {updateLoadedEditorNodeList, useNodeManager} from '@/composables/useNodeManager'
import {useGame} from '@/composables/useGame'
import FilterNodeBox from '@/game/components/filterNodeBox.vue'
import CurtainNodeBox from '@/game/components/curtainNodeBox.vue'
import CustomNodeBox from '@/game/components/customNodeBox.vue'
import {updateLoadedGameData, useGameData} from '@/composables/useGameData'

const router = useRouter()
const route = useRoute()
// ====================数据初始化======================
// const {editorNodeList, nodeMap, editorNodeMap, groupedNodes, clearNodeManager} = useNodeManager()
const {
  curCaptionId,
  curSceneId,
  curDialogueId,
  doAction,
  viewerNodeMap,
  viewerNodeGroups,
  startCaption,
  startDialogue,
  viewerKeys,
  startScene,
  viewerCurtainNodeMap
} = useGame()
// const { gameData } = useGameData()
const props = defineProps({
  gameData: { // 游戏本体
    type: Object as PropType<EngineNode[]>,
    required: true
  },
  extraData: { // 额外数据
    type: Object,
  },
  sceneId: {
    type: Number,
    default: -1
  }
})
const emit = defineEmits(['exit'])

const storyNode = computed((): StoryNode => {
  return props.gameData.find(node => node.nodeType === NodeEnum.Story) as StoryNode
})

async function initData() {
  // if (type.value === 'test') {
  //   const data = (await window.api.work.query({id: gameId.value})).data?.[0]
  //   if (data) {
  //     const editorNodeList = JSON.parse(data.data).editorNodeList
  //     const prefabList = JSON.parse(data.data).prefabList
  //     await updateLoadedEditorNodeList(editorNodeList, prefabList)
  //     const gameData = JSON.parse(data.data).gameData
  //     updateLoadedGameData(gameData)
  //   }
  // } else if (type.value === 'game') {
  //   const data = (await window.api.game.query({id: gameId.value})).data?.[0]
  //   const save = (await window.api.save.query({id: saveId.value})).data?.[0]
  //   if (data) {
  //     const editorNodeList = JSON.parse(data.data).editorNodeList
  //     const prefabList = JSON.parse(data.data).prefabList
  //     await updateLoadedEditorNodeList(editorNodeList, prefabList)
  //     if (save) {
  //       // 游戏模式
  //       const gameData = JSON.parse(save.data).gameData
  //       updateLoadedGameData(gameData)
  //     } else {
  //       // 测试模式
  //       const gameData = JSON.parse(data.data).gameData
  //       updateLoadedGameData(gameData)
  //     }
  //   }
  // }
  // 如果路由有sceneId，则从此场景开始，如果是game模式，sceneId在entry就被赋值为save的sceneId了，所以不用替换为save.data.sceneId
  if (props.sceneId !== -1) {
    await startScene(props.sceneId)
  } else {
    await startScene(storyNode.value.entrySceneId)
  }
}

onMounted(async () => {
  await initData()
})

// ======================样式====================
const svgStyle = computed((): CSSProperties => {
  return {
    pointerEvents: 'none'
  }
})
// ======================退出游戏功能====================
const exitDialogVisible = ref(false)
onMounted(() => {
  document.addEventListener('keyup', esc)
})
onBeforeUnmount(() => {
  document.removeEventListener('keyup', esc)
})

function esc(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    exitDialogVisible.value = !exitDialogVisible.value
  }
}


function exit() {
  emit('exit')
}
</script>
<template>
  <div v-if="storyNode" class="stack">
    <div :key="curSceneId" class="stack-item background-layer">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.Background]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.Background]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <!--    TODO 应该应用插槽，让外部实现函数工厂，暴露给插槽一个回调函数，进行反向消息传递    -->
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.Background]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div :key="curSceneId" class="stack-item behind-object-layer">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.BehindObject]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.BehindObject]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.BehindObject]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div :key="curSceneId" class="stack-item character-layer">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.Character]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.Character]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.Character]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div :key="curSceneId" class="stack-item front-object-layer">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.FrontObject]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.FrontObject]"
          :key="item.node.id"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.FrontObject]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div :key="curSceneId" class="stack-item effect-layer">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.Effect]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.Effect]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <filter-node-box
          v-for="item in viewerNodeGroups.filters"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :filter-node="item.node"
        ></filter-node-box>
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.Effect]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div :key="curSceneId" class="stack-item operation-layer">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.Operation]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.Operation]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <caption-node-box
          v-for="item in viewerNodeGroups.captions"
          :key="item.node.id"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :captionNode="item.node"
          :layout="item.layout"
        ></caption-node-box>
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.Operation]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div class="stack-item curtain-layer" comment="幕布层不跟随场景刷新，所以不加key">
      <svg
        :style="svgStyle"
        :viewBox="`0 0 ${+storyNode.width} ${+storyNode.height}`"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
      >
        <image-node-box
          v-for="item in viewerNodeGroups.images[LayerEnum.Curtain]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :image-node="item.node"
          :layout="item.layout"
        ></image-node-box>
        <video-node-box
          v-for="item in viewerNodeGroups.videos[LayerEnum.Curtain]"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :layout="item.layout"
          :video-node="item.node"
        ></video-node-box>
        <curtain-node-box
          v-for="[index, item] in viewerCurtainNodeMap"
          :canvas-height="+storyNode.height"
          :canvas-width="+storyNode.width"
          :curtain-node="item"
        ></curtain-node-box>
        <custom-node-box
          v-for="item in viewerNodeGroups.customs[LayerEnum.Curtain]"
          :custom-node="item.node"
          :layout="item.layout"
        ></custom-node-box>
      </svg>
    </div>
    <div
      v-if="type === 'test'"
      class="stack-item test-layer"
      comment="测试层，不参与游戏，放数据的"
    >
      <div class="data-box">
        <div>当前场景id:{{ curSceneId }}</div>
        <div>当前对话id:{{ curDialogueId }}</div>
        <div>当前字幕id:{{ curCaptionId }}</div>

        {{ gameData }}
      </div>
    </div>
  </div>
  <el-dialog v-model="exitDialogVisible" title="提示">
    <div>退出游戏？</div>

    <template #footer>
      <el-button @click.stop="exitDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="exit">确认</el-button>
    </template>
  </el-dialog>
</template>
<style scoped>
.caption-text {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 20px;
  padding: 16px;
  box-sizing: border-box;
  user-select: none;
  pointer-events: none;
  white-space: pre-wrap;
  font-weight: 500;
  font-family: 'Microsoft YaHei', sans-serif;
}

.data-box {
  width: fit-content;

  background-color: rgba(0, 0, 0, 0.2);
}
</style>
