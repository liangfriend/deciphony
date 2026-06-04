import { MeasureStartRepeatEnum } from '@/enums/musicScoreEnum';
import { getEndRepeatSkinKey, getStartRepeatSkinKey } from './repeatSkinKey';
/** 反复符号默认贴齐小节顶边上方（相对 measureHeight 的比例） */
export const REPEAT_MARK_ABOVE_RATIO = 1 / 8;
function setNodeIdMap(map, id, tag, vdom) {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[tag] = vdom;
}
function pushRepeatMark(out, params, tag, skinKey, targetId, x, y, dataComment) {
    const { skin, skinName, idMap } = params;
    const item = skin[skinKey];
    if (!item)
        return;
    const vdom = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 0 },
        special: {},
        x,
        y,
        w: item.w,
        h: item.h,
        zIndex: 1200,
        tag,
        skinName: skinName ?? 'default',
        targetId,
        skinKey: skinKey,
        dataComment,
    };
    out.push(vdom);
    setNodeIdMap(idMap, targetId, tag, vdom);
}
/** 小节前反复：符号几何中心 x = measureX */
function startRepeatX(measureX, skinW) {
    return measureX - skinW / 2;
}
/** 小节末反复：符号右缘 x+w = measureX + measureWidth */
function endRepeatX(measureX, measureWidth, skinW) {
    return measureX + measureWidth - skinW;
}
function repeatMarkY(measureY, measureHeight, skinH) {
    return measureY - skinH - REPEAT_MARK_ABOVE_RATIO * measureHeight;
}
export function renderMeasureRepeat(params) {
    const { measure, measureX, measureY, measureWidth, measureHeight, skin } = params;
    const out = [];
    if (measure.startRepeat) {
        const sr = measure.startRepeat;
        const skinKey = getStartRepeatSkinKey(sr.type);
        const item = skin[skinKey];
        if (item) {
            pushRepeatMark(out, params, 'repeat_f', skinKey, sr.id, startRepeatX(measureX, item.w), repeatMarkY(measureY, measureHeight, item.h), sr.type === MeasureStartRepeatEnum.Coda ? '反复符号 Coda' : '反复符号 Segno');
        }
    }
    if (measure.endRepeat) {
        const er = measure.endRepeat;
        const skinKey = getEndRepeatSkinKey(er.type);
        const item = skin[skinKey];
        if (item) {
            pushRepeatMark(out, params, 'repeat_b', skinKey, er.id, endRepeatX(measureX, measureWidth, item.w), repeatMarkY(measureY, measureHeight, item.h), '反复符号');
        }
    }
    return out;
}
