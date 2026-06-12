import {
  ActionTypeEnum,
  CurtainTypeEnum,
  EditorBoxEnum,
  LayerEnum,
  LayoutPositionEnum,
  NodeEnum,
  ObjectFitEnum
} from '@/enum'

type Node = {
  id: number
  nodeName: string
  nodeType: string
}
export type StoryNode = Node & {
  nodeType: NodeEnum.Story
  width: number //svg的viewBox
  height: number //svg的viewBox
  entrySceneId: number // 以后要加上各种配置，比如字幕打字机音效是否开启
  bgUrl: string // 背景图url
  fontColor: string // 选项，标题文字颜色
}

export type SceneNode = Node & {
  nodeType: NodeEnum.Scene
  initImageIds: number[]
  initCustomIds: number[]
  initAudioIds: number[]
  initVideoIds: number[]
  initDialogueIds: number[] // 按顺序执行的字幕节点
  initActionIds: number[] // 初始化行为节点
  endCurationId: number // 结束幕布
}
export type DialogueNode = Node & {
  nodeType: NodeEnum.Dialogue
  autoShowFirstCaption: boolean // 是否自动展示首字幕,建议开启，否则需要actionNode去手动播放字幕
  keepIds: number[] // 此节点消失的时候，会保留这些选择的资源
  initImageIds: number[]
  initCustomIds: number[]
  initAudioIds: number[]
  initVideoIds: number[]
  initCaptionIds: number[] // 字幕节点[]
  initActionIds: number[] // 初始化行为节点
}

export type OptionNode = Node & {
  nodeType: NodeEnum.Option
  text: string // 文本
  activeActionIds: number[] // 选项触发后行为
  visibleConditionIds: number[] // 展示条件
  normalStyle: string
  hoverStyle: string
}
// TODO 后续可能需要加多种类型字幕打字效果，暂时先不做
export type CaptionNode = Node & {
  nodeType: NodeEnum.Caption
  content: string // 字幕内容
  speed: number // 打字机效果速度
  title: string // 发言人名称，会被字幕节点继承为title,
  boxStyle: string // 字幕框样式
  captionTextStyle: string // 字幕样式1
  captionTitleStyle: string // 发言人名称样式
  autoPlay: boolean // 自动播放
  autoNext: boolean // done事件会自动切换下一条字幕/对话
  audioId: number // 字幕配套语音

  autoPlayDelay: number // autoPlay为字幕触发后，延时出现（同时影响字幕配套语音），
  layoutId: number // 布局节点信息
  initActionIds: number[] // 初始化行为节点
  optionIds: number[] // 有选项的节点，建议设置autoNext为false,否则即使有选项，也会被点击触发下一条略过
  finishActionIds: number[] //进入完成态后的行为
  doneActionIds: number[] // 在完成态再次触发字幕后的行为
  optionContainerStyle: string // 选项容器样式
}
export type Animateion = {
  // 动画类型专用,动画行为，作用于imageNode customNode
  scale: number
  offsetX: number
  offsetY: number
  rotate: number
  transformOrigin: [number, number]
  duration: number // 动画时长
  opacity: number
  keepFinalState: boolean // 动画结束后是否保持最终态，loop为true时无效
  loop: boolean // 循环动画
}
export type ActionNode = Node & {
  nodeType: NodeEnum.Action
  actionType: ActionTypeEnum //事件类型
  targetId: number //行为目标id
  delay: number //延迟执行毫秒，会阻塞后边的行为
  animation: Animateion
  actionIds: number[] // 组合行为专用
  data?: any // 自定义行为节点时，携带的信息
  dataChangeFunc: string // 数据修改行为，可读写 extraData
  executeConditionIds: number[] // 执行条件
}
export type LayoutNode = Node & {
  nodeType: NodeEnum.Layout
  layer: LayerEnum
  applyPosition: LayoutPositionEnum
  objectFit: ObjectFitEnum
  left: number
  right: number
  top: number
  bottom: number //左右&上下组合选出两个
  width: number
  height: number
  rotation: number // 可选：旋转角度
  scale: number
}
export type ImageNode = Node & {
  nodeType: NodeEnum.Image
  layoutId: number // 布局节点id
  url: string // 资源路径
  initActionIds: number[] // 初始化行为节点
}
export type AudioNode = Node & {
  nodeType: NodeEnum.Audio
  url: string // 资源路径
  loop: boolean // TODO 循环播放
  initActionIds: number[] // 初始化行为节点
}
export type VideoNode = Node & {
  nodeType: NodeEnum.Video
  layoutId: number // 布局节点id
  url: string // 资源路径
  loop: boolean // TODO 循环播放
  autoplay: boolean // 自动播放
  initActionIds: number[] // 初始化行为节点 要想展示的时候就播放，需要在初始行为里调用播放视频行为
}
export type CustomNode = Node & {
  nodeType: NodeEnum.Custom
  layoutId: number // 布局节点id
  data: string // 自定义资源节点时，携带的信息
  
  initActionIds: number[] // 初始化行为节点
}

/** Custom 节点插槽 props，供外部 #custom 使用 */
export type CustomNodeSlotProps = {
  data: Record<string, unknown>
  customNode: CustomNode
  layout: LayoutNode
}
// 幕布节点
export type CurtainNode = Node & {
  nodeType: NodeEnum.Curtain
  curtainType: CurtainTypeEnum //  幕布类型
  anDuration: number // 动画持续时间
  delay: number // 延时启动动画
  url: string // 图片url
  color: string // 没有url时使用color
}
// 滤镜节点
export type FilterNode = Node & {
  nodeType: NodeEnum.Filter
  filterCanvasScript: string
  filterStyle: string
}

// 条件节点
export type ConditionNode = Node & {
  nodeType: NodeEnum.Condition
  func: string // 条件函数，可用 nodeMap、extraData
}
export type EngineNode =
  | StoryNode
  | SceneNode
  | DialogueNode
  | CaptionNode
  | ActionNode
  | LayoutNode
  | ImageNode
  | VideoNode
  | AudioNode
  | CustomNode
  | OptionNode
  | CurtainNode
  | FilterNode
  | ConditionNode
// 编辑器类型
export type EditorNode = {
  layout: {
    top: number
    left: number
    width: number
    height: number
  }
  boxType: EditorBoxEnum
  node: EngineNode
}

export type Prefab = {
  id: number
  name: string
  editorNodeList: EditorNode[]
}


// 字幕状态
export type CaptionStatus = 'idle' | 'playing' | 'finished' | 'done'
// 页面资源展示情况
export type ViewerNode = {
  images: {
    [key in LayerEnum]: {
      node: ImageNode
      layout: LayoutNode
    }[]
  }
  customs: {
    [key in LayerEnum]: {
      node: CustomNode
      layout: LayoutNode
    }[]
  }
  videos: {
    [key in LayerEnum]: {
      node: VideoNode
      layout: LayoutNode
    }[]
  }
  audios: {
    node: AudioNode
  }[]
  captions: {
    node: CaptionNode
    layout: LayoutNode
  }[]
  filters: {
    node: FilterNode
  }[]
}
export type AudioNodePlayer = {
  play: () => Promise<void>
  stop: () => void
  pause: () => void
  destory: () => void
}
export type VideoNodePlayer = {
  play: () => Promise<void>
  stop: () => void
  pause: () => void
  destory: () => void
}
// 存档数据
export type SaveData = {
  saveId: number
  gameId: number
  saveName: string
  data: any
  editorNodeList: EditorNode[]
}

export type SaveModel = {
  id: number
  game_id: string
  data: string
  name: string
  created_at?: number
  updated_at?: number
  deleted_at?: number
}

/** 场景切换时自动存档 emit 给外部的载荷 */
export type GameAutoSavePayload = {
  sceneId: number
  extraData: Record<string, unknown>
}

