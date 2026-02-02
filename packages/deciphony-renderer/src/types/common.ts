// 虚拟DOM节点类型：根、复谱表、单谱表、小节、插槽
export type VDomTagType = 'root' | 'grandStaff' | 'singleStaff' | 'measure' | 'slot' | 'space'

export type VDom = {
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  tag?: VDomTagType;
  slotName?: SlotName;  // 插槽名称，tag='slot'时使用
  dataComment?: string;
}

// 曲谱层面13个插槽名称（不含符号层面 symbol-*）
export type SlotName =
  | 'g-l' | 'g-r'
  | 's-l' | 's-r'
  | 'm' | 'm-u' | 'm-d' | 's-u'
  | 's-d' | 'g-u' | 'g-d'

// 插槽配置：影响 transfer 布局计算的宽高
export type SlotConfig = Partial<Record<SlotName, { w?: number; h?: number }>>

// 插槽作用域 props：用户在使用具名插槽时可接收
export type SlotProps = { node: VDom }

export type Skin = Record<string, string>;
export type Frame = {
  relativeX: number,
  relativeY: number,
  relativeW: number,
  relativeH: number,
}