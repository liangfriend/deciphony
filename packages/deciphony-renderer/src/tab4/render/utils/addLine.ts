/** 加线 VDom 布局：横线画在皮肤垂直中心，与 center 缩放配合 */
export function addLineBoxAt(lineY: number, centerX: number, skin: { w: number; h: number }): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  return {
    x: centerX - skin.w / 2,
    y: lineY - skin.h / 2,
    w: skin.w,
    h: skin.h,
  };
}
