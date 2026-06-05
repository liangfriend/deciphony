import type { Frame, VDom } from '@/types/common';
import type { MusicScore } from '@/types/MusicScoreType';
export type RelativeFrame = Pick<Frame, 'relativeX' | 'relativeY' | 'relativeW' | 'relativeH'>;
/**
 * 从曲谱树收集「id → 累计 Frame 偏移」。
 *
 * 级联规则（子级在 map 中的值为祖先 Frame 之和 + 自身 Frame，见 registerFrame / mergeFrames）：
 * - NoteSymbol：自身 → 各 NotesInfo → 变音号 / 附点 / 单音附属符号 / 倚音 NotesInfo 链；
 *   上下加线（vDom addLine_u / addLine_g，targetId=extreme NotesInfo.id / 倚音 NotesInfo.id）走 NotesInfo 链累计 Frame，
 *   apply 时仅 relativeX（Y 随小节 region 布局，X 随音符头）
 * - NoteRest：自身 → 附点、单音附属、谱号
 * - NoteNumber（简谱）：自身 → 各 NotesNumberInfo → 变音号、倚音链
 * - Measure：自身；小节线 / 谱号 / 调号 / 拍号 / 反复记号 / 单小节附属 仅合并各自对象（不继承 measure 的 relative，除非将来改 registerMeasure）
 * - GrandStaff / SingleStaff / Bracket：仅各自 id
 *
 * 布局用 targetId（如 `g-${grandStaffId}`）与曲谱 id 不一致时，Frame 不会自动作用到插槽 vDom，需改 targetId 或 register 逻辑。
 */
export declare function collectRelativeFrameMap(musicScore: MusicScore): Map<string, RelativeFrame>;
export declare function applyRelativeFrameToVDom<T extends VDom>(node: T, frame: Partial<Frame> | RelativeFrame | undefined | null): T;
/**
 * 对 vDoms[startIndex, endIndex) 中具备 targetId 的节点，按 frameMap 累计值平移/扩缩几何（x/y/w/h）。
 * 连音线（special.slur）、符杠（tag noteBeam + special.beam）会同步平移 startPoint/endPoint 与 centerX。
 * applied：已处理过的节点引用，用于多阶段 apply 时避免对同一 vDom 重复叠加偏移。
 *
 * musicScoreToVDom 不在全曲渲染结束后只调用一次本函数，原因见 standardStaff/musicScoreToVDomImpl：
 * processBeam/processGraceBeam 依赖已偏移的 noteStem 接点生成 noteBeam，且 noteBeam 通常无 targetId；
 * 连音线在符号偏移后才取 noteHead 锚点；连谱号等布局 vDom 晚于小节符号才创建。
 */
export declare function applyRelativeFramesToVDomRange(nodes: VDom[], frameMap: ReadonlyMap<string, RelativeFrame>, startIndex?: number, endIndex?: number, applied?: WeakSet<VDom>): void;
/** 对整棵 vDom 树施加相对偏移；曲谱主流程请用分阶段 apply（见 musicScoreToVDomImpl），勿假定末尾一次即可 */
export declare function applyRelativeFramesToVDoms(nodes: VDom[], frameMap: ReadonlyMap<string, RelativeFrame>, startIndex?: number, applied?: WeakSet<VDom>): void;
