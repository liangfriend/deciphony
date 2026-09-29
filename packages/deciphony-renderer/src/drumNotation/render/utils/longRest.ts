import type {Measure} from '@/types/MusicScoreType';
import type {LongRestRole} from '../types';

/**
 * 单谱表（一行）内连续 longRest 小节分组：单个为 complete，多个为 head → content… → tail。
 * 分组不跨单谱表，与下标对齐；非长休止符小节为 null。
 */
export function computeLongRestRoles(measures: Measure[]): (LongRestRole | null)[] {
  const roles: (LongRestRole | null)[] = new Array(measures.length).fill(null);
  let i = 0;
  while (i < measures.length) {
    if (!measures[i]?.longRest) {
      i++;
      continue;
    }
    let end = i;
    while (end + 1 < measures.length && measures[end + 1]?.longRest) end++;
    for (let k = i; k <= end; k++) {
      const kind = i === end ? 'complete' : k === i ? 'head' : k === end ? 'tail' : 'content';
      roles[k] = {kind, startIndex: i, endIndex: end};
    }
    i = end + 1;
  }
  return roles;
}

/** 前置符号（谱号 / 调号 / 拍号 / 前置小节线）是否渲染：长休止符组内仅组首保留 */
export function longRestShowsPrefix(role: LongRestRole | null | undefined): boolean {
  return !role || role.kind === 'complete' || role.kind === 'head';
}

/** 后置符号（后置小节线 / 谱号 / 调号 / 拍号）是否渲染：长休止符组内仅组尾保留 */
export function longRestShowsSuffix(role: LongRestRole | null | undefined): boolean {
  return !role || role.kind === 'complete' || role.kind === 'tail';
}
