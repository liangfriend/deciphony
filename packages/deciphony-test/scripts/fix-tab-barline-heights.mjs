/**
 * 把 tab4/tab5/tab6 的小节线 / TAB 谱号高度对齐到各自 measure.h。
 * tab5 是从 tab4 拷过来的，measure 已是 5 线 h=45，但 barline 仍是 34。
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const targets = [
  path.join(here, '../../deciphony-renderer/src/skins/default.json'),
  ...['default', 'bambooForest', 'cosmos', 'dawn', 'glacier', 'moHua'].map((f) =>
    path.join(here, `../src/views/skins/${f}.json`),
  ),
]

/** 反复记号两点：相对谱表垂直居中，间距 15（与 tab4/tab6 既有皮肤一致） */
function repeatDotYs(measureH) {
  const mid = measureH / 2
  return [mid - 7.5, mid + 7.5]
}

function isBarlineKey(k) {
  return k.includes('barline') && !k.startsWith('linked_')
}

function isHeightAlignedKey(k) {
  return (
    isBarlineKey(k) ||
    k === 'close_line' ||
    k === 'tab' ||
    k === 'tab_f'
  )
}

function fixPack(pack, packName) {
  const measureH = pack?.measure?.h
  if (measureH == null) return {changed: 0}
  const [cy1, cy2] = repeatDotYs(measureH)
  let changed = 0

  for (const [key, item] of Object.entries(pack)) {
    if (!item || typeof item !== 'object') continue
    let next = item
    let dirty = false

    if (isHeightAlignedKey(key) && item.h !== measureH) {
      next = {...next, h: measureH}
      dirty = true
    }

    if (typeof item.content === 'string' && (isBarlineKey(key) || key === 'close_line')) {
      let content = item.content
      // 把硬编码 y2 改成 measure.h（保留 node.h）
      content = content.replace(/y2="(\d+(?:\.\d+)?)"/g, (m, y) => {
        if (Number(y) === measureH) return m
        dirty = true
        return `y2="${measureH}"`
      })
      // 反复记号圆点：常见旧值 9.5/24.5（tab4）或 20.5/35.5（tab6）
      if (key.includes('Repeat') || key.includes('repeat')) {
        const oldPairs = [
          ['9.5', '24.5'],
          ['20.5', '35.5'],
          ['15', '30'],
        ]
        for (const [a, b] of oldPairs) {
          if (content.includes(`cy="${a}"`) && content.includes(`cy="${b}"`)) {
            if (a === String(cy1) && b === String(cy2)) break
            content = content
              .replaceAll(`cy="${a}"`, `cy="${cy1}"`)
              .replaceAll(`cy="${b}"`, `cy="${cy2}"`)
            dirty = true
            break
          }
        }
      }
      if (content !== item.content) {
        next = {...next, content}
        dirty = true
      }
    }

    if (dirty) {
      pack[key] = next
      changed++
      console.log(`  ${packName}.${key}: h ${item.h} -> ${pack[key].h}`)
    }
  }
  return {changed}
}

for (const file of targets) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'))
  let total = 0
  console.log('\n##', path.basename(path.dirname(file)) + '/' + path.basename(file))
  for (const packName of ['tab6', 'tab5', 'tab4']) {
    if (!j[packName]) continue
    const {changed} = fixPack(j[packName], packName)
    total += changed
  }
  if (total) {
    fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n')
    console.log('  wrote', total, 'keys')
  } else {
    console.log('  no changes')
  }
}
