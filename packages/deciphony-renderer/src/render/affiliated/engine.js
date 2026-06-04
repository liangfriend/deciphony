import { DoubleMeasureAffiliatedSymbolRenderRule, DoubleNoteAffiliatedSymbolRenderRule, SingleMeasureAffiliatedSymbolRenderRule, SingleNoteAffiliatedSymbolRenderRule, } from '@/constants/renderRules';
const AFFILIATED_Z = 1200;
function offsetPx(rule, measureHeight) {
    return {
        dx: rule.horizontal * measureHeight,
        dy: rule.vertical * measureHeight,
    };
}
function setNodeIdMap(map, id, tag, vdom) {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[tag] = vdom;
}
function pushSkinAffiliated(ctx, targetId, skinKey, x, y, w, h, dataComment) {
    if (!skinKey)
        return;
    const vdom = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 0 },
        special: {},
        x,
        y,
        w,
        h,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        targetId,
        skinKey: skinKey,
        dataComment,
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, targetId, 'affiliation', vdom);
}
function resolveSkinSize(skinKey, skin, notationFallbackH) {
    if (!skinKey || !skin)
        return null;
    const item = skin[skinKey];
    if (!item)
        return null;
    return { w: item.w, h: item.h || notationFallbackH };
}
function noteAnchorPoint(noteHead, rule, measureHeight, extraX = 0, extraY = 0) {
    const { dx, dy } = offsetPx(rule, measureHeight);
    return {
        x: noteHead.x + noteHead.w / 2 + dx + extraX,
        y: noteHead.y + noteHead.h / 2 + dy + extraY,
    };
}
function renderSlur(sym, ctx, rule = DoubleNoteAffiliatedSymbolRenderRule[sym.name]) {
    if (rule?.kind !== 'slur')
        return;
    const startNote = ctx.idMap.get(sym.startId)?.noteHead;
    const endNote = ctx.idMap.get(sym.endId)?.noteHead;
    if (!startNote || !endNote)
        return;
    const measureHeight = ctx.measureHeight ?? startNote.h;
    const slurData = sym.data?.slur;
    const relStart = slurData?.relativeStartPoint ?? { x: 0, y: 0 };
    const relEnd = slurData?.relativeEndPoint ?? { x: 0, y: 0 };
    const startPt = noteAnchorPoint(startNote, rule.start, measureHeight, relStart.x, relStart.y);
    const endPt = noteAnchorPoint(endNote, rule.end, measureHeight, relEnd.x, relEnd.y);
    const defaultSlur = {
        relativeStartPoint: { x: 0, y: 0 },
        relativeEndPoint: { x: 0, y: 0 },
        relativeControlPoint: { x: 0, y: 0 },
        thickness: 2,
    };
    const vdom = {
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
        dataComment: '连音线',
        special: {
            slur: slurData ? JSON.parse(JSON.stringify(slurData)) : defaultSlur,
        },
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}
function renderVolta(sym, ctx, rule = DoubleMeasureAffiliatedSymbolRenderRule[sym.name]) {
    if (rule?.kind !== 'volta')
        return;
    const startMeasure = ctx.idMap.get(sym.startId)?.measure;
    const endMeasure = ctx.idMap.get(sym.endId)?.measure ?? startMeasure;
    if (!startMeasure)
        return;
    const measureH = startMeasure.h;
    const startX = startMeasure.x + rule.start.horizontal * measureH;
    const endX = (endMeasure?.x ?? startMeasure.x) + (endMeasure?.w ?? startMeasure.w)
        + rule.end.horizontal * measureH;
    const voltaW = Math.max(endX - startX, startMeasure.w);
    const heightRatio = sym.data?.volta?.heightRatio ?? 0.5;
    const voltaH = measureH * heightRatio;
    const spanPx = rule.span * measureH;
    const voltaY = rule.type === 'upper'
        ? startMeasure.y - voltaH - spanPx
        : startMeasure.y + startMeasure.h + spanPx;
    const vdom = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 0 },
        special: { volta: sym.data?.volta ?? {} },
        x: startX,
        y: voltaY,
        w: voltaW,
        h: voltaH,
        zIndex: AFFILIATED_Z,
        tag: 'affiliation',
        skinName: ctx.skinName ?? 'default',
        targetId: sym.id,
        dataComment: '反复房子',
    };
    ctx.VDoms.push(vdom);
    setNodeIdMap(ctx.idMap, sym.id, 'affiliation', vdom);
}
function renderDoubleNoteSkin(sym, ctx, rule = DoubleNoteAffiliatedSymbolRenderRule[sym.name]) {
    if (rule?.kind !== 'skin')
        return;
    const startNote = ctx.idMap.get(sym.startId)?.noteHead;
    const endNote = ctx.idMap.get(sym.endId)?.noteHead;
    if (!startNote || !endNote)
        return;
    const measureHeight = ctx.measureHeight ?? startNote.h;
    const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
    if (!size)
        return;
    const start = noteAnchorPoint(startNote, rule.start, measureHeight);
    const end = noteAnchorPoint(endNote, rule.end, measureHeight);
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    pushSkinAffiliated(ctx, sym.id, rule.skinKey ?? String(sym.name), cx - size.w / 2, cy - size.h / 2, size.w, size.h, String(sym.name));
}
function renderDoubleNoteAffiliated(sym, ctx) {
    const rule = DoubleNoteAffiliatedSymbolRenderRule[sym.name];
    if (!rule)
        return;
    if (rule.kind === 'slur') {
        renderSlur(sym, ctx, rule);
        return;
    }
    if (rule.kind === 'skin') {
        renderDoubleNoteSkin(sym, ctx, rule);
    }
}
function renderDoubleMeasureAffiliated(sym, ctx) {
    const rule = DoubleMeasureAffiliatedSymbolRenderRule[sym.name];
    if (!rule)
        return;
    if (rule.kind === 'volta') {
        renderVolta(sym, ctx, rule);
    }
}
/** musicScore.affiliatedSymbols：双音符 / 双小节 */
export function renderMusicScoreAffiliatedSymbols(musicScore, ctx) {
    for (const sym of musicScore.affiliatedSymbols ?? []) {
        const measureRule = DoubleMeasureAffiliatedSymbolRenderRule[sym.name];
        if (measureRule && ctx.idMap.get(sym.startId)?.measure) {
            renderDoubleMeasureAffiliated(sym, ctx);
            continue;
        }
        const noteRule = DoubleNoteAffiliatedSymbolRenderRule[sym.name];
        if (noteRule && ctx.idMap.get(sym.startId)?.noteHead) {
            renderDoubleNoteAffiliated(sym, ctx);
        }
    }
}
/** 单音符附属：在音符头渲染完成后调用 */
export function renderSingleNoteAffiliatedSymbols(symbols, noteHead, ctx) {
    if (!symbols?.length)
        return;
    const measureHeight = ctx.measureHeight ?? noteHead.h;
    for (const sym of symbols) {
        const rule = SingleNoteAffiliatedSymbolRenderRule[sym.name];
        if (!rule)
            continue;
        if (rule.kind !== 'skin')
            continue;
        const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
        if (!size)
            continue;
        const anchor = noteAnchorPoint(noteHead, rule, measureHeight);
        pushSkinAffiliated(ctx, sym.id, rule.skinKey ?? String(sym.name), anchor.x - size.w / 2, anchor.y - size.h / 2, size.w, size.h, String(sym.name));
    }
}
/** 单小节附属：measure.affiliatedSymbols */
export function renderSingleMeasureAffiliatedSymbols(measure, measureX, measureY, measureWidth, measureHeight, ctx) {
    for (const sym of measure.affiliatedSymbols ?? []) {
        const rule = SingleMeasureAffiliatedSymbolRenderRule[sym.name];
        if (!rule)
            continue;
        const size = resolveSkinSize(rule.skinKey ?? String(sym.name), ctx.skin, measureHeight);
        if (!size)
            continue;
        let x;
        if (rule.placement === 'start') {
            x = rule.align === 'center' ? measureX - size.w / 2 : measureX;
        }
        else {
            x = rule.align === 'right' ? measureX + measureWidth - size.w : measureX + measureWidth - size.w;
        }
        x += rule.horizontal * measureHeight;
        const y = measureY - size.h - rule.vertical * measureHeight;
        pushSkinAffiliated(ctx, sym.id, rule.skinKey ?? String(sym.name), x, y, size.w, size.h, String(sym.name));
    }
}
