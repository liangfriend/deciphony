// 虚拟DOM节点类型：供开发者用 tag 区分点击目标，不参与 skin 查找
import type {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import type {
    ArpeggioTypeEnum,
    BendTypeEnum,
    HairpinTypeEnum,
    PedalTypeEnum,
    PitchTypeEnum,
    SlurTypeEnum,
    TrillTypeEnum,
} from "@/enums/musicScoreEnum";
import type {NoteName} from "@/enums/musicScoreEnum";
import {
    MusicScore,
    GrandStaff,
    SingleStaff,
    Measure,
    NotesInfo,
    NotesNumberInfo,
    NoteSymbol, NoteNumber,
} from "@/types/MusicScoreType";
import type {Barre, StringState} from "@/types/MusicScoreType";

/** 按曲谱模式区分的 skinKey 联合类型 */
export type SkinKey = StandardStaffSkinKeyEnum | NumberNotationSkinKeyEnum | Tab6SkinKeyEnum | DrumNotationSkinKeyEnum;

/** 按种类区分：复谱表、单谱表、小节、音符、休止符、谱号/调号/拍号/小节线、插槽、空白等 */
export type VDomTagType =
    | 'title'          // 标题
    | 'root'           // 根
    | 'grandStaff'     // 复谱表
    | 'singleStaff'    // 单谱表
    | 'measure'        // 小节
    | 'noteHead'           // 音符头
    | 'noteNumber'      // 简谱音符
    | 'gracePedestal'  // 简谱倚音托架
    | 'tabNoteNumber'    // 吉他谱/贝斯/尤克里里谱音符
    | 'rest'           // 休止符
    | 'clef_f'         // 前置谱号
    | 'clef_b'         // 后置谱号
    | 'keySignature_f' // 前置调号
    | 'keySignature_b' // 后置调号
    | 'timeSignature_f' // 前置拍号
    | 'timeSignature_b' // 后置拍号
    | 'barline_f'      // 前置小节线
    | 'barline_b'      // 后置小节线
    | 'linked_barline' // 连谱小节线
    | 'close_line'     // 闭合线（第一小节左侧）
    | 'linked_close_line' // 连谱闭合线
    | 'bracket'        // 连谱号（不参与布局，浮于谱表左侧）
    | 'noteStem'       // 符干
    | 'noteTail'       // 符尾
    | 'noteBeam'       // 符杠
    | 'accidental'     // 变音符号
    | 'addLine'        // 简谱加时线
    | 'addLine_u'      // 五线谱上加线
    | 'addLine_g'      // 五线谱下加线
    | 'repeat_f'       // 小节前反复符号（Coda / Segno）
    | 'repeat_b'       // 小节末反复符号（DC / DS / Fine 等）
    | 'slot'           // 插槽
    | 'space'          // 空白（边距等）
    | 'affiliation'    // 附属符号
    | 'arpeggio'       // 吉他谱音符琶音
    | 'strumming'      // 吉他谱音符扫弦
    | 'tabChord'       // 吉他谱和弦图
    | 'tabSlap'        // 吉他谱拍弦框
    | 'bend'           // 吉他谱推弦
    | 'augmentationDot'    // 附点
    | 'longRest'       // 鼓谱长休止符（头 / 内容 / 尾 / 完整）
    | 'longRestNumber' // 鼓谱长休止符小节数
    | 'measureNumber'  // 小节号（MusicScore.measureNumber）
/** 时值：256=全音符，128=二分，64=四分，32=八分，16=十六分，8=三十二分，4=六十四分，2=128分，1=256分 */
export type Chronaxie = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256

export type VDom = {
    x: number;
    y: number;
    w: number;
    h: number;
    /** 视觉缩放比例（1 为默认）；由 group.vue 对 skin 内容做 transform，w/h 仍为布局占位 */
    scale?: number;
    /**
     * 简谱数字 / 休止符：附属物超出数字框的距离（≥0）。
     * top = 上八度点；bottom = 减时线 + 下八度点；left = 变音符号；right 暂为 0。附属锚点 numberNotationAnchor 读此值
     */
    numberNotationExtent?: { top: number; bottom: number; left: number; right: number };
    startPoint: { x: number, y: number } // 部分特殊情况使用，如连音线
    endPoint: { x: number, y: number } // 部分特殊情况使用，如连音线
    targetId: string,
    //
    zIndex: number; // 渲染顺序
    tag: VDomTagType;
    /** 指定 skin 中唯一对应的 SVG 图形；五线谱为 StandardStaffSkinKeyEnum，简谱为 NumberNotationSkinKeyEnum */
    skinKey?: SkinKey;
    skinName: string; // 皮肤名
    slotName?: SlotName;  // 插槽名称，tag='slot'时使用
    /** 插槽上下文：musicScore 必有；g/s/m 前缀插槽逐级填充 grandStaff / singleStaff / measure；self 为当前插槽锚点 */
    slotData?: SlotData;
    dataComment?: string;
    special: {
        slur?: {
            relativeStartPoint: { x: number, y: number }, // slur 起点相对坐标
            relativeEndPoint: { x: number, y: number }, // slur 终点相对坐标
            relativeControlPoint: { x: number, y: number }, // slur 控制点相对坐标
            thickness: number, // 厚度，两个贝塞尔曲线控制点的y值差
            type?: SlurTypeEnum, // 吉他谱连音线中心文字（H/S/P/HP）
            relativeTextPoint?: { x: number, y: number }, // 文字相对控制点偏移
            /**
             * 朝向（渲染时按符干取值，不写回 data）：起止符干都向上 → 'down'（画在符头下方），否则 'up'。
             * 决定默认 controlPoint 在两端上方还是下方；分段时决定两段半月牙往哪边拱。简谱无符干，恒为 'up'
             */
            direction?: 'up' | 'down',
            /**
             * 起止音符不在同一单谱表（如换行）：月牙从中间切开成两段，左段挂起点、右段挂终点，
             * 断开处 = 起点 / 终点 ± splitGap（随端点整体平移，每段是固定形状），拱高为同跨度整段的 2 倍；controlPoint 不起作用
             */
            split?: boolean,
            /** 分段时断开处到起止默认锚点的横向距离（= measureHeight） */
            splitGap?: number,
        };
        volta?: {
            openLeft?: boolean,
            openRight?: boolean,
            text?: string
        };
        beam?: {
            /** 本段内每条符杠，type 表示伸展方向，scaleX 表示从 centerX 向外的缩放，默认 1 */
            lines: { type: 'left' | 'right' | 'both' | 'none'; scaleX?: number }[];
            /** 本段对应音符符干中心 x 坐标，配合 type 计算实际绘制范围 */
            centerX: number;
            spacing: number;
            thickness: number;
            direction: 'up' | 'down';
        };
        /** 单 slot 附属琶音 / 吉他谱音符琶音 */
        arpeggio?: {
            thickness?: number;
            arrowWidth?: number;
            /** 是否画箭头；缺省 true */
            arrow?: boolean;
            /** normal=椭圆单元曲线；staright=直线 */
            type?: ArpeggioTypeEnum;
            relativeStartPoint?: { x: number, y: number };
            relativeEndPoint?: { x: number, y: number };
        };
        /** 单 slot 附属扫弦 / 吉他谱音符扫弦 */
        strumming?: {
            thickness?: number;
            arrowWidth?: number;
            /** 是否画箭头；缺省 true */
            arrow?: boolean;
            relativeStartPoint?: { x: number, y: number };
            relativeEndPoint?: { x: number, y: number };
        };
        /** 双 slot 附属踏板 */
        pedal?: {
            thickness?: number;
            type?: PedalTypeEnum;
            relativeStartPoint?: { x: number, y: number };
            relativeEndPoint?: { x: number, y: number };
        };
        /** 双 slot 附属八度记号（pitch_up / pitch_down） */
        pitch?: {
            thickness?: number;
            type?: PitchTypeEnum;
            /** pitch_up | pitch_down */
            direction?: 'up' | 'down';
            relativeStartPoint?: { x: number, y: number };
            relativeEndPoint?: { x: number, y: number };
        };
        /** 双 slot 附属颤音线（trill_line） */
        trill?: {
            type?: TrillTypeEnum;
            relativeStartPoint?: { x: number, y: number };
            relativeEndPoint?: { x: number, y: number };
        };
        /** 双 slot 附属渐强 / 渐弱（hairpin） */
        hairpin?: {
            thickness?: number;
            type?: HairpinTypeEnum;
            /** 楔形开口高度 */
            height?: number;
            relativeStartPoint?: { x: number, y: number };
            relativeEndPoint?: { x: number, y: number };
        };
        /** 吉他谱 slot 和弦图（不含 id） */
        tabChord?: {
            width: number;
            height: number;
            stringCount: number;
            name: string;
            fretCount: number;
            baseFret: number;
            barres: Barre[];
            tuning: NoteName[];
            stringStates: StringState[];
            textSize?: number;
            nameSize?: number;
        };
        /** 推弦（坐标为绝对值；period 内点为 cubic 贝塞尔与标注） */
        bend?: {
            period_one: {
                relativeStartPoint: { x: number, y: number },
                relativeEndPoint: { x: number, y: number },
                relativeStartControlPoint: { x: number, y: number },
                relativeEndControlPoint: { x: number, y: number },
                relativeTextPoint?: { x: number, y: number },
                text: string,
            },
            period_two?: {
                relativeStartPoint: { x: number, y: number },
                relativeEndPoint: { x: number, y: number },
                relativeStartControlPoint: { x: number, y: number },
                relativeEndControlPoint: { x: number, y: number },
                relativeTextPoint?: { x: number, y: number },
                text: string,
            },
            thickness: number,
            type: BendTypeEnum,
        };
        /** 吉他谱拍弦框（描边颜色来自皮肤，坐标用 vDom.startPoint/endPoint） */
        tabSlap?: Record<string, never>;
        /** 鼓谱长休止符小节数（颜色来自皮肤，文字在 x/y/w/h 框内居中） */
        longRestNumber?: {
            count: number;
        };
        /** 小节号（文字在 x/y/w/h 框内左对齐、垂直居中；同一 targetId 的多个小节号靠 number 区分） */
        measureNumber?: {
            number: number;
            bracket?: boolean;
        };
        /**
         * 同音符多条线须区分（写入 vdomSelectionKey / DOM id）：
         * - 五线加线 addLine_u/g：ledger 线号（上：10,12,…；下：-2,-4,…）
         * - 简谱加时线 addLine：0-based 序号
         */
        ledgerLine?: number;
    }
}

/** 插槽上下文：按插槽层级填充，self 为当前插槽锚点对象 */
export type SlotData = {
    musicScore: MusicScore;
    grandStaff: GrandStaff | null;
    singleStaff: SingleStaff | null;
    measure: Measure | null;
    note: NoteSymbol | NoteNumber | null;
    info: NotesInfo | NotesNumberInfo | null;
    self: MusicScore
        | GrandStaff
        | SingleStaff
        | Measure
        | NoteSymbol
        | NoteNumber
        | NotesInfo
        | NotesNumberInfo;
}
// 曲谱层面13个插槽名称（不含符号层面 symbol-*）
export type SlotName =
    | 'g' | 's'
    | 'g-l' | 'g-r'
    | 's-l' | 's-r'
    | 'm' | 'm-u' | 'm-d' | 's-u'
    | 's-d' | 'g-u' | 'g-d' | 't' | 'e'

// 插槽配置：影响 transfer 布局计算的宽高；zIndex 未配置时 slot 默认 1000，m 插槽默认 1100
export type SlotConfig = Partial<Record<SlotName, { w?: number; h?: number; zIndex?: number }>>

/** 插槽作用域 props：用户在使用具名插槽时可接收；node.slotData 为对应上下文数据 */
export type SlotProps = { node: VDom };

/** 皮肤项：content + 尺寸 + skinKey（每谱的 key 枚举不同）；可选宽度占比供数据未设置时回退 */
export type SkinItem<K extends string = string> = {
    content: string;
    w: number;
    h: number;
    skinKey: K;
    /** 符号在小节内宽度占比（数据未设置时使用，0 为有效值） */
    widthRatio?: number;
    /** 符号对单谱表小节宽度占比（数据未设置时使用，0 为有效值） */
    widthRatioForMeasure?: number;
};

/** 五线谱单套皮肤包 */
export type StandardStaffSkinPack = Record<StandardStaffSkinKeyEnum, SkinItem<StandardStaffSkinKeyEnum>>;

/** 简谱单套皮肤包 */
export type NumberNotationSkinPack = Record<NumberNotationSkinKeyEnum, SkinItem<NumberNotationSkinKeyEnum>>;
/** 吉他谱单套皮肤包 */
export type Tab6SkinPack = Record<Tab6SkinKeyEnum, SkinItem<Tab6SkinKeyEnum>>;
export type Tab4SkinPack = Tab6SkinPack;
export type Tab5SkinPack = Tab6SkinPack;
/** 鼓谱单套皮肤包 */
export type DrumNotationSkinPack = Record<DrumNotationSkinKeyEnum, SkinItem<DrumNotationSkinKeyEnum>>;

/** 单套皮肤包：按曲谱模式嵌套，一谱一套 skinKey */
export type SkinPack = {
    standardStaff?: StandardStaffSkinPack;
    numberNotation?: NumberNotationSkinPack;
    tab6?: Tab6SkinPack;
    tab4?: Tab4SkinPack;
    /** 五弦 TAB（五弦贝斯）；小节线默认与五线谱 measure 同几何 */
    tab5?: Tab5SkinPack;
    /** 不设置时使用内置默认鼓谱皮肤 */
    drumNotation?: DrumNotationSkinPack;
};

/** 多套皮肤包：skinName -> 皮肤包。default 覆盖内置 defaultSkin；其他 skinName 用于符号级切换（如高亮） */
export type Skin = Record<string, SkinPack>;
// 相对位置偏移。是否起效取决于元素类型，具体请查看对照表
export type Frame = {
    relativeX: number,
    relativeY: number,
    relativeW: number,
    relativeH: number,
    /**
     * 小节内列宽权重（getNoteWidthRatio；未设置时用皮肤包；0 为有效值）。
     * 带 Frame 的节点并非都会使用（如 GrandStaff、连音线、NotesInfo 等可忽略）。
     */
    widthRatio?: number,
    /**
     * 小节总宽分配权重（getMeasureWidthRatio；未设置时用皮肤包；0 为有效值）。
     */
    widthRatioForMeasure?: number,
}