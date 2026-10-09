/**
 * 从 tab4 皮肤派生 tab5：小节线改用五线谱 measure（5 线 h=45），
 * 其余符号沿用 tab4；写入 renderer / test 的 skins/*.json。
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const files = [
  path.join(root, 'src/skins/default.json'),
  path.join(root, '../deciphony-test/src/views/skins/default.json'),
  path.join(root, '../deciphony-test/src/views/skins/bambooForest.json'),
  path.join(root, '../deciphony-test/src/views/skins/cosmos.json'),
  path.join(root, '../deciphony-test/src/views/skins/dawn.json'),
  path.join(root, '../deciphony-test/src/views/skins/glacier.json'),
  path.join(root, '../deciphony-test/src/views/skins/moHua.json'),
]

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn('skip missing', file)
    continue
  }
  const skin = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!skin.tab4 || !skin.standardStaff?.measure) {
    console.warn('skip incomplete', path.basename(file))
    continue
  }
  const tab5 = structuredClone(skin.tab4)
  tab5.measure = structuredClone(skin.standardStaff.measure)
  if (tab5.measure.skinKey != null) tab5.measure.skinKey = 'measure'
  // 闭合线高度随小节：五线谱同高
  if (skin.standardStaff.close_line && tab5.close_line) {
    tab5.close_line = {
      ...structuredClone(skin.standardStaff.close_line),
      skinKey: tab5.close_line.skinKey ?? 'close_line',
    }
  }
  if (skin.standardStaff.linked_close_line && tab5.linked_close_line) {
    tab5.linked_close_line = {
      ...structuredClone(skin.standardStaff.linked_close_line),
      skinKey: tab5.linked_close_line.skinKey ?? 'linked_close_line',
    }
  }
  skin.tab5 = tab5
  fs.writeFileSync(file, `${JSON.stringify(skin, null, 2)}\n`)
  console.log(path.basename(path.dirname(file)) + '/' + path.basename(file), 'tab5 keys', Object.keys(tab5).length, 'measure.h', tab5.measure.h)
}
