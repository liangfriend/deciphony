import {
  AudioNode,
  CaptionNode,
  CaptionStatus,
  DialogueNode,
  LayoutNode,
  SceneNode
} from '@/types'
import {computed, CSSProperties, onBeforeUnmount, onMounted, Ref, ref, watch} from 'vue'
import {LayoutPositionEnum} from '@/enum'
import {useRouter} from 'vue-router'
import {useNodeManager} from '@/composables/useNodeManager'
import {useGame} from '@/composables/useGame'
import {parseJS} from '@/utils/execJS'

const router = useRouter()
const {nodeMap} = useNodeManager()
const {
  curCaptionId,
  curSceneId,
  curDialogueId,
  doAction,
  viewerNodeMap,
  viewerNodeGroups,
  startCaption,
  startDialogue,
  startScene,
  addViewerNodeMap,
  removeViewerNodeMap
} = useGame()

// 给字幕节点内部用的,caption的audioId不受viewerNodeMap管辖
export function useCaption(
  props: {
    captionNode: CaptionNode
    layout: LayoutNode
    canvasWidth: number
    canvasHeight: number
  },
  emit: (type: string, ...data: any) => void,
  captionRef: Ref<SVGAElement>
) {
  const status = ref<CaptionStatus>('idle')
  const displayText = ref('')
  const visible = ref(false)
  let timeoutId: number | null = null // 用于存储 setTimeout 的 ID
  // 打字效果是否被中断
  let typingInterrupted = false
  // 触发状态变更
  const setStatus = (s: CaptionStatus) => {
    if (status.value === s) return
    status.value = s
    if (s === 'finished') {
      // 执行finish行为
      props.captionNode.finishActionIds.forEach((actionId) => {
        doAction(actionId)
      })
    } else if (s === 'done') {
      // 停止字幕音频, 字幕音频即使字幕finish状态也不会销毁
      removeViewerNodeMap(props.captionNode.audioId)
      // 执行done行为
      props.captionNode.doneActionIds.forEach((actionId) => {
        doAction(actionId)
      })
    } else if (s === 'playing') {
      // 字幕语音
      const audioNode = nodeMap.value.get(props.captionNode.audioId) as AudioNode
      // 播放字幕音频
      if (audioNode) {
        // 获取视图节点map中的manager
        addViewerNodeMap(props.captionNode.audioId, audioNode)
      }
      // 播放字幕
      playTyping()
    }
    emit('statusChange', s, props.captionNode)
  }

  // 打字机效果
  const playTyping = async () => {
    displayText.value = ''

    if (typingInterrupted) return
    const chars = props.captionNode.content.split('')
    for (let i = 0; i < chars.length; i++) {
      if (typingInterrupted) return
      displayText.value += chars[i]
      await new Promise((r) => setTimeout(r, props.captionNode.speed))
    }
    if (!typingInterrupted) {
      setStatus('finished')
    }
  }
  // 立即完成显示全文
  const finishNow = () => {
    typingInterrupted = true
    displayText.value = props.captionNode.content
  }
  // 交互事件处理
  const handleUserAction = () => {
    if (status.value === 'done') {
      return
    }
    if (status.value === 'finished') {
      setStatus('done')
      changeNext()
      return
    }
    if (status.value === 'idle') {
      // 设置autoPlay后，不可以手动触发
      if (timeoutId === null) {
        setStatus('playing')
      }
    } else if (status.value === 'playing') {
      setStatus('finished')
      finishNow()
    }
  }

  // 重新触发打字机
  watch(() => props.captionNode, init, {immediate: false, deep: true})

  function init() {
    // 展示字幕框，这个visible应该没有必要
    visible.value = true
    // 执行初始化行为
    props.captionNode.initActionIds.forEach((actionId) => {
      doAction(actionId)
    })

    if (props.captionNode.autoPlay) {
      // 延时效果
      timeoutId = window.setTimeout(() => {
        // 自动触发，延时后触发
        setStatus('playing')
      }, props.captionNode.autoPlayDelay)
    }
  }

  // 如果当前字幕是最后一条，跳转下一条字幕/对话
  function changeNext() {
    const sceneNode = nodeMap.value.get(curSceneId.value) as SceneNode
    const dialogueNode = nodeMap.value.get(curDialogueId.value) as DialogueNode
    const captionNode = nodeMap.value.get(curCaptionId.value) as CaptionNode
    const captionIndex = dialogueNode.initCaptionIds.findIndex((e) => e === curCaptionId.value)
    const dialogueIndex = sceneNode.initDialogueIds.findIndex((e) => e === curDialogueId.value)
    const nextCaptionId = dialogueNode.initCaptionIds[captionIndex + 1]
    if (captionNode.autoNext) {
      if (nextCaptionId) {
        startCaption(nextCaptionId)
      } else if (captionIndex === dialogueNode.initCaptionIds.length - 1) {
        const nextDialogueId = sceneNode.initDialogueIds[dialogueIndex + 1]
        if (nextDialogueId) {
          startDialogue(nextDialogueId)
        }
        // 到结尾了
      } else {
        // 通过行为跳转过来的
      }
    }
  }

  // 执行点击行为
  function executingAction(ids: number[]) {
    ids.forEach((id) => {
      doAction(id)
    })
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') handleUserAction()
  }
  watch(captionRef, () => {
    if (captionRef) {
      captionRef.value.addEventListener('keydown', onKey)
      captionRef.value.addEventListener('click', handleUserAction)
    }
  })
  onBeforeUnmount(() => {
    captionRef.value.removeEventListener('keydown', onKey)
    captionRef.value.removeEventListener('click', handleUserAction)
  })
  onMounted(() => {
    init()
  })

  // 计算位置
  const calcLayout = () => {
    const {left, right, top, bottom, width, height, applyPosition} = props.layout
    const {canvasWidth, canvasHeight} = props

    let x = 0,
      y = 0
    switch (applyPosition) {
      case LayoutPositionEnum.LT:
        x = left
        y = top
        break
      case LayoutPositionEnum.LB:
        x = left
        y = canvasHeight - bottom - height
        break
      case LayoutPositionEnum.RT:
        x = canvasWidth - right - width
        y = top
        break
      case LayoutPositionEnum.RB:
        x = canvasWidth - right - width
        y = canvasHeight - bottom - height
        break
    }

    return {x, y, width, height}
  }
  // 样式
  const captionTextStyle = computed((): CSSProperties => {
    const res: CSSProperties = {
      ...parseJS(props.captionNode.captionTextStyle),
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'box-sizing': 'border-box',
      'white-space': 'pre-wrap',
      'user-select': 'none',
      'pointer-events': 'auto'
    }
    return res
  })
  const captionTitleStyle = computed((): CSSProperties => {
    const res: CSSProperties = {
      ...parseJS(props.captionNode.captionTitleStyle)
    }
    return res
  })

  const {x, y, width, height} = calcLayout()

  return {
    visible,
    executingAction,
    status,
    x,
    y,
    width,
    height,
    captionTextStyle,
    captionTitleStyle,
    displayText,
    layout: props.layout
  }
}
