import {
    DoubleMeasureAffiliatedSymbolRenderRule,
    DoubleNoteAffiliatedSymbolRenderRule,
    DoubleSlotAffiliatedSymbolRenderRule,
    type AffiliatedOffsetRule,
    type NumberNotationAnchor,
    SingleMeasureAffiliatedSymbolRenderRule,
    SingleNoteAffiliatedSymbolRenderRule,
    SingleSlotAffiliatedSymbolRenderRule,
} from '@/constants/renderRules';
import type {SkinKey, VDom, VDomTagType} from '@/types/common';
import type {
    DoubleMeasureAffiliatedSymbol,
    DoubleNoteAffiliatedSymbol,
    DoubleSlotAffiliatedSymbol,
    GrandStaff,
    Measure,
    MeasureNoteSlot,
    MusicScore,
    SingleNoteAffiliatedSymbol,
    SingleSlotAffiliatedSymbol,
} from '@/types/MusicScoreType';
import {
    ArpeggioTypeEnum,
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    DoubleSlotAffiliatedSymbolNameEnum,
    HairpinTypeEnum,
    isFretboardScoreType,
    MusicScoreTypeEnum,
    PedalTypeEnum,
    PitchTypeEnum,
    SingleSlotAffiliatedSymbolNameEnum,
    TrillTypeEnum,
} from '@/enums/musicScoreEnum';
import {NumberNotationSkinKeyEnum} from '@/numberNotation/enums/numberNotationSkinKeyEnum';
import {StandardStaffSkinKeyEnum} from '@/standardStaff/enums/standardStaffSkinKeyEnum';
import {Tab6SkinKeyEnum} from '@/tab6/enums/tab6SkinKeyEnum';
import type {NodeIdMap} from '@/standardStaff/render/types';
import {getMeasureSlots, isMeasureNoteVoices} from '@/utils/measureNotes';

const AFFILIATED_Z = 1200;
/** 反复房子带透明叠底，需压在音符（1200）之下，否则挡住音符头点击；仍高于插槽（1000 / m 1100） */
const VOLTA_Z = 1150;

export type RenderAffiliatedContext = {
    VDoms: VDom[];
    idMap: NodeIdMap;
    skinName?: string;
    notationType?: MusicScoreTypeEnum;
    /** 当前谱种皮肤包（取 w/h） */
    skin?: Record<string, { w: number; h: number }>;
    measureHeight?: number;
    /** 解析 slot 附属时需要曲谱树 */
    musicScore?: MusicScore;
    /** 本次渲染内懒建：音符 id → 所在单谱表 / 符干方向（连音线分段与朝向） */
    noteIndex?: NoteIndex;
    /** slot id → 所在小节 + slot；给了就不再遍历曲谱树查找 */
    slotIndex?: ReadonlyMap<string, LocatedSlot>;
};

export type NoteIndex = {
    staffOf: Map<string, string>;
    /** 符干向上的音符 id；不在表里 = 向下或无符干（吉他谱符干固定向下，简谱无符干） */
    stemUp: Set<string>;
};

function slurSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Slur;
    }
    if (isFretboardScoreType(notationType)) {
        return Tab6SkinKeyEnum.Slur;
    }
    return StandardStaffSkinKeyEnum.Slur;
}

function arpeggioSkinKey(
    notationType: MusicScoreTypeEnum | undefined,
    straight: boolean,
): SkinKey {
    void straight;
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Arpeggio;
    }
    if (isFretboardScoreType(notationType)) {
        return Tab6SkinKeyEnum.Arpeggio;
    }
    return StandardStaffSkinKeyEnum.Arpeggio;
}

function strummingSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Strumming;
    }
    if (isFretboardScoreType(notationType)) {
        return Tab6SkinKeyEnum.Strumming;
    }
    return StandardStaffSkinKeyEnum.Strumming;
}

function pedalSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Pedal;
    }
    if (isFretboardScoreType(notationType)) {
        return Tab6SkinKeyEnum.Pedal;
    }
    return StandardStaffSkinKeyEnum.Pedal;
}

function pitchSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    // 暂用 pedal 色值皮肤键族；未单独建 pitch 皮肤时回退 pedal / slur
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Pedal;
    }
    if (isFretboardScoreType(notationType)) {
        return Tab6SkinKeyEnum.Pedal;
    }
    return StandardStaffSkinKeyEnum.Pedal;
}

function voltaSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    return notationType === MusicScoreTypeEnum.NumberNotation
        ? NumberNotationSkinKeyEnum.Volta
        : StandardStaffSkinKeyEnum.Volta;
}

function offsetPx(rule: AffiliatedOffsetRule, measureHeight: number) {
    return {
        dx: rule.horizontal * measureHeight,
        dy: rule.vertical * measureHeight,
    };
}

function resolveMeasureHeight(ctx: RenderAffiliatedContext, noteHead: VDom): number {
    if (ctx.measureHeight != null && ctx.measureHeight > 0) return ctx.measureHeight;
    for (const entry of ctx.idMap.values()) {
        if (entry.measure?.h) return entry.measure.h;
    }
    return noteHead.h;
}

function resolveMeasureVDomForNote(map: NodeIdMap, noteHead: VDom): VDom | undefined {
    const cx = noteHead.x + noteHead.w / 2;
    const cy = noteHead.y + noteHead.h / 2;
    // 加线音符头在五线外：横向命中多行时取纵向最近的小节，不能取第一个
    let nearest: VDom | undefined;
    let nearestDist = Infinity;
    for (const entry of map.values()) {
        const m = entry.measure;
        if (!m) continue;
        if (cx < m.x || cx > m.x + m.w) continue;
        if (cy >= m.y && cy <= m.y + m.h) return m;
        const dist = cy < m.y ? m.y - cy : cy - (m.y + m.h);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = m;
        }
    }
    return nearest;
}

function setNodeIdMap(map: NodeIdMap, id: string, tag: VDomTagType, vdom: VDom): void {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[tag] = vdom;
}

function pushSkinAffiliated(
    ctx: RenderAffiliatedContext,
    targetId: string,
    skinKey: SkinKey | string | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    dataComment: string,
): void {
    if (!skinKey) return;
    const vdom: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x,
        y,
        w,
        h,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        targetId,
        skinKey: skinKey as SkinKey,
        dataComment,
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, targetId, 'affiliation', vdom);
}

function resolveSkinSize(
    skinKey: string | undefined,
    skin: Record<string, { w: number; h: number }> | undefined,
    notationFallbackH: number,
): { w: number; h: number } | null {
    if (!skinKey || !skin) return null;
    const item = skin[skinKey];
    if (!item) return null;
    return {w: item.w, h: item.h || notationFallbackH};
}

function resolveNoteHeadByNotesInfoId(map: NodeIdMap, notesInfoId: string): VDom | undefined {
    const entry = map.get(notesInfoId);
    if (!entry) return undefined;
    return entry.noteHead ?? entry.noteNumber ?? entry.tabNoteNumber ?? entry.rest;
}

/**
 * 简谱数字音符包围盒 = 数字框 + 渲染时写在 vDom 上的 numberNotationExtent（八度点 / 减时线 / 变音）。
 * extent 跟着 vDom 走，增量排版、Frame 平移后仍成立；不要在这里按数据重算布局。
 */
function numberNotationNoteBounds(noteHead: VDom) {
    const e = noteHead.numberNotationExtent;
    return {
        left: noteHead.x - (e?.left ?? 0),
        right: noteHead.x + noteHead.w + (e?.right ?? 0),
        top: noteHead.y - (e?.top ?? 0),
        bottom: noteHead.y + noteHead.h + (e?.bottom ?? 0),
    };
}

type NoteAnchorOptions = {
    rule: AffiliatedOffsetRule;
    measureHeight: number;
    notationType?: MusicScoreTypeEnum;
    extraX?: number;
    extraY?: number;
    /** 简谱边缘锚点；仅 NumberNotation 生效 */
    numberNotationAnchor?: NumberNotationAnchor;
    /** bottom/right 时加到锚点上的待绘符号尺寸 */
    symbolSize?: {w: number; h: number};
};

/**
 * 音符附属锚点：默认符头几何中心 + offset。
 * 简谱若规则带 numberNotationAnchor，则改到数字包围盒对应边（见 NumberNotationAnchor）。
 * tab 仍用品号顶边（历史行为）。
 */
function noteAnchorPoint(noteHead: VDom, opts: NoteAnchorOptions) {
    const {dx, dy} = offsetPx(opts.rule, opts.measureHeight);
    const extraX = opts.extraX ?? 0;
    const extraY = opts.extraY ?? 0;
    const cx = noteHead.x + noteHead.w / 2;
    const cy = noteHead.y + noteHead.h / 2;

    if (opts.notationType === MusicScoreTypeEnum.NumberNotation && opts.numberNotationAnchor) {
        const b = numberNotationNoteBounds(noteHead);
        const sw = opts.symbolSize?.w ?? 0;
        const sh = opts.symbolSize?.h ?? 0;
        switch (opts.numberNotationAnchor) {
            case 'top':
                return {x: (b.left + b.right) / 2 + dx + extraX, y: b.top + dy + extraY};
            case 'bottom':
                return {x: (b.left + b.right) / 2 + dx + extraX, y: b.bottom + sh + dy + extraY};
            case 'left':
                return {x: b.left + dx + extraX, y: (b.top + b.bottom) / 2 + dy + extraY};
            case 'right':
                return {x: b.right + sw + dx + extraX, y: (b.top + b.bottom) / 2 + dy + extraY};
        }
    }

    if (isFretboardScoreType(opts.notationType)) {
        return {x: cx + dx + extraX, y: noteHead.y + dy + extraY};
    }

    return {x: cx + dx + extraX, y: cy + dy + extraY};
}

/**
 * 简谱双音符附属：两端需同水平时，按 numberNotationAnchor 对齐基准边
 * （先去掉各自 relative y，对齐后再加回）。
 * - top → 取更高一侧（y 更小）
 * - bottom → 取更低一侧（y 更大）
 * 跨单谱表分段（split）时不对齐。
 */
function levelNumberNotationDoubleAnchors(
    startPt: {x: number; y: number},
    endPt: {x: number; y: number},
    opts: {
        notationType?: MusicScoreTypeEnum;
        numberNotationAnchor?: NumberNotationAnchor;
        relStartY?: number;
        relEndY?: number;
        skip?: boolean;
    },
): void {
    if (opts.skip) return;
    if (opts.notationType !== MusicScoreTypeEnum.NumberNotation) return;
    const anchor = opts.numberNotationAnchor;
    if (anchor !== 'top' && anchor !== 'bottom') return;
    const rs = opts.relStartY ?? 0;
    const re = opts.relEndY ?? 0;
    const startBase = startPt.y - rs;
    const endBase = endPt.y - re;
    const baseY = anchor === 'top' ? Math.min(startBase, endBase) : Math.max(startBase, endBase);
    startPt.y = baseY + rs;
    endPt.y = baseY + re;
}

function locateSlot(
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
    slotId: string,
): LocatedSlot | null {
    if (ctx.slotIndex) return ctx.slotIndex.get(slotId) ?? null;
    for (const gs of musicScore.grandStaffs) {
        for (const staff of gs.staves) {
            for (const measure of staff.measures) {
                const slot = getMeasureSlots(measure).find((n) => n.id === slotId);
                if (slot) return {measure, slot};
            }
        }
    }
    return null;
}

/** slot id → 所在小节 + slot（全局附属按 id 定位 slot 用） */
export function buildSlotIndex(grandStaffs: readonly GrandStaff[]): Map<string, LocatedSlot> {
    const index = new Map<string, LocatedSlot>();
    for (const gs of grandStaffs) {
        for (const staff of gs.staves) {
            for (const measure of staff.measures) {
                for (const slot of getMeasureSlots(measure)) index.set(slot.id, {measure, slot});
            }
        }
    }
    return index;
}

/** 列内可视锚点：符头 / 简谱数字 / tab 数字 / 休止符 */
function resolveSlotHeadVDoms(ctx: RenderAffiliatedContext, slot: MeasureNoteSlot): VDom[] {
    const heads: VDom[] = [];
    const sym = slot.symbol;
    if ('notesInfo' in sym && Array.isArray(sym.notesInfo)) {
        for (const info of sym.notesInfo) {
            const head = resolveNoteHeadByNotesInfoId(ctx.idMap, info.id);
            if (head) heads.push(head);
        }
    }
    if (!heads.length) {
        const self = resolveNoteHeadByNotesInfoId(ctx.idMap, sym.id);
        if (self) heads.push(self);
    }
    return heads;
}

/** slot 列起点 x（符头左缘最小值） */
function slotStartX(heads: VDom[]): number {
    return Math.min(...heads.map((h) => h.x));
}

export type LocatedSlot = { measure: Measure; slot: MeasureNoteSlot };

/** slot 附属锚在所属小节上，不随符头 y 变化；仅当小节节点缺失时才按符头几何命中 */
function resolveSlotMeasureVDom(ctx: RenderAffiliatedContext, located: LocatedSlot, head: VDom): VDom | undefined {
    return ctx.idMap.get(located.measure.id)?.measure ?? resolveMeasureVDomForNote(ctx.idMap, head);
}

/**
 * 单 / 双 slot 共用列锚点：x = slot 列起点 + horizontal，y = 小节底 + vertical，再加相对偏移。
 */
function resolveSlotColumnAnchor(
    ctx: RenderAffiliatedContext,
    located: LocatedSlot,
    rule: AffiliatedOffsetRule,
    rel: { x: number; y: number },
): { x: number; y: number } | null {
    const heads = resolveSlotHeadVDoms(ctx, located.slot);
    if (!heads.length) return null;
    const measureHeight = resolveMeasureHeight(ctx, heads[0]!);
    const {dx, dy} = offsetPx(rule, measureHeight);
    const measure = resolveSlotMeasureVDom(ctx, located, heads[0]!);
    const baseY = measure ? measure.y + measure.h : heads[0]!.y + heads[0]!.h;
    return {
        x: slotStartX(heads) + dx + rel.x,
        y: baseY + dy + rel.y,
    };
}

/**
 * 双 slot 默认锚点：x = slot 列起点 + horizontal，y = 小节底 + vertical。
 */
function resolveDoubleSlotAnchor(
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
    slotId: string,
    rule: AffiliatedOffsetRule,
    rel: { x: number; y: number },
): { x: number; y: number } | null {
    const located = locateSlot(ctx, musicScore, slotId);
    return located ? resolveSlotColumnAnchor(ctx, located, rule, rel) : null;
}

type IndexedNote = {id: string; direction?: 'up' | 'down'};

/**
 * 音符（含倚音）/ 休止符 id → 所在单谱表 id + 符干方向；曲谱会被原地修改，每次渲染现建。
 * 符干方向：五线谱看 NotesInfo.direction；鼓谱（上下声部）看所在声部；其余无方向字段视为向下。
 */
export function buildNoteIndex(grandStaffs: readonly GrandStaff[]): NoteIndex {
    const staffOf = new Map<string, string>();
    const stemUp = new Set<string>();
    const add = (note: IndexedNote, staffId: string, voiceUp: boolean) => {
        staffOf.set(note.id, staffId);
        if (note.direction ? note.direction === 'up' : voiceUp) stemUp.add(note.id);
    };
    for (const gs of grandStaffs) {
        for (const staff of gs.staves) {
            for (const measure of staff.measures) {
                const voices = isMeasureNoteVoices(measure.notes) ? measure.notes : null;
                for (const slot of getMeasureSlots(measure)) {
                    const voiceUp = voices != null && (voices.up ?? []).includes(slot);
                    const sym = slot.symbol;
                    staffOf.set(sym.id, staff.id);
                    if (!('notesInfo' in sym) || !Array.isArray(sym.notesInfo)) continue;
                    const {graceNotes, graceNotesAfter} = sym as {graceNotes?: IndexedNote[]; graceNotesAfter?: IndexedNote[]};
                    for (const n of [...(sym.notesInfo as IndexedNote[]), ...(graceNotes ?? []), ...(graceNotesAfter ?? [])]) {
                        add(n, staff.id, voiceUp);
                    }
                }
            }
        }
    }
    return {staffOf, stemUp};
}

function noteIndexOf(ctx: RenderAffiliatedContext): NoteIndex | null {
    if (!ctx.musicScore) return null;
    ctx.noteIndex ??= buildNoteIndex(ctx.musicScore.grandStaffs);
    return ctx.noteIndex;
}

function isCrossSingleStaff(ctx: RenderAffiliatedContext, startId: string, endId: string): boolean {
    const index = noteIndexOf(ctx);
    if (!index) return false;
    const a = index.staffOf.get(startId);
    const b = index.staffOf.get(endId);
    return a != null && b != null && a !== b;
}

/** 连音线朝向：起止符干都向上 → 向下翻（画在符头下方），否则向上 */
function resolveSlurDirection(ctx: RenderAffiliatedContext, startId: string, endId: string): 'up' | 'down' {
    const index = noteIndexOf(ctx);
    if (!index) return 'up';
    return index.stemUp.has(startId) && index.stemUp.has(endId) ? 'down' : 'up';
}

function renderSlur(
    sym: DoubleNoteAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    rule = DoubleNoteAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'slur') return;
    const startNote = resolveNoteHeadByNotesInfoId(ctx.idMap, sym.startId);
    const endNote = resolveNoteHeadByNotesInfoId(ctx.idMap, sym.endId);
    if (!startNote || !endNote) return;
    const measureHeight = resolveMeasureHeight(ctx, startNote);
    const slurData = sym.data?.slur;
    const relStart = slurData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = slurData?.relativeEndPoint ?? {x: 0, y: 0};
    const startPt = noteAnchorPoint(startNote, {
        rule: rule.start,
        measureHeight,
        notationType: ctx.notationType,
        extraX: relStart.x,
        extraY: relStart.y,
        numberNotationAnchor: rule.numberNotationAnchor,
    });
    const endPt = noteAnchorPoint(endNote, {
        rule: rule.end,
        measureHeight,
        notationType: ctx.notationType,
        extraX: relEnd.x,
        extraY: relEnd.y,
        numberNotationAnchor: rule.numberNotationAnchor,
    });
    // 起止不在同一单谱表（换行等）：同一个 vDom 由 slur.vue 画成两段，targetId 仍唯一
    const split = isCrossSingleStaff(ctx, sym.startId, sym.endId);
    levelNumberNotationDoubleAnchors(startPt, endPt, {
        notationType: ctx.notationType,
        numberNotationAnchor: rule.numberNotationAnchor,
        relStartY: relStart.y,
        relEndY: relEnd.y,
        skip: split,
    });
    const direction = resolveSlurDirection(ctx, sym.startId, sym.endId);
    const defaultSlur = {
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 0, y: 0},
        thickness: 2,
    };
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: slurSkinKey(ctx.notationType),
        dataComment: '连音线',
        special: {
            slur: {
                ...(slurData ? JSON.parse(JSON.stringify(slurData)) : defaultSlur),
                direction,
                ...(split ? {split: true, splitGap: measureHeight * 0.6} : {}),
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

/**
 * 单 slot 琶音：默认锚点 x=slot 列起点、y=小节底（与踏板等同）；
 * 起止同锚点，跨度由 relativeStart/End（px）决定；
 * 缺省 relativeEnd.y = -measure.h，使 |Δy| 正好等于小节高度、垂直穿过整节。
 */
function renderSlotArpeggio(
    sym: SingleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    located: LocatedSlot,
    rule = SingleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'arpeggio') return;
    const heads = resolveSlotHeadVDoms(ctx, located.slot);
    if (heads.length < 1) return;
    const measure = resolveSlotMeasureVDom(ctx, located, heads[0]!);
    const measureHeight = resolveMeasureHeight(ctx, heads[0]!);
    const spanY = measure?.h ?? measureHeight;
    const arpData = sym.data?.arpeggio;
    const relStart = arpData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = arpData?.relativeEndPoint ?? {x: 0, y: -spanY};
    const startPt = resolveSlotColumnAnchor(ctx, located, rule.offset, relStart);
    const endPt = resolveSlotColumnAnchor(ctx, located, rule.offset, relEnd);
    if (!startPt || !endPt) return;
    const type =
        arpData?.type
        ?? (sym.name === SingleSlotAffiliatedSymbolNameEnum.arpeggio_straight
            ? ArpeggioTypeEnum.Staright
            : ArpeggioTypeEnum.Normal);
    const straight = type === ArpeggioTypeEnum.Staright;
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: arpeggioSkinKey(ctx.notationType, straight),
        dataComment: straight ? '直线琶音' : '琶音',
        special: {
            arpeggio: {
                thickness: 1.5,
                arrowWidth: 8,
                arrow: arpData?.arrow !== false,
                type,
                relativeStartPoint: {...relStart},
                relativeEndPoint: {...relEnd},
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderSlotStrumming(
    sym: SingleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    located: LocatedSlot,
    rule = SingleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'strumming') return;
    const heads = resolveSlotHeadVDoms(ctx, located.slot);
    if (heads.length < 1) return;
    const measure = resolveSlotMeasureVDom(ctx, located, heads[0]!);
    const measureHeight = resolveMeasureHeight(ctx, heads[0]!);
    const spanY = measure?.h ?? measureHeight;
    const strumData = sym.data?.strumming;
    const relStart = strumData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = strumData?.relativeEndPoint ?? {x: 0, y: -spanY};
    const startPt = resolveSlotColumnAnchor(ctx, located, rule.offset, relStart);
    const endPt = resolveSlotColumnAnchor(ctx, located, rule.offset, relEnd);
    if (!startPt || !endPt) return;
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: strummingSkinKey(ctx.notationType),
        dataComment: '扫弦',
        special: {
            strumming: {
                thickness: 1.5,
                arrowWidth: 8,
                arrow: strumData?.arrow !== false,
                relativeStartPoint: {...relStart},
                relativeEndPoint: {...relEnd},
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderSlotPedal(
    sym: DoubleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
    rule = DoubleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'pedal') return;
    const pedalData = sym.data?.pedal;
    const relStart = pedalData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = pedalData?.relativeEndPoint ?? {x: 0, y: 0};
    const startPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.startId, rule.start, relStart);
    const endPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.endId, rule.end, relEnd);
    if (!startPt || !endPt) return;
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: pedalSkinKey(ctx.notationType),
        dataComment: '踏板',
        special: {
            pedal: {
                thickness: 1.5,
                type: pedalData?.type ?? PedalTypeEnum.Normal,
                relativeStartPoint: {...relStart},
                relativeEndPoint: {...relEnd},
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderSlotPitch(
    sym: DoubleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
    rule = DoubleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'pitch') return;
    const pitchData = sym.data?.pitch;
    const relStart = pitchData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = pitchData?.relativeEndPoint ?? {x: 0, y: 0};
    const startPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.startId, rule.start, relStart);
    const endPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.endId, rule.end, relEnd);
    if (!startPt || !endPt) return;
    const direction = sym.name === DoubleSlotAffiliatedSymbolNameEnum.Pitch_up ? 'up' : 'down';
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: pitchSkinKey(ctx.notationType),
        dataComment: direction === 'up' ? '升八度记号' : '降八度记号',
        special: {
            pitch: {
                thickness: 1.5,
                type: pitchData?.type ?? PitchTypeEnum['8va'],
                direction,
                relativeStartPoint: {...relStart},
                relativeEndPoint: {...relEnd},
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderSlotTrill(
    sym: DoubleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
    rule = DoubleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'trill') return;
    const trillData = sym.data?.trill;
    const relStart = trillData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = trillData?.relativeEndPoint ?? {x: 0, y: 0};
    const startPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.startId, rule.start, relStart);
    const endPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.endId, rule.end, relEnd);
    if (!startPt || !endPt) return;
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: pedalSkinKey(ctx.notationType),
        dataComment: '颤音线',
        special: {
            trill: {
                type: trillData?.type ?? TrillTypeEnum.Trill,
                relativeStartPoint: {...relStart},
                relativeEndPoint: {...relEnd},
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderSlotHairpin(
    sym: DoubleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
    rule = DoubleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'hairpin') return;
    const hairpinData = sym.data?.hairpin;
    const relStart = hairpinData?.relativeStartPoint ?? {x: 0, y: 0};
    const relEnd = hairpinData?.relativeEndPoint ?? {x: 0, y: 0};
    const startPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.startId, rule.start, relStart);
    const endPt = resolveDoubleSlotAnchor(ctx, musicScore, sym.endId, rule.end, relEnd);
    if (!startPt || !endPt) return;
    const type = hairpinData?.type ?? HairpinTypeEnum.Crescendo_hairpin;
    const crescendo = type === HairpinTypeEnum.Crescendo_hairpin || type === HairpinTypeEnum.Crescendo_line;
    const vdom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint: startPt,
        endPoint: endPt,
        targetId: sym.id,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: pedalSkinKey(ctx.notationType),
        dataComment: crescendo ? '渐强' : '渐弱',
        special: {
            hairpin: {
                thickness: 1.5,
                type,
                height: hairpinData?.height ?? 12,
                relativeStartPoint: {...relStart},
                relativeEndPoint: {...relEnd},
            },
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderVolta(
    sym: DoubleMeasureAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    rule = DoubleMeasureAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'volta') return;
    const startMeasure = ctx.idMap.get(sym.startId)?.measure;
    const endMeasure = ctx.idMap.get(sym.endId)?.measure ?? startMeasure;
    if (!startMeasure) return;
    const measureH = startMeasure.h;
    const startX = startMeasure.x + rule.start.horizontal * measureH;
    const endX = (endMeasure?.x ?? startMeasure.x) + (endMeasure?.w ?? startMeasure.w)
        + rule.end.horizontal * measureH;
    const voltaData = sym.data?.volta;
    const relX = voltaData?.relativeX ?? 0;
    const relY = voltaData?.relativeY ?? 0;
    const relW = voltaData?.relativeW ?? 0;
    const relH = voltaData?.relativeH ?? 0;
    const baseW = Math.max(endX - startX, startMeasure.w);
    const heightRatio = voltaData?.heightRatio ?? 0.5;
    const baseH = measureH * heightRatio;
    const spanPx = rule.span * measureH;
    const baseY = rule.type === 'upper'
        ? startMeasure.y - baseH - spanPx
        : startMeasure.y + startMeasure.h + spanPx;
    const vdom: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {volta: voltaData ?? {}},
        x: startX + relX,
        y: baseY + relY,
        w: baseW + relW,
        h: baseH + relH,
        zIndex: VOLTA_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        skinKey: voltaSkinKey(ctx.notationType),
        targetId: sym.id,
        dataComment: '反复房子',
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}

function renderDoubleNoteSkin(
    sym: DoubleNoteAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    rule = DoubleNoteAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'skin') return;
    const startNote = resolveNoteHeadByNotesInfoId(ctx.idMap, sym.startId);
    const endNote = resolveNoteHeadByNotesInfoId(ctx.idMap, sym.endId);
    if (!startNote || !endNote) return;
    const measureHeight = resolveMeasureHeight(ctx, startNote);
    const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
    if (!size) return;
    const start = noteAnchorPoint(startNote, {
        rule: rule.start,
        measureHeight,
        notationType: ctx.notationType,
        numberNotationAnchor: rule.numberNotationAnchor,
        symbolSize: size,
    });
    const end = noteAnchorPoint(endNote, {
        rule: rule.end,
        measureHeight,
        notationType: ctx.notationType,
        numberNotationAnchor: rule.numberNotationAnchor,
        symbolSize: size,
    });
    levelNumberNotationDoubleAnchors(start, end, {
        notationType: ctx.notationType,
        numberNotationAnchor: rule.numberNotationAnchor,
        skip: isCrossSingleStaff(ctx, sym.startId, sym.endId),
    });
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    pushSkinAffiliated(
        ctx,
        sym.id,
        rule.skinKey ?? String(sym.name),
        cx - size.w / 2,
        cy - size.h / 2,
        size.w,
        size.h,
        String(sym.name),
    );
}

function renderDoubleNoteAffiliated(sym: DoubleNoteAffiliatedSymbol, ctx: RenderAffiliatedContext): void {
    const rule = DoubleNoteAffiliatedSymbolRenderRule[sym.name];
    if (!rule) return;
    if (rule.kind === 'slur') {
        renderSlur(sym, ctx, rule);
        return;
    }
    if (rule.kind === 'skin') {
        renderDoubleNoteSkin(sym, ctx, rule);
    }
}

/**
 * 单 slot 皮肤类：锚点 = slot 列起点 + offset（× measureHeight），y=小节底 + vertical；
 * 符号中心对齐锚点（与单音符 skin 一致）。
 */
function renderSlotSkin(
    sym: SingleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    located: LocatedSlot,
    rule = SingleSlotAffiliatedSymbolRenderRule[sym.name],
): void {
    if (rule?.kind !== 'skin') return;
    const heads = resolveSlotHeadVDoms(ctx, located.slot);
    if (!heads.length) return;
    const measureHeight = resolveMeasureHeight(ctx, heads[0]!);
    const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
    if (!size) return;
    const anchor = resolveSlotColumnAnchor(ctx, located, rule.offset, {x: 0, y: 0});
    if (!anchor) return;
    pushSkinAffiliated(
        ctx,
        sym.id,
        rule.skinKey ?? String(sym.name),
        anchor.x - size.w / 2,
        anchor.y - size.h / 2,
        size.w,
        size.h,
        String(sym.name),
    );
}

function renderSingleSlotAffiliated(
    sym: SingleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    located: LocatedSlot,
): void {
    const rule = SingleSlotAffiliatedSymbolRenderRule[sym.name];
    if (!rule) return;
    if (rule.kind === 'arpeggio') {
        renderSlotArpeggio(sym, ctx, located, rule);
        return;
    }
    if (rule.kind === 'strumming') {
        renderSlotStrumming(sym, ctx, located, rule);
        return;
    }
    if (rule.kind === 'skin') {
        renderSlotSkin(sym, ctx, located, rule);
    }
}

function renderDoubleSlotAffiliated(
    sym: DoubleSlotAffiliatedSymbol,
    ctx: RenderAffiliatedContext,
    musicScore: MusicScore,
): void {
    const rule = DoubleSlotAffiliatedSymbolRenderRule[sym.name];
    if (!rule) return;
    if (rule.kind === 'pedal') {
        renderSlotPedal(sym, ctx, musicScore, rule);
        return;
    }
    if (rule.kind === 'pitch') {
        renderSlotPitch(sym, ctx, musicScore, rule);
        return;
    }
    if (rule.kind === 'trill') {
        renderSlotTrill(sym, ctx, musicScore, rule);
        return;
    }
    if (rule.kind === 'hairpin') {
        renderSlotHairpin(sym, ctx, musicScore, rule);
    }
}

function renderDoubleMeasureAffiliated(sym: DoubleMeasureAffiliatedSymbol, ctx: RenderAffiliatedContext): void {
    const rule = DoubleMeasureAffiliatedSymbolRenderRule[sym.name];
    if (!rule) return;
    if (rule.kind === 'volta') {
        renderVolta(sym, ctx, rule);
    }
}

/** musicScore.affiliatedSymbols（双音符 / 双小节 / 双 slot）+ 各 slot.affiliatedSymbols（单 slot） */
export function renderMusicScoreAffiliatedSymbols(musicScore: MusicScore, ctx: RenderAffiliatedContext): void {
    renderScoreLevelAffiliatedSymbols(musicScore, ctx);
    renderSlotLevelAffiliatedSymbols(musicScore, ctx);
}

/** 只画 musicScore.affiliatedSymbols（可能跨复谱表，增量排版里放全局层） */
export function renderScoreLevelAffiliatedSymbols(musicScore: MusicScore, ctx: RenderAffiliatedContext): void {
    const fullCtx = {...ctx, musicScore};
    for (const sym of musicScore.affiliatedSymbols ?? []) {
        const measureRule = DoubleMeasureAffiliatedSymbolRenderRule[sym.name as DoubleMeasureAffiliatedSymbolNameEnum];
        if (measureRule && 'startId' in sym && ctx.idMap.get(sym.startId)?.measure) {
            renderDoubleMeasureAffiliated(sym as DoubleMeasureAffiliatedSymbol, fullCtx);
            continue;
        }
        const noteRule = DoubleNoteAffiliatedSymbolRenderRule[sym.name as DoubleNoteAffiliatedSymbolNameEnum];
        if (noteRule && 'startId' in sym && resolveNoteHeadByNotesInfoId(ctx.idMap, sym.startId)) {
            renderDoubleNoteAffiliated(sym as DoubleNoteAffiliatedSymbol, fullCtx);
            continue;
        }
        const doubleSlotRule = DoubleSlotAffiliatedSymbolRenderRule[sym.name as DoubleSlotAffiliatedSymbolNameEnum];
        if (doubleSlotRule && 'startId' in sym && locateSlot(fullCtx, musicScore, sym.startId)) {
            renderDoubleSlotAffiliated(sym as DoubleSlotAffiliatedSymbol, fullCtx, musicScore);
        }
    }
}

/** 各 slot.affiliatedSymbols（单 slot，不跨行） */
function renderSlotLevelAffiliatedSymbols(musicScore: MusicScore, ctx: RenderAffiliatedContext): void {
    const fullCtx = {...ctx, musicScore};
    for (const gs of musicScore.grandStaffs) {
        for (const staff of gs.staves) {
            for (const measure of staff.measures) {
                for (const slot of getMeasureSlots(measure)) {
                    for (const sym of slot.affiliatedSymbols ?? []) {
                        renderSingleSlotAffiliated(sym, fullCtx, {measure, slot});
                    }
                }
            }
        }
    }
}

/** 单音符附属（挂在 NotesInfo / NotesNumberInfo） */
export function renderSingleNoteAffiliatedSymbols(
    symbols: SingleNoteAffiliatedSymbol[] | undefined,
    noteHead: VDom,
    ctx: RenderAffiliatedContext,
): void {
    if (!symbols?.length) return;
    const measureHeight = resolveMeasureHeight(ctx, noteHead);
    for (const sym of symbols) {
        const rule = SingleNoteAffiliatedSymbolRenderRule[sym.name];
        if (!rule) continue;
        if (rule.kind !== 'skin') continue;
        const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
        if (!size) continue;
        const anchor = noteAnchorPoint(noteHead, {
            rule,
            measureHeight,
            notationType: ctx.notationType,
            numberNotationAnchor: rule.numberNotationAnchor,
            symbolSize: size,
        });
        pushSkinAffiliated(
            ctx,
            sym.id,
            rule.skinKey ?? String(sym.name),
            anchor.x - size.w / 2,
            anchor.y - size.h / 2,
            size.w,
            size.h,
            String(sym.name),
        );
    }
}

/** 单小节附属 measure.affiliatedSymbols */
export function renderSingleMeasureAffiliatedSymbols(
    measure: Measure,
    measureX: number,
    measureY: number,
    measureWidth: number,
    measureHeight: number,
    ctx: RenderAffiliatedContext,
): void {
    for (const sym of measure.affiliatedSymbols ?? []) {
        const rule = SingleMeasureAffiliatedSymbolRenderRule[sym.name];
        if (!rule) continue;
        const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
        if (!size) continue;
        let x: number;
        if (rule.placement === 'start') {
            x = rule.align === 'center' ? measureX - size.w / 2 : measureX;
        } else {
            x = rule.align === 'right' ? measureX + measureWidth - size.w : measureX + measureWidth - size.w;
        }
        x += rule.horizontal * measureHeight;
        const y = measureY - size.h - rule.vertical * measureHeight;
        pushSkinAffiliated(ctx, sym.id, rule.skinKey ?? String(sym.name), x, y, size.w, size.h, String(sym.name));
    }
}
