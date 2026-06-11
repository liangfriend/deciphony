/*
 * 流程管理器 游戏的总调度指挥中心
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { useNodeManager } from '@/composables/useNodeManager'
import { useGameData } from '@/composables/useGameData'
import { enginePinia } from '@/store/pinia'
import { useAudioManagerStore } from '@/store/useAudioManagerStore'
import { useVideoManagerStore } from '@/store/useVideoManagerStore'
import { useAnimateionStore } from '@/store/useAnimateionStore'
import { parseJS, runCode } from '@/utils/execJS'
import { getQuery } from '@/utils/url'
import { ReactiveMap } from '@/dataStructures/relativeMap'
import { ActionTypeEnum, LayerEnum, NodeEnum } from '@/enum'
import {
  ActionNode,
  AudioNode,
  AudioNodePlayer,
  CaptionNode,
  ConditionNode,
  CurtainNode,
  CustomNode,
  DialogueNode,
  EngineNode,
  ImageNode,
  LayoutNode,
  SceneNode,
  VideoNode,
  VideoNodePlayer,
  ViewerNode
} from '@/types'

export const useGameStore = defineStore('game', () => {
  const { nodeMap } = useNodeManager()
  const videoManagerStore = useVideoManagerStore(enginePinia)
  const audioManagerStore = useAudioManagerStore(enginePinia)
  const animationStore = useAnimateionStore(enginePinia)
  const { gameData } = useGameData()

  const curSceneId = ref(-1)
  const curDialogueId = ref(-1)
  const curCaptionId = ref(-1)
  const viewerKeys = ref({
    [LayerEnum.Curtain]: 123
  })

  const viewerNodeMap = ref(new Map<number, EngineNode>())

  const viewerNodeGroups = computed((): ViewerNode => {
    const res: ViewerNode = {
      images: {
        [LayerEnum.Background]: [],
        [LayerEnum.BehindObject]: [],
        [LayerEnum.Character]: [],
        [LayerEnum.FrontObject]: [],
        [LayerEnum.Effect]: [],
        [LayerEnum.Operation]: [],
        [LayerEnum.Curtain]: []
      },
      videos: {
        [LayerEnum.Background]: [],
        [LayerEnum.BehindObject]: [],
        [LayerEnum.Character]: [],
        [LayerEnum.FrontObject]: [],
        [LayerEnum.Effect]: [],
        [LayerEnum.Operation]: [],
        [LayerEnum.Curtain]: []
      },
      customs: {
        [LayerEnum.Background]: [],
        [LayerEnum.BehindObject]: [],
        [LayerEnum.Character]: [],
        [LayerEnum.FrontObject]: [],
        [LayerEnum.Effect]: [],
        [LayerEnum.Operation]: [],
        [LayerEnum.Curtain]: []
      },
      audios: [],
      filters: [],
      captions: []
    }

    for (let [, node] of viewerNodeMap.value) {
      if (!node) {
        console.error('有资源节点不存在')
        continue
      }
      if (node.nodeType === NodeEnum.Image) {
        const layout = nodeMap.value.get(node.layoutId) as LayoutNode
        res.images[layout.layer].push({
          node,
          layout
        })
      } else if (node.nodeType === NodeEnum.Custom) {
        const layout = nodeMap.value.get(node.layoutId) as LayoutNode
        res.customs[layout.layer].push({
          node,
          layout
        })
      } else if (node.nodeType === NodeEnum.Video) {
        const layout = nodeMap.value.get(node.layoutId) as LayoutNode
        res.videos[layout.layer].push({
          node,
          layout
        })
      } else if (node.nodeType === NodeEnum.Audio) {
        res.audios.push({
          node
        })
      } else if (node.nodeType === NodeEnum.Filter) {
        res.filters.push({
          node
        })
      } else if (node.nodeType === NodeEnum.Caption) {
        const layout = nodeMap.value.get(node.layoutId) as LayoutNode
        if (layout) {
          res.captions.push({
            node,
            layout
          })
        } else {
          console.error('字幕：', node.nodeName, '，缺少布局信息')
          ElMessage.error('字幕：' + node.nodeName + '，缺少布局信息')
        }
      }
    }

    return res
  })

  const viewerCurtainNodeMap = ref(new ReactiveMap<number, CurtainNode>())

  function addViewerNodeMap(id: number, node: EngineNode) {
    viewerNodeMap.value.set(id, node)
    if (node?.nodeType === NodeEnum.Audio && id) {
      const player = audioManagerStore.audioNodePlayerMap.get(id) as AudioNodePlayer
      player?.play()
    }
  }

  function removeViewerNodeMap(id: number) {
    const node = nodeMap.value.get(id) as EngineNode
    viewerNodeMap.value.delete(id)
    if (node?.nodeType === NodeEnum.Audio && id) {
      const player = audioManagerStore.audioNodePlayerMap.get(id) as AudioNodePlayer
      player?.stop()
    }
    if (node?.nodeType === NodeEnum.Video && id) {
      const player = videoManagerStore.videoNodePLayerMap.get(id) as VideoNodePlayer
      player?.stop()
      videoManagerStore.removeVideoNodePlayer(id)
    }
  }

  async function autoSave(saveId: number, newSceneId: number, newGameData: string) {
    const data = {
      sceneId: newSceneId,
      gameData: newGameData
    }
    await window.api.save.update(saveId, { data: JSON.stringify(data) })
  }

  async function startScene(scenedId: number) {
    if (!scenedId || scenedId === -1) return

    const preSceneNoode = nodeMap.value.get(curSceneId.value) as SceneNode
    if (preSceneNoode && preSceneNoode.endCurationId && preSceneNoode.endCurationId !== -1) {
      const endCurtain = nodeMap.value.get(preSceneNoode.endCurationId) as CurtainNode
      viewerCurtainNodeMap.value.set(preSceneNoode.endCurationId, endCurtain)
      await new Promise((resolve) =>
        setTimeout(resolve, (+endCurtain.anDuration + +endCurtain.delay) / 2)
      )
    }
    viewerNodeMap.value.clear()
    const type = getQuery().type
    const saveId = +getQuery().saveId
    if (type === 'game') {
      await autoSave(saveId, scenedId, gameData.value)
    }
    curSceneId.value = scenedId
    const sceneNode = nodeMap.value.get(curSceneId.value) as SceneNode
    if (sceneNode) {
      sceneNode.initActionIds?.forEach((actionId) => {
        doAction(actionId)
      })
      sceneNode.initImageIds?.forEach((nodeId) => {
        const node = nodeMap.value.get(nodeId) as ImageNode
        addViewerNodeMap(nodeId, node)
      })
      sceneNode.initCustomIds?.forEach((nodeId) => {
        const node = nodeMap.value.get(nodeId) as CustomNode
        addViewerNodeMap(nodeId, node)
      })
      sceneNode.initAudioIds?.forEach((nodeId) => {
        const node = nodeMap.value.get(nodeId) as AudioNode
        addViewerNodeMap(nodeId, node)
      })
      sceneNode.initVideoIds?.forEach((nodeId) => {
        const node = nodeMap.value.get(nodeId) as VideoNode
        addViewerNodeMap(nodeId, node)
      })
      startDialogue(sceneNode.initDialogueIds[0])
    }
  }

  function startDialogue(dialogueId: number) {
    if (!dialogueId || dialogueId === -1) return
    removeViewerNodeMap(curDialogueId.value)
    removeRelatedResources(curDialogueId.value)

    curDialogueId.value = dialogueId
    const dialogueNode = nodeMap.value.get(curDialogueId.value) as DialogueNode
    dialogueNode.initActionIds?.forEach((actionId) => {
      doAction(actionId)
    })
    dialogueNode.initImageIds?.forEach((nodeId) => {
      const node = nodeMap.value.get(nodeId) as ImageNode
      addViewerNodeMap(nodeId, node)
    })
    dialogueNode.initCustomIds?.forEach((nodeId) => {
      const node = nodeMap.value.get(nodeId) as CustomNode
      addViewerNodeMap(nodeId, node)
    })
    dialogueNode.initAudioIds?.forEach((nodeId) => {
      const node = nodeMap.value.get(nodeId) as AudioNode
      addViewerNodeMap(nodeId, node)
    })
    dialogueNode.initVideoIds?.forEach((nodeId) => {
      const node = nodeMap.value.get(nodeId) as VideoNode
      addViewerNodeMap(nodeId, node)
    })
    if (dialogueNode && dialogueNode.autoShowFirstCaption) {
      if (dialogueNode.initCaptionIds[0]) {
        startCaption(dialogueNode.initCaptionIds[0])
      }
    }
  }

  function startCaption(captionId: number) {
    removeViewerNodeMap(curCaptionId.value)
    const captionNode = nodeMap.value.get(captionId) as CaptionNode
    addViewerNodeMap(captionId, captionNode)
    curCaptionId.value = captionId
  }

  function removeRelatedResources(nodeId: number) {
    if (nodeId === -1) return
    const node = nodeMap.value.get(nodeId) as EngineNode
    if (node.nodeType === NodeEnum.Dialogue) {
      const keepIds = node.keepIds
      node.initImageIds.forEach((id) => {
        if (!keepIds.some((e) => e === id)) {
          removeViewerNodeMap(id)
        }
      })
      node.initImageIds.forEach((id) => {
        if (!keepIds.some((e) => e === id)) {
          removeViewerNodeMap(id)
        }
      })
      node.initAudioIds.forEach((id) => {
        if (!keepIds.some((e) => e === id)) {
          if (!keepIds.some((e) => e === id)) {
            removeViewerNodeMap(id)
          }
        }
      })
      node.initVideoIds.forEach((id) => {
        if (!keepIds.some((e) => e === id)) {
          removeViewerNodeMap(id)
        }
      })
      node.initCaptionIds.forEach((id) => {
        if (!keepIds.some((e) => e === id)) {
          removeViewerNodeMap(id)
        }
      })
    }
  }

  function doAction(actionId: number) {
    const actionNode = nodeMap.value.get(actionId) as ActionNode
    if (actionNode) {
      let condition = true
      for (let id of actionNode.executeConditionIds) {
        const conditionNode = nodeMap.value.get(id) as ConditionNode
        const res = runCode(conditionNode.func)
        if (!res) condition = false
      }
      if (!condition) return
      setTimeout(() => {
        switch (actionNode.actionType) {
          case ActionTypeEnum.ShowImage: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Image) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideImage: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Image) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.ShowVideo: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Video) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideVideo: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Video) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.PlayVideo: {
            const videoNodePlayer = videoManagerStore.videoNodePLayerMap.get(actionNode.targetId)
            videoNodePlayer?.play()
            break
          }
          case ActionTypeEnum.StopVideo: {
            const videoNodePlayer = videoManagerStore.videoNodePLayerMap.get(actionNode.targetId)
            videoNodePlayer?.stop()
            break
          }
          case ActionTypeEnum.PlayAudio: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Audio) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.StopAudio: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Audio) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.ShowFilter: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Filter) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideFilter: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Filter) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.ActiveCurtain: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Curtain) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.Animation: {
            const animateion = actionNode.animation
            animationStore.executeAnimation(actionNode.targetId, animateion)
            break
          }
          case ActionTypeEnum.Combined: {
            actionNode.actionIds.forEach((childActionNodeId) => {
              doAction(childActionNodeId)
            })
            break
          }
          case ActionTypeEnum.Next: {
            const targetNode = nodeMap.value.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Scene) {
              startScene(actionNode.targetId)
            }
            break
          }
          case ActionTypeEnum.DataChange: {
            try {
              const data = parseJS(gameData.value)
              const fn = new Function(
                'gameData',
                `
                  try {
                    ${actionNode.dataChangeFunc}
                  } catch(e) {
                    return { error: e.message };
                  }
                `
              )
              fn(data)
              gameData.value = JSON.stringify(data)
            } catch (e: any) {
              console.error('数据修改行为函数语法错误', e)
            }
            break
          }
          case ActionTypeEnum.Custom: {
            break
          }
        }
      }, +actionNode.delay)
    }
  }

  return {
    curCaptionId,
    curSceneId,
    curDialogueId,
    doAction,
    viewerNodeMap,
    viewerNodeGroups,
    startCaption,
    startDialogue,
    startScene,
    viewerKeys,
    viewerCurtainNodeMap,
    addViewerNodeMap,
    removeViewerNodeMap
  }
})
