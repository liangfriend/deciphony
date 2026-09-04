import type {SlotConfig, SlotName} from '@/types/common'

function maxDefined(a?: number, b?: number): number | undefined {
  if (a == null) return b
  if (b == null) return a
  return Math.max(a, b)
}

function mergeMaxInto(target: SlotConfig, extra: SlotConfig): void {
  for (const key of Object.keys(extra) as SlotName[]) {
    const cfg = extra[key]
    if (!cfg) continue
    const prev = target[key]
    if (!prev) {
      target[key] = {...cfg}
      continue
    }
    target[key] = {
      w: maxDefined(prev.w, cfg.w),
      h: maxDefined(prev.h, cfg.h),
      zIndex: prev.zIndex ?? cfg.zIndex,
    }
  }
}

/**
 * 先合并各扩展 slotConfig（同槽 w/h 取 max），再用页面传入的 slotConfig 覆盖字段。
 */
export function mergeSlotConfig(pluginConfigs: SlotConfig[], page?: SlotConfig): SlotConfig {
  const out: SlotConfig = {}
  for (const extra of pluginConfigs) {
    mergeMaxInto(out, extra)
  }
  if (!page) return out
  for (const key of Object.keys(page) as SlotName[]) {
    const cfg = page[key]
    if (!cfg) continue
    out[key] = {...out[key], ...cfg}
  }
  return out
}
