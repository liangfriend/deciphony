export function getSlotH(config, name) {
    return config?.[name]?.h ?? 0;
}
export function getSlotW(config, name) {
    return config?.[name]?.w ?? 0;
}
export function getSlotZIndex(config, name) {
    const cfg = config?.[name];
    if (cfg?.zIndex !== undefined)
        return cfg.zIndex;
    return name === 'm' ? 1100 : 1000;
}
