import type {SlotConfig, SlotName} from "@/types/common";

export function getSlotH(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.h ?? 0;
}

export function getSlotW(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.w ?? 0;
}

export function getSlotZIndex(config: SlotConfig | undefined, name: SlotName): number {
  const cfg = config?.[name];
  if (cfg?.zIndex !== undefined) return cfg.zIndex;
  return name === 'm' ? 1100 : 1000;
}
