import type { NumberNotationSkinKeyEnum } from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type { StandardStaffSkinKeyEnum } from "@/standardStaff/enums/standardStaffSkinKeyEnum";
/** 按曲谱模式区分的 skinKey 联合类型 */
export type SkinKey = StandardStaffSkinKeyEnum | NumberNotationSkinKeyEnum;
/** 按种类区分：复谱表、单谱表、小节、音符、休止符、谱号/调号/拍号/小节线、插槽、空白等 */
export type VDomTagType = 'title' | 'root' | 'grandStaff' | 'singleStaff' | 'measure' | 'noteHead' | 'rest' | 'clef_f' | 'clef_b' | 'keySignature_f' | 'keySignature_b' | 'timeSignature_f' | 'timeSignature_b' | 'barline_f' | 'barline_b' | 'linked_barline' | 'close_line' | 'noteStem' | 'noteTail' | 'noteBeam' | 'accidental' | 'addLine' | 'slot' | 'space' | 'affiliation';
/** 时值：256=全音符，128=二分，64=四分，32=八分，16=十六分，8=三十二分，4=六十四分，2=128分，1=256分 */
export type Chronaxie = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256;
export type VDom = {
    x: number;
    y: number;
    w: number;
    h: number;
    startPoint: {
        x: number;
        y: number;
    };
    endPoint: {
        x: number;
        y: number;
    };
    targetId: string;
    zIndex: number;
    tag: VDomTagType;
    /** 指定 skin 中唯一对应的 SVG 图形；五线谱为 StandardStaffSkinKeyEnum，简谱为 NumberNotationSkinKeyEnum */
    skinKey?: SkinKey;
    skinName: string;
    slotName?: SlotName;
    /** 插槽返回的数据：g 开头返回 GrandStaff，s 开头返回 SingleStaff，m 开头返回 Measure；t 无 */
    slotData?: SlotData;
    dataComment?: string;
    special: {
        slur?: {
            relativeStartPoint: {
                x: number;
                y: number;
            };
            relativeEndPoint: {
                x: number;
                y: number;
            };
            relativeControlPoint: {
                x: number;
                y: number;
            };
            thickness: number;
        };
        volta?: Record<string, unknown>;
        beam?: {
            /** 本段内每条符杠，type 表示伸展方向，scaleX 表示从 centerX 向外的缩放，默认 1 */
            lines: {
                type: 'left' | 'right' | 'both' | 'none';
                scaleX?: number;
            }[];
            /** 本段对应音符符干中心 x 坐标，配合 type 计算实际绘制范围 */
            centerX: number;
            spacing: number;
            thickness: number;
            direction: 'up' | 'down';
        };
    };
};
/** 插槽返回的数据：g 开头返回 GrandStaff，s 开头返回 SingleStaff，m 开头返回 Measure */
export type SlotData = import('@/types/MusicScoreType').GrandStaff | import('@/types/MusicScoreType').SingleStaff | import('@/types/MusicScoreType').Measure;
export type SlotName = 'g' | 's' | 'g-l' | 'g-r' | 's-l' | 's-r' | 'm' | 'm-u' | 'm-d' | 's-u' | 's-d' | 'g-u' | 'g-d' | 't' | 'e';
export type SlotConfig = Partial<Record<SlotName, {
    w?: number;
    h?: number;
    zIndex?: number;
}>>;
/** 插槽作用域 props：用户在使用具名插槽时可接收；node.slotData 为对应上下文数据 */
export type SlotProps = {
    node: VDom;
};
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
/** 单套皮肤包：按曲谱模式嵌套，一谱一套 skinKey */
export type SkinPack = {
    standardStaff?: StandardStaffSkinPack;
    numberNotation?: NumberNotationSkinPack;
};
/** 多套皮肤包：skinName -> 皮肤包。default 覆盖内置 defaultSkin；其他 skinName 用于符号级切换（如高亮） */
export type Skin = Record<string, SkinPack>;
export type Frame = {
    relativeX: number;
    relativeY: number;
    relativeW: number;
    relativeH: number;
};
