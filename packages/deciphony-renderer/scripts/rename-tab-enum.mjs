/**
 * 批量把 MusicScoreTypeEnum.Tab* 换成乐器枚举，并补上 isFretboardScoreType 等辅助引用。
 * 仅改源码，不碰 node_modules。
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const EXTS = new Set(['.ts', '.vue', '.md'])
const SKIP = new Set(['node_modules', 'dist', '.git', 'renderer_old'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (EXTS.has(path.extname(name))) out.push(p)
  }
  return out
}

const files = walk(path.join(root, 'packages')).filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`))

let changed = 0
for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s

  // 枚举成员（先长后短，避免 Tab6 吃掉 Tab）
  s = s.replace(/MusicScoreTypeEnum\.Tab6/g, 'MusicScoreTypeEnum.Guitar')
  s = s.replace(/MusicScoreTypeEnum\.Tab5/g, 'MusicScoreTypeEnum.Bass5')
  s = s.replace(/MusicScoreTypeEnum\.Tab4/g, 'MusicScoreTypeEnum.Ukulele')

  if (s !== orig) {
    fs.writeFileSync(file, s)
    changed++
    console.log(path.relative(root, file))
  }
}
console.log('files changed', changed)
