import {strFromU8, strToU8, unzip, zip} from 'fflate'
import type {AssetMap, AssetRecord, SJW} from '../types/types'
import {basename} from './usage'

export const WORK_JSON = 'work.json'

function toU8(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data)
}

function unzipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(data, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

function zipAsync(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(files, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

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
  if (lower.endsWith('.json')) return 'application/json'
  return 'application/octet-stream'
}

/**
 * 解析 .sjw（zip）→ work.json + 资源映射表。
 * zip 内文件名为资源 id；自定义名称来自 work.json.assetNames。
 */
export async function parseSjw(
  input: Blob | ArrayBuffer | Uint8Array,
): Promise<{data: SJW; assets: AssetMap}> {
  const buf =
    input instanceof Uint8Array
      ? input
      : input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : toU8(await input.arrayBuffer())

  const entries = await unzipAsync(buf)
  let data: SJW | null = null
  const pendingFiles = new Map<string, Uint8Array>()

  for (const [path, bytes] of Object.entries(entries)) {
    if (!bytes?.length && path.endsWith('/')) continue
    const name = basename(path)
    if (!name) continue
    if (name === WORK_JSON) {
      data = JSON.parse(strFromU8(bytes)) as SJW
      continue
    }
    pendingFiles.set(name, bytes)
  }

  if (!data) {
    throw new Error(`sjw 缺少 ${WORK_JSON}`)
  }

  const assetNames = data.assetNames ?? {}
  const assets: AssetMap = new Map()
  for (const [id, bytes] of pendingFiles) {
    const displayName = assetNames[id] || id
    const file = new File([new Uint8Array(bytes)], displayName, {type: guessMime(displayName)})
    const rec: AssetRecord = {id, name: displayName, file}
    assets.set(id, rec)
  }

  return {data, assets}
}

/**
 * 将 SJW + 资源映射打包为 zip。
 * 写入前会把 assetNames 同步进 data。
 */
export async function buildSjwBlob(data: SJW, assets: AssetMap): Promise<Blob> {
  const assetNames: Record<string, string> = {...(data.assetNames ?? {})}
  for (const [id, rec] of assets) {
    assetNames[id] = rec.name
  }
  const payload: SJW = {...data, assetNames}

  const files: Record<string, Uint8Array> = {
    [WORK_JSON]: strToU8(JSON.stringify(payload)),
  }

  for (const [id, rec] of assets) {
    const key = basename(id)
    if (!key || key === WORK_JSON) continue
    files[key] = toU8(await rec.file.arrayBuffer())
  }

  const zipped = await zipAsync(files)
  const copy = new Uint8Array(zipped.byteLength)
  copy.set(zipped)
  return new Blob([copy], {type: 'application/octet-stream'})
}

/** 触发浏览器下载 .sjw */
export function downloadSjw(blob: Blob, filename = 'courseware.sjw') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.sjw') ? filename : `${filename}.sjw`
  a.click()
  URL.revokeObjectURL(url)
}
