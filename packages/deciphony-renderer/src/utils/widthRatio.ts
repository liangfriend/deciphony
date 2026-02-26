/**
 * 解析宽度占比：优先使用数据上的值（含 0），否则使用皮肤包上的值。
 * 禁止用 truthy 判断，0 必须视为有效值。
 */
export function resolveWidthRatio(
  dataVal: number | undefined,
  skinVal: number | undefined
): number {
  if (typeof dataVal === 'number') return dataVal;
  return typeof skinVal === 'number' ? skinVal : 0;
}
