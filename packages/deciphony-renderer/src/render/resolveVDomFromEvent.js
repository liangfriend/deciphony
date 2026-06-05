/** 从指针/点击事件命中 DOM 向上查找带 data-target-id 的元素 */
export function getHitElement(event) {
    const target = event.target;
    if (!(target instanceof Element))
        return null;
    return (target.closest('[data-target-id][data-tag]') ??
        target.closest('[data-target-id]'));
}
/**
 * 将顶层 SVG 上的事件解析为 VDom（与 dr-* 逐节点绑定互补）。
 * 优先 targetId + data-tag 精确匹配；无 tag 时按 targetId 回退（插槽父 g 等）。
 */
export function resolveVDomFromEvent(event, vDoms) {
    const el = getHitElement(event);
    if (!el)
        return null;
    const targetId = el.getAttribute('data-target-id');
    if (!targetId)
        return null;
    const tag = el.getAttribute('data-tag');
    if (tag) {
        const exact = vDoms.find((n) => n.targetId === targetId && n.tag === tag);
        if (exact)
            return exact;
    }
    const candidates = vDoms.filter((n) => n.targetId === targetId);
    if (candidates.length === 0)
        return null;
    if (candidates.length === 1)
        return candidates[0];
    const prefer = ['slot', 'measure', 'singleStaff', 'grandStaff', 'noteHead', 'rest', 'affiliation'];
    for (const t of prefer) {
        const hit = candidates.find((n) => n.tag === t);
        if (hit)
            return hit;
    }
    return candidates[0];
}
