import type {SlotConfig, SlotName} from "@/types/common";

export function getSlotH(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.h ?? 0;
}

export function getSlotW(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.w ?? 0;
}
