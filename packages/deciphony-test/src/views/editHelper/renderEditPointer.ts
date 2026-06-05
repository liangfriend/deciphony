/** 从指针/点击事件解析根 svg 与符号 wrapper 元素 */

export function resolveSvgFromEvent(event: PointerEvent | MouseEvent): SVGSVGElement | null {
  return (event.target as Element | null)?.closest('svg') ?? null
}

export function resolveInteractionTarget(event: MouseEvent | PointerEvent): SVGElement | null {
  const target = event.currentTarget
  return target instanceof SVGElement ? target : null
}
