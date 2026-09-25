/**
 * 曲谱皮肤资源：zip 根目录存 SkinPack JSON，SScore.skin 只存资源 id。
 */
import type {Skin, SkinPack} from '@deciphony/renderer'

const SKIN_PACK_KEYS = new Set(['standardStaff', 'numberNotation', 'tab6', 'tab4'])

/** 顶层键像 SkinPack（谱种）而非 Skin（皮肤名 → 包） */
export function isSkinPack(value: unknown): value is SkinPack {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value as object)
  if (!keys.length) return true
  return keys.some((key) => SKIN_PACK_KEYS.has(key))
}

/**
 * 把宿主传入的 Skin / SkinPack 收成单套 SkinPack（写入 json 文件）。
 * Skin 多套时：优先 skinName，其次 default，再取第一套。
 */
export function resolveSkinPack(
  input: Skin | SkinPack,
  skinName?: string,
): SkinPack {
  if (isSkinPack(input)) return input
  const skin = input as Skin
  if (skinName && skin[skinName] && isSkinPack(skin[skinName])) {
    return skin[skinName]!
  }
  if (skin.default && isSkinPack(skin.default)) return skin.default
  for (const pack of Object.values(skin)) {
    if (isSkinPack(pack)) return pack
  }
  throw new Error('皮肤为空或格式无效')
}

/** SkinPack → File，供 loadAsset；扩展名固定 .json */
export function skinPackToFile(pack: SkinPack, displayName = 'skin.json'): File {
  const base = displayName.trim() || 'skin.json'
  const name = base.toLowerCase().endsWith('.json') ? base : `${base}.json`
  const blob = new Blob([JSON.stringify(pack)], {type: 'application/json'})
  return new File([blob], name, {type: 'application/json'})
}

/**
 * 从资源文件解析皮肤。
 * 兼容：文件是 SkinPack，或整份 Skin（取 default / 第一套）。
 */
export async function parseSkinFile(file: File): Promise<Skin> {
  const text = await file.text()
  const data: unknown = JSON.parse(text)
  if (isSkinPack(data)) return {default: data}
  if (data && typeof data === 'object') {
    const skin = data as Skin
    if (skin.default && isSkinPack(skin.default)) return skin
    const first = Object.values(skin).find(isSkinPack)
    if (first) return {default: first, ...skin}
  }
  throw new Error(`无法解析皮肤 JSON: ${file.name}`)
}
