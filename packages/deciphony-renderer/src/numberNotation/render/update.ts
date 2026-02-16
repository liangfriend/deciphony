/*
 * 提供 VDom 更新方法：深拷贝当前 VDom，用户修改后返回，用于符号级皮肤切换等场景
 */

import type {VDom} from "@/types/common";

/** 深拷贝 VDom 数组（浅拷贝每个节点对象，因节点无嵌套引用） */
function deepCopyVDom(vDom: VDom[]): VDom[] {
  return vDom.map((node) => ({...node}));
}

/**
 * 更新 VDom：深拷贝后传入 updater，返回新 vDom（用于需要完整替换的场景）
 */
export function updateVDom(
  current: VDom[],
  updater: (vDom: VDom[]) => VDom[],
): VDom[] {
  const copy = deepCopyVDom(current);
  return updater(copy);
}

/**
 * 原地合并更新：只替换有变化的节点，避免整体重渲染
 * @param current 当前 VDom 数组（会被原地修改）
 * @param updater 用户操作函数，接收深拷贝后的 vDom，修改后 return
 */
export function applyVDomUpdate(
  current: VDom[],
  updater: (vDom: VDom[]) => VDom[],
): void {
  const copy = deepCopyVDom(current);
  const result = updater(copy);
  if (result.length !== current.length) {
    current.splice(0, current.length, ...result);
    return;
  }
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== current[i]) {
      current[i] = result[i];
    }
  }
}
