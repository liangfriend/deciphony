import {ref} from 'vue'
import type {AssetMap, AssetRecord, RemoveAssetOptions, SJW} from '../types/types'
import {basename, clearAssetUsages, findAssetUsages, isAssetUsed, isRemoteSrc} from './usage'

function guessMime(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.ogg')) return 'audio/ogg'
  return 'application/octet-stream'
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i) : ''
}

/** 生成缓存 id：`21546134543.png`（扩展名取自自定义名或 File） */
export function createAssetId(file: File, displayName: string): string {
  const ext = extOf(displayName) || extOf(file.name) || ''
  return `${Date.now()}${Math.floor(Math.random() * 1e8)}${ext}`
}

/** @deprecated 使用 createAssetId */
export function createAssetFilename(file: File, preferredName?: string): string {
  const display = preferredName ? basename(preferredName) : file.name
  return createAssetId(file, display || file.name)
}

function normalizeDisplayName(file: File, name?: string): string {
  const raw = (name?.trim() || file.name || 'asset').trim()
  const base = basename(raw)
  if (!base || base === 'work.json') {
    throw new Error('资源必须有有效的自定义名称')
  }
  return base
}

/**
 * SJWPDF 内资源缓存：id → { id, name, file }，并维护 objectURL。
 */
export function createAssetStore() {
  const files: AssetMap = new Map()
  const objectUrls = new Map<string, string>()
  const version = ref(0)

  function bump() {
    version.value++
  }

  function revoke(id: string) {
    const url = objectUrls.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      objectUrls.delete(id)
    }
  }

  function clearObjectUrls() {
    for (const url of objectUrls.values()) URL.revokeObjectURL(url)
    objectUrls.clear()
  }

  function getMap(): AssetMap {
    return files
  }

  /** 导出到 work.json 的 id → 自定义名称 */
  function getAssetNames(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [id, rec] of files) out[id] = rec.name
    return out
  }

  function listAssets(): AssetRecord[] {
    return [...files.values()]
  }

  function listAssetIds(): string[] {
    return [...files.keys()]
  }

  function hasAsset(id: string): boolean {
    return files.has(basename(id))
  }

  function getAssetRecord(id: string): AssetRecord | undefined {
    return files.get(basename(id))
  }

  function getAsset(id: string): File | undefined {
    return files.get(basename(id))?.file
  }

  function getAssetName(id: string): string | undefined {
    return files.get(basename(id))?.name
  }

  /**
   * 整表替换（如 loadSjw）。
   * 可传 AssetMap，或旧式 `Record<id, File>`（名称用 File.name / assetNames）。
   */
  function loadAssetMap(
    map: AssetMap | Record<string, File> | Record<string, AssetRecord>,
    assetNames?: Record<string, string>,
  ) {
    clearObjectUrls()
    files.clear()
    const entries = map instanceof Map ? map.entries() : Object.entries(map)
    for (const [key, value] of entries) {
      const id = basename(key)
      if (!id || id === 'work.json') continue
      if (value && typeof value === 'object' && 'file' in value && 'name' in value) {
        const rec = value as AssetRecord
        files.set(id, {
          id,
          name: rec.name || assetNames?.[id] || id,
          file: rec.file,
        })
      } else {
        const file = value as File
        const name = assetNames?.[id] || file.name || id
        files.set(id, {id, name, file})
      }
    }
    bump()
  }

  /**
   * 原始载入：写入缓存，生成 id，并绑定自定义名称。
   * @param name 用户定义名称；省略则用 file.name
   * @returns 缓存记录（含 id）
   */
  function loadAsset(file: File, name?: string): AssetRecord {
    const displayName = normalizeDisplayName(file, name)
    let id = createAssetId(file, displayName)
    while (files.has(id)) {
      id = createAssetId(file, displayName)
    }
    const typed =
      file.type && file.type !== 'application/octet-stream'
        ? file
        : new File([file], displayName, {type: guessMime(displayName)})
    const record: AssetRecord = {id, name: displayName, file: typed}
    revoke(id)
    files.set(id, record)
    bump()
    return record
  }

  /** @deprecated 使用 loadAsset；返回 id 以兼容旧调用 */
  function addAsset(file: File, name?: string): string {
    return loadAsset(file, name).id
  }

  function removeAsset(
    id: string,
    data: SJW,
    options: RemoveAssetOptions = {},
  ): boolean {
    const key = basename(id)
    if (!files.has(key)) return false
    const used = isAssetUsed(data, key)
    if (used && !options.removeUsages) return false
    if (options.removeUsages) clearAssetUsages(data, key)
    revoke(key)
    files.delete(key)
    if (data.assetNames) delete data.assetNames[key]
    bump()
    return true
  }

  function clear() {
    clearObjectUrls()
    files.clear()
    bump()
  }

  /**
   * 将 src 解析为可展示地址。
   * http(s) / data: 原样；资源 id 查缓存 → objectURL；未命中返回空串。
   */
  function resolveSrc(src: string): string {
    void version.value
    const s = src?.trim() ?? ''
    if (!s) return ''
    if (isRemoteSrc(s) || /^data:/i.test(s)) return s
    const id = basename(s)
    const cached = objectUrls.get(id)
    if (cached) return cached
    const rec = files.get(id)
    if (!rec) return ''
    const url = URL.createObjectURL(rec.file)
    objectUrls.set(id, url)
    return url
  }

  /** 把当前缓存名称写回 sjw.assetNames */
  function syncAssetNamesToData(data: SJW) {
    data.assetNames = getAssetNames()
  }

  return {
    version,
    getMap,
    getAssetNames,
    listAssets,
    listAssetIds,
    hasAsset,
    getAsset,
    getAssetRecord,
    getAssetName,
    loadAssetMap,
    loadAsset,
    addAsset,
    removeAsset,
    clear,
    resolveSrc,
    syncAssetNamesToData,
    findUsages: (data: SJW, id: string) => findAssetUsages(data, basename(id)),
    isUsed: (data: SJW, id: string) => isAssetUsed(data, basename(id)),
  }
}

export type AssetStore = ReturnType<typeof createAssetStore>
