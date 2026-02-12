// 虚拟DOM节点类型：供开发者用 tag 区分点击目标，不参与 skin 查找
import {SkinKeyEnum} from "@/enums/musicScoreEnum";

/** 按种类区分：复谱表、单谱表、小节、音符、休止符、谱号/调号/拍号/小节线、插槽、空白等 */
export type VDomTagType =
    | 'root'           // 根
    | 'grandStaff'     // 复谱表
    | 'singleStaff'    // 单谱表
    | 'measure'        // 小节
    | 'note'           // 音符
    | 'rest'           // 休止符
    | 'clef_f'         // 前置谱号
    | 'clef_b'         // 后置谱号
    | 'keySignature_f' // 前置调号
    | 'keySignature_b' // 后置调号
    | 'timeSignature_f' // 前置拍号
    | 'timeSignature_b' // 后置拍号
    | 'barline'        // 小节线
    | 'noteStem'       // 符干
    | 'noteTail'       // 符尾
    | 'slot'           // 插槽
    | 'space'          // 空白（边距等）
    | 'affiliation'    // 附属符号
/** 时值：256=全音符，128=二分，64=四分，32=八分，16=十六分，8=三十二分，4=六十四分，2=128分，1=256分 */
export type Chronaxie = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256

export type VDom = {
  x: number;
  y: number;
  w: number;
  h: number;
  startPoint: { x: number, y: number } // 部分特殊情况使用，如连音线
  endPoint: { x: number, y: number } // 部分特殊情况使用，如连音线
  targetId: string,
  //
  zIndex: number; // 渲染顺序
  tag: VDomTagType;
  /** 指定 skin 中唯一对应的 SVG 图形，用于符号等需要皮肤渲染的节点 */
  skinKey?: SkinKeyEnum;
  skinName: string; // 皮肤名
  slotName?: SlotName;  // 插槽名称，tag='slot'时使用
  dataComment?: string;
  special: {
    slur?: {
      relativeStartPoint: { x: number, y: number }, // slur 起点相对坐标
      relativeEndPoint: { x: number, y: number }, // slur 终点相对坐标
      relativeControlPoint: { x: number, y: number }, // slur 控制点相对坐标
      thickness: number, // 厚度，两个贝塞尔曲线控制点的y值差
    };
    volta?: Record<string, unknown>;
    beam?: {
      left: { x: number; y: number };
      right: { x: number; y: number };
      lineCount: number;
      spacing: number;
      thickness: number;
      direction: 'up' | 'down';
    };
  }
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

/** 单套皮肤包：skinKey -> 符号内容与尺寸 */
export type SkinPack = Record<SkinKeyEnum, {
  content: string;
  w: number;
  h: number;
  skinKey: SkinKeyEnum;
}>;

/** 多套皮肤包：skinName -> 皮肤包。default 覆盖内置 defaultSkin；其他 skinName 用于符号级切换（如高亮） */
export type Skin = Record<string, SkinPack>;
// 相对位置偏移。是否起效取决于元素类型，具体请查看对照表
export type Frame = {
  relativeX: number,
  relativeY: number,
  relativeW: number,
  relativeH: number,
}