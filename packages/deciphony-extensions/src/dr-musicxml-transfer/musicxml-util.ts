import {XMLParser} from 'fast-xml-parser'
import {strFromU8, unzipSync} from 'fflate'
import type {MusicScore} from '@deciphony/renderer'
import {buildMusicScoreToXml, type MusicXmlExportOptions} from './musicScoreToXml'
export type {MusicXmlExportOptions} from './musicScoreToXml'
export type {MusicXmlExportTarget} from './xmlBuilder'
import {
  xmlToMusicScoreWithWarnings,
  type XmlToMusicScoreOptions,
  type XmlToMusicScoreResult,
} from './xmlToMusicScore'

// MusicXML ↔ MusicScore 转换入口；导入主体见 xmlRead.ts（读成中间结构）与 xmlToMusicScore.ts（组装曲谱）。

// preserveOrder: true → 解析结果为有序数组，子节点顺序与 XML 一致（measure 内 backup/note/attributes 顺序很重要）
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  trimValues: true,
  preserveOrder: true,
  ignoreDeclaration: true,
  ignorePiTags: true,
})

function decodeText(bytes: Uint8Array): string {
  const tryDecode = (label: string, data: Uint8Array) => {
    try {
      return new TextDecoder(label).decode(data)
    } catch {
      return new TextDecoder('utf-8').decode(data)
    }
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return tryDecode('utf-16le', bytes.subarray(2))
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return tryDecode('utf-16be', bytes.subarray(2))
  if (bytes[0] === 0x3c && bytes[1] === 0x00) return tryDecode('utf-16le', bytes)
  if (bytes[0] === 0x00 && bytes[1] === 0x3c) return tryDecode('utf-16be', bytes)
  const head = new TextDecoder('ascii').decode(bytes.subarray(0, 200))
  const encoding = head.match(/encoding\s*=\s*["']([\w-]+)["']/i)?.[1]?.toLowerCase()
  // 没有 BOM 时声明的 UTF-16 不可信（Sibelius 会写 UTF-16 却输出 UTF-8）
  if (encoding && !/^utf-?(8|16|32)/.test(encoding)) return tryDecode(encoding, bytes)
  return tryDecode('utf-8', bytes)
}

/** .musicxml / .xml / .mxl（zip）字节 → XML 文本 */
export function decodeMusicXml(bytes: Uint8Array): string {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    let zip: Record<string, Uint8Array>
    try {
      zip = unzipSync(bytes)
    } catch {
      throw new Error('无法解压 .mxl 文件')
    }
    const container = zip['META-INF/container.xml']
    let root = container ? strFromU8(container).match(/full-path\s*=\s*"([^"]+)"/)?.[1] : undefined
    if (!root || !zip[root]) {
      root = Object.keys(zip).find((k) => !k.startsWith('META-INF') && /\.(xml|musicxml)$/i.test(k))
    }
    if (!root || !zip[root]) throw new Error('.mxl 中没有找到乐谱文件')
    return decodeText(zip[root]!)
  }
  return decodeText(bytes)
}

/** 读取用户选择的 .xml / .musicxml / .mxl 文件，以 preserveOrder 结构返回 JSON */
export async function getXmlJson(file: Blob) {
  if (!file) {
    return null
  }
  const text = decodeMusicXml(new Uint8Array(await file.arrayBuffer()))
  if (!text.trimStart().startsWith('<')) {
    throw new Error('内容不是 XML 文本（应以 < 开头）。')
  }
  try {
    return xmlParser.parse(text)
  } catch (e) {
    throw new Error(`MusicXML 格式错误：${(e as Error)?.message ?? e}`)
  }
}

/** 文件 → MusicScore + 警告；标题缺省时用文件名 */
export async function musicXmlFileToMusicScore(
  file: Blob,
  options: XmlToMusicScoreOptions = {},
): Promise<XmlToMusicScoreResult> {
  const json = await getXmlJson(file)
  if (!json) throw new Error('未读取到 XML 内容')
  const result = xmlToMusicScoreWithWarnings(json, options)
  if (!result.musicScore.title && file instanceof File) {
    result.musicScore.title = file.name.replace(/\.(musicxml|xml|mxl)$/i, '')
  }
  return result
}

/**
 * musicScore → MusicXML。
 * @param options.target 默认 `'ms4'`（version 4.0）；`'ms3'` → version 3.1，给 MuseScore 3；beam 等规则不变
 */
export function musicScoreToXml(musicScore: MusicScore, options?: MusicXmlExportOptions): File {
  return buildMusicScoreToXml(musicScore, options)
}
