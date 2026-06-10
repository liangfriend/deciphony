import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import {defaultSkin} from '@/skins/defaultSkin'
import type {Skin} from '@/types/common'

const DEFAULT_COLOR = '#000000'

/** content 为纯色值（非 SVG）的皮肤项：w/h 为 0，供 Beam / Slur / Volta 等几何组件使用 */
export function isColorOnlySkinContent(content: string): boolean {
    const trimmed = content.trim()
    return trimmed.length > 0 && !trimmed.startsWith('<')
}

/**
 * 从皮肤包解析几何符号色值。
 * skinKey 对应 SkinItem.content 为 fill/stroke 颜色字符串。
 */
export function resolveSkinColor(
    skin: Skin | undefined,
    skinName: string | undefined,
    notationType: MusicScoreTypeEnum,
    skinKey: string | undefined,
    fallback = DEFAULT_COLOR,
): string {
    if (!skinKey) return fallback

    const pack =
        (skinName && skin?.[skinName])
        || skin?.default
        || defaultSkin

    const notationPack =
        notationType === MusicScoreTypeEnum.NumberNotation
            ? pack.numberNotation
            : pack.standardStaff

    const item = notationPack?.[skinKey as keyof typeof notationPack] as { content?: string } | undefined
    if (!item?.content) return fallback

    const content = item.content.trim()
    if (!isColorOnlySkinContent(content)) return fallback
    return content
}
