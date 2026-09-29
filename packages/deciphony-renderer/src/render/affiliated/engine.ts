import {
    DoubleMeasureAffiliatedSymbolRenderRule,
    DoubleNoteAffiliatedSymbolRenderRule,
    DoubleSlotAffiliatedSymbolRenderRule,
    type AffiliatedOffsetRule,
    SingleMeasureAffiliatedSymbolRenderRule,
    SingleNoteAffiliatedSymbolRenderRule,
    SingleSlotAffiliatedSymbolRenderRule,
} from '@/constants/renderRules';
import type {SkinKey, VDom, VDomTagType} from '@/types/common';
import type {
    DoubleMeasureAffiliatedSymbol,
    DoubleNoteAffiliatedSymbol,
    DoubleSlotAffiliatedSymbol,
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
    MusicScoreTypeEnum,
    PedalTypeEnum,
    PitchTypeEnum,
    SingleSlotAffiliatedSymbolNameEnum,
} from '@/enums/musicScoreEnum';
import {NumberNotationSkinKeyEnum} from '@/numberNotation/enums/numberNotationSkinKeyEnum';
import {StandardStaffSkinKeyEnum} from '@/standardStaff/enums/standardStaffSkinKeyEnum';
import {Tab6SkinKeyEnum} from '@/tab6/enums/tab6SkinKeyEnum';
import type {NodeIdMap} from '@/standardStaff/render/types';
import {getMeasureSlots} from '@/utils/measureNotes';

const AFFILIATED_Z = 1200;

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
};

function slurSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Slur;
    }
    if (notationType === MusicScoreTypeEnum.Tab6 || notationType === MusicScoreTypeEnum.Tab4) {
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
    if (notationType === MusicScoreTypeEnum.Tab6 || notationType === MusicScoreTypeEnum.Tab4) {
        return Tab6SkinKeyEnum.Arpeggio;
    }
    return StandardStaffSkinKeyEnum.Arpeggio;
}

function strummingSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Strumming;
    }
    if (notationType === MusicScoreTypeEnum.Tab6 || notationType === MusicScoreTypeEnum.Tab4) {
        return Tab6SkinKeyEnum.Strumming;
    }
    return StandardStaffSkinKeyEnum.Strumming;
}

function pedalSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Pedal;
    }
    if (notationType === MusicScoreTypeEnum.Tab6 || notationType === MusicScoreTypeEnum.Tab4) {
        return Tab6SkinKeyEnum.Pedal;
    }
    return StandardStaffSkinKeyEnum.Pedal;
}

function pitchSkinKey(notationType?: MusicScoreTypeEnum): SkinKey {
    // 暂用 pedal 色值皮肤键族；未单独建 pitch 皮肤时回退 pedal / slur
    if (notationType === MusicScoreTypeEnum.NumberNotation) {
        return NumberNotationSkinKeyEnum.Pedal;
    }
    if (notationType === MusicScoreTypeEnum.Tab6 || notationType === MusicScoreTypeEnum.Tab4) {
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
    let horizontalHit: VDom | undefined;
    for (const entry of map.values()) {
        const m = entry.measure;
        if (!m) continue;
        if (cx < m.x || cx > m.x + m.w) continue;
        if (cy >= m.y && cy <= m.y + m.h) return m;
        horizontalHit ??= m;
    }
    return horizontalHit;
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

/** 音符附属锚点：相对符头中心（简谱/tab 顶边） */
function noteAnchorPoint(
    noteHead: VDom,
    rule: AffiliatedOffsetRule,
    measureHeight: number,
    notationType?: MusicScoreTypeEnum,
    extraX = 0,
    extraY = 0,
) {
    const {dx, dy} = offsetPx(rule, measureHeight);
    const useTop = notationType === MusicScoreTypeEnum.NumberNotation
        || notationType === MusicScoreTypeEnum.Tab6
        || notationType === MusicScoreTypeEnum.Tab4;
    const anchorY = useTop
        ? noteHead.y + dy + extraY
        : noteHead.y + noteHead.h / 2 + dy + extraY;
    return {
        x: noteHead.x + noteHead.w / 2 + dx + extraX,
        y: anchorY,
    };
}

function locateSlot(
    musicScore: MusicScore,
    slotId: string,
): { measure: Measure; slot: MeasureNoteSlot } | null {
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

type LocatedSlot = { measure: Measure; slot: MeasureNoteSlot };

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
    const measure = resolveMeasureVDomForNote(ctx.idMap, heads[0]!)
        ?? ctx.idMap.get(located.measure.id)?.measure;
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
    const located = locateSlot(musicScore, slotId);
    return located ? resolveSlotColumnAnchor(ctx, located, rule, rel) : null;
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
    const startPt = noteAnchorPoint(
        startNote, rule.start, measureHeight, ctx.notationType, relStart.x, relStart.y,
    );
    const endPt = noteAnchorPoint(
        endNote, rule.end, measureHeight, ctx.notationType, relEnd.x, relEnd.y,
    );
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
            slur: slurData ? JSON.parse(JSON.stringify(slurData)) : defaultSlur,
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
    const measure = resolveMeasureVDomForNote(ctx.idMap, heads[0]!)
        ?? ctx.idMap.get(located.measure.id)?.measure;
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
    const measure = resolveMeasureVDomForNote(ctx.idMap, heads[0]!)
        ?? ctx.idMap.get(located.measure.id)?.measure;
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
        zIndex: AFFILIATED_Z,
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
    const start = noteAnchorPoint(startNote, rule.start, measureHeight, ctx.notationType);
    const end = noteAnchorPoint(endNote, rule.end, measureHeight, ctx.notationType);
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
        if (doubleSlotRule && 'startId' in sym && locateSlot(musicScore, sym.startId)) {
            renderDoubleSlotAffiliated(sym as DoubleSlotAffiliatedSymbol, fullCtx, musicScore);
        }
    }
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
        const anchor = noteAnchorPoint(noteHead, rule, measureHeight, ctx.notationType);
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
