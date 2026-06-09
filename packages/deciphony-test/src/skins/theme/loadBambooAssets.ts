/** 加载竹林主题 SVG 资源（跳过 _active 变体） */
const modules = import.meta.glob('../../assets/skins/bamboo/*.svg', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>

export function loadBambooAssets(): Record<string, string> {
    const assets: Record<string, string> = {}
    for (const [path, raw] of Object.entries(modules)) {
        const file = path.split('/').pop() ?? ''
        const name = file.replace(/\.svg$/i, '')
        if (!name || name.endsWith('_active')) continue
        assets[name] = raw
    }
    return assets
}
