/**
 * 给所有连谱号皮肤（bracket / brace / square）右侧补一条竖线，样式同原 close_line。
 * 已带 data-bracket-close 的不重复添加。颜色优先取同包 close_line 的 fill，否则 black。
 * 用法：node scripts/sync-bracket-close-line.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const KEYS = ['bracket', 'brace', 'square']
const MARK = 'data-bracket-close="1"'

function closeLineFill(pack) {
  const fromClose = pack.close_line?.content?.match(/fill="([^"]+)"/)?.[1]
  if (fromClose && fromClose !== 'none' && !fromClose.startsWith('url')) return fromClose
  return 'black'
}

function withRightCloseLine(content, fill) {
  if (content.includes('data-bracket-close')) return content
  const line =
    `<rect ${MARK} x="calc(node.w - 1)" y="0" width="1" height="node.h" fill="${fill}"/>`
  return `${content.trimEnd()}\n${line}`
}

const testSkins = path.join(root, '../../deciphony-test/src/views/skins')
const files = [
  path.join(root, '../src/skins/default.json'),
  ...fs.readdirSync(testSkins).filter((f) => f.endsWith('.json')).map((f) => path.join(testSkins, f)),
]

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const packs = Object.values(data).filter((p) => p && typeof p === 'object' && KEYS.some((k) => p[k]))
  let n = 0
  for (const pack of packs) {
    const fill = closeLineFill(pack)
    for (const key of KEYS) {
      const item = pack[key]
      if (!item?.content) continue
      const next = withRightCloseLine(item.content, fill)
      if (next !== item.content) {
        item.content = next
        n++
      }
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`${path.relative(path.join(root, '../..'), file)}: ${n}`)
}
