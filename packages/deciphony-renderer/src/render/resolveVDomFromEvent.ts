import type {VDom} from '@/types/common';
import type {VDomLookup} from '@/render/vdomIndex';

/** 从指针/点击事件命中 DOM 向上查找带 data-target-id 的元素 */
export function getHitElement(event: Event): Element | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return (
    target.closest('[data-target-id][data-tag]') ??
    target.closest('[data-target-id]')
  );
}

const PREFER_TAGS = [
  'slot',
  'measure',
  'singleStaff',
  'grandStaff',
  'noteHead',
  'noteNumber',
  'tabNoteNumber',
  'rest',
  'affiliation',
];

/**
 * 将顶层 SVG 上的事件解析为 VDom（与 dr-* 逐节点绑定互补）。
 * 优先 targetId + data-tag 精确匹配；无 tag 时按 targetId 回退（插槽父 g 等）。
 * vDoms 传索引（musicScore expose 的 getVDomLookup / renderMusicScore 的 info.lookup）时为 O(1)。
 */
export function resolveVDomFromEvent(event: Event, vDoms: readonly VDom[] | VDomLookup): VDom | null {
  const el = getHitElement(event);
  if (!el) return null;

  const targetId = el.getAttribute('data-target-id');
  if (!targetId) return null;

  const candidates = Array.isArray(vDoms)
    ? (vDoms as readonly VDom[]).filter((n) => n.targetId === targetId)
    : (vDoms as VDomLookup).byTargetId(targetId);
  if (candidates.length === 0) return null;

  const tag = el.getAttribute('data-tag');
  if (tag) {
    const exact = candidates.find((n) => n.tag === tag);
    if (exact) return exact;
  }
  if (candidates.length === 1) return candidates[0]!;

  for (const t of PREFER_TAGS) {
    const hit = candidates.find((n) => n.tag === t);
    if (hit) return hit;
  }
  return candidates[0]!;
}
