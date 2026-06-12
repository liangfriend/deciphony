/*
 * 流程管理器 游戏的总调度指挥中心
 */
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {ElMessage} from 'element-plus'
import {useNodeManagerStore} from '../store/useNodeManagerStore'
import {enginePinia} from '../store/pinia'
import {useAudioManagerStore} from '../store/useAudioManagerStore'
import {useVideoManagerStore} from '../store/useVideoManagerStore'
import {useAnimateionStore} from '../store/useAnimateionStore'
import {parseJS, runCode} from '../utils/execJS'
import {ReactiveMap} from '../dataStructures/relativeMap'
import {ActionTypeEnum, LayerEnum, NodeEnum} from '../enum'
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
  const nodeManagerStore = useNodeManagerStore(enginePinia)
  const videoManagerStore = useVideoManagerStore(enginePinia)
  const audioManagerStore = useAudioManagerStore(enginePinia)
  const animationStore = useAnimateionStore(enginePinia)

  // 因为 gameData 要直接放进 monacoEditor，所以这里直接保存字符串
  const gameData = ref('{}')
  const extraData = ref('{}')

  function syncGameDataToExtraData(data: string) {
    const extra = parseJS(extraData.value) as Record<string, unknown>
    extra.gameData = data
    extraData.value = JSON.stringify(extra)
  }

  function updateLoadedGameData(data: string) {
    gameData.value = data
    syncGameDataToExtraData(data)
  }

  function updateExtraData(data: string) {
    extraData.value = data
    const parsed = parseJS(data) as Record<string, unknown>
    if (typeof parsed.gameData === 'string') {
      gameData.value = parsed.gameData
    }
  }

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
        const layout = nodeManagerStore.nodeMap.get(node.layoutId) as LayoutNode
        res.images[layout.layer].push({
          node,
          layout
        })
      } else if (node.nodeType === NodeEnum.Custom) {
        const layout = nodeManagerStore.nodeMap.get(node.layoutId) as LayoutNode
        res.customs[layout.layer].push({
          node,
          layout
        })
      } else if (node.nodeType === NodeEnum.Video) {
        const layout = nodeManagerStore.nodeMap.get(node.layoutId) as LayoutNode
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
        const layout = nodeManagerStore.nodeMap.get(node.layoutId) as LayoutNode
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
    const node = nodeManagerStore.nodeMap.get(id) as EngineNode
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

  async function startScene(scenedId: number) {
    if (!scenedId || scenedId === -1) return
    // curSceneId还没更新，获取旧的场景节点执行结束幕布
    const preSceneNode = nodeManagerStore.nodeMap.get(curSceneId.value) as SceneNode
    if (preSceneNode && preSceneNode.endCurationId && preSceneNode.endCurationId !== -1) {
      const endCurtain = nodeManagerStore.nodeMap.get(preSceneNode.endCurationId) as CurtainNode
      viewerCurtainNodeMap.value.set(preSceneNode.endCurationId, endCurtain)
      await new Promise((resolve) =>
        setTimeout(resolve, (+endCurtain.anDuration + +endCurtain.delay) / 2)
      )
    }
    viewerNodeMap.value.clear()
    syncGameDataToExtraData(gameData.value)
    const extra = parseJS(extraData.value) as Record<string, unknown>
    extra.sceneId = scenedId
    extraData.value = JSON.stringify(extra)
    curSceneId.value = scenedId
    const sceneNode = nodeManagerStore.nodeMap.get(curSceneId.value) as SceneNode
    if (sceneNode) {
      sceneNode.initActionIds?.forEach((actionId) => {
        doAction(actionId)
      })
      sceneNode.initImageIds?.forEach((nodeId) => {
        const node = nodeManagerStore.nodeMap.get(nodeId) as ImageNode
        addViewerNodeMap(nodeId, node)
      })
      sceneNode.initCustomIds?.forEach((nodeId) => {
        const node = nodeManagerStore.nodeMap.get(nodeId) as CustomNode
        addViewerNodeMap(nodeId, node)
      })
      sceneNode.initAudioIds?.forEach((nodeId) => {
        const node = nodeManagerStore.nodeMap.get(nodeId) as AudioNode
        addViewerNodeMap(nodeId, node)
      })
      sceneNode.initVideoIds?.forEach((nodeId) => {
        const node = nodeManagerStore.nodeMap.get(nodeId) as VideoNode
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
    const dialogueNode = nodeManagerStore.nodeMap.get(curDialogueId.value) as DialogueNode
    dialogueNode.initActionIds?.forEach((actionId) => {
      doAction(actionId)
    })
    dialogueNode.initImageIds?.forEach((nodeId) => {
      const node = nodeManagerStore.nodeMap.get(nodeId) as ImageNode
      addViewerNodeMap(nodeId, node)
    })
    dialogueNode.initCustomIds?.forEach((nodeId) => {
      const node = nodeManagerStore.nodeMap.get(nodeId) as CustomNode
      addViewerNodeMap(nodeId, node)
    })
    dialogueNode.initAudioIds?.forEach((nodeId) => {
      const node = nodeManagerStore.nodeMap.get(nodeId) as AudioNode
      addViewerNodeMap(nodeId, node)
    })
    dialogueNode.initVideoIds?.forEach((nodeId) => {
      const node = nodeManagerStore.nodeMap.get(nodeId) as VideoNode
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
    const captionNode = nodeManagerStore.nodeMap.get(captionId) as CaptionNode
    addViewerNodeMap(captionId, captionNode)
    curCaptionId.value = captionId
  }

  function removeRelatedResources(nodeId: number) {
    if (nodeId === -1) return
    const node = nodeManagerStore.nodeMap.get(nodeId) as EngineNode
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
    const actionNode = nodeManagerStore.nodeMap.get(actionId) as ActionNode
    if (actionNode) {
      let condition = true
      for (let id of actionNode.executeConditionIds) {
        const conditionNode = nodeManagerStore.nodeMap.get(id) as ConditionNode
        const res = runCode(conditionNode.func)
        if (!res) condition = false
      }

      if (!condition) return
      setTimeout(() => {
        switch (actionNode.actionType) {
          case ActionTypeEnum.ShowImage: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Image) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideImage: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Image) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.ShowVideo: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Video) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideVideo: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
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
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Audio) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.StopAudio: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Audio) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.ShowFilter: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Filter) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideFilter: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Filter) {
              removeViewerNodeMap(targetNode.id)
            }
            break
          }
          case ActionTypeEnum.ShowCustom: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Custom) {
              addViewerNodeMap(targetNode.id, targetNode)
            }
            break
          }
          case ActionTypeEnum.HideCustom: {
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Custom) {
              removeViewerNodeMap(targetNode.id)
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
            const targetNode = nodeManagerStore.nodeMap.get(actionNode.targetId)
            if (targetNode?.nodeType === NodeEnum.Scene) {
              startScene(actionNode.targetId)
            }
            break
          }
          case ActionTypeEnum.DataChange: {
            try {
              const data = parseJS(gameData.value)
              const extra = parseJS(extraData.value) as Record<string, unknown>
              const fn = new Function(
                'gameData',
                'extraData',
                `
                  try {
                    ${actionNode.dataChangeFunc}
                  } catch(e) {
                    return { error: e.message };
                  }
                `
              )
              fn(data, extra)
              gameData.value = JSON.stringify(data)
              extra.gameData = gameData.value
              extraData.value = JSON.stringify(extra)
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
    gameData,
    doAction,
    viewerNodeMap,
    viewerNodeGroups,
    startCaption,
    startDialogue,
    startScene,
    viewerKeys,
    viewerCurtainNodeMap,
    addViewerNodeMap,
    removeViewerNodeMap,
    updateLoadedGameData,
    updateExtraData,
    extraData
  }
})
