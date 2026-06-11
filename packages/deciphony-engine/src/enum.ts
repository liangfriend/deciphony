export enum NodeEnum {
  Story = 'Story',
  Scene = 'Scene',
  Dialogue = 'Dialogue',
  Caption = 'Caption', // 字幕节点
  Action = 'Action', // 行为节点
  Option = 'Option', // 选项节点
  Layout = 'Layout', // 布局节点
  Image = 'Image', // 图片节点
  Video = 'Video', // 视频节点
  Audio = 'Audio', // 音频节点
  Custom = 'Custom', // 自定义节点
  Curtain = 'Curtain', // 幕布节点
  Filter = 'Filter', // 滤镜节点
  Condition = 'Condition' // 条件节点
}

export enum ActionTypeEnum {
  ShowImage = 'ShowImage',
  HideImage = 'HideImage',
  ShowVideo = 'ShowVideo',
  HideVideo = 'HideVideo',
  PlayVideo = 'PlayVideo',
  StopVideo = 'StopVideo',
  PlayAudio = 'PlayAudio',
  StopAudio = 'StopAudio',
  ShowFilter = 'ShowFilter',
  HideFilter = 'HideFilter',
  ShowCustom = 'ShowCustom',
  HideCustom = 'HideCustom',

  ActiveCurtain = 'ActiveCurtain', // 激活幕布
  Animation = 'Animation', // 动画行为
  Combined = 'Combined', // 组合式行为
  Next = 'Next', // 场景或对话节点的跳转
  Custom = 'Custom', // 自定义行为
  DataChange = 'DataChange' // 数据修改行为
}

export enum LayoutPositionEnum {
  LT = 'LT',
  LB = 'LR',
  RT = 'RT',
  RB = 'RB'
}

export enum ResourceNodeEnum {
  Audio = 'Audio',
  Image = 'Image',
  Video = 'Video',
  Custom = 'Custom'
}

export enum LayerEnum {
  /** 背景层（远景） */
  Background = 'Background',

  /** 人物身后的物体层（中景后方） */
  BehindObject = 'BehindObject',

  /** 人物层（角色所在层） */
  Character = 'Character',

  /** 人物前方的物体层（中景前方） */
  FrontObject = 'FrontObject',

  /** 特效层（光效、粒子、环境效果等） */
  Effect = 'Effect',

  /** 功能组件层（对白文字、提示文本、小游戏、按钮等） */
  Operation = 'Operation',

  /** 幕布层（场景切换、黑幕、淡入淡出等） */
  Curtain = 'Curtain'
}

// 幕布类型
export enum CurtainTypeEnum {
  // 方向类（可扩展上下左右）
  SlideUpInUpOut = 'SlideUpInUpOut',
  // 渐变类
  FadeInOut = 'FadeInOut',
  // 双开门
  Door = 'DoorOpenClose' // 双开门出入（InOut）
}

// 编辑器节点盒类型
export enum EditorBoxEnum {
  NormalRect = 'NormalRect', // 普通盒（场景，对话）

  None = 'None' // 无盒
}

// 图片，视频展示策略
export enum ObjectFitEnum {
  Fill = 'Fill',
  Contain = 'Contain'
}
