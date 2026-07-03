import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '../../..')
const rendererRoot = path.join(__dirname, '..')

const TEXT_EXT = new Set(['.ts', '.vue', '.json', '.mjs', '.js', '.md'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

const CONTENT_REPLACEMENTS = [
  ['computeTab6BeamFromStemEnds', 'computeTab6BeamFromStemEnds'],
  ['RenderTab6StemAndTailParams', 'RenderTab6StemAndTailParams'],
  ['renderTab6StemAndTailForSlot', 'renderTab6StemAndTailForSlot'],
  ['createTab6ColumnLayoutAdapter', 'createTab6ColumnLayoutAdapter'],
  ['getTab6ExtraOnsetRatios', 'getTab6ExtraOnsetRatios'],
  ['musicScoreToVDomTab6', 'musicScoreToVDomTab6'],
  ['Tab6SkinKeyEnum', 'Tab6SkinKeyEnum'],
  ['Tab6SkinPack', 'Tab6SkinPack'],
  ['tab6SkinKeyEnum', 'tab6SkinKeyEnum'],
  ['tab6BeamLine', 'tab6BeamLine'],
  ['tab6Enum', 'tab6Enum'],
  ['TAB_6_', 'TAB_6_'],
  ['Tab6', 'Tab6'],
  ['tab6', 'tab6'],
  ['tab6', 'tab6'],
]

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      walkFiles(full, out)
    } else {
      out.push(full)
    }
  }
  return out
}

function replaceInFile(filePath) {
  const ext = path.extname(filePath)
  if (!TEXT_EXT.has(ext)) return false
  let text = fs.readFileSync(filePath, 'utf8')
  const before = text
  for (const [from, to] of CONTENT_REPLACEMENTS) {
    text = text.split(from).join(to)
  }
  if (text !== before) {
    fs.writeFileSync(filePath, text, 'utf8')
    return true
  }
  return false
}

function renamePathIfNeeded(oldPath) {
  const dir = path.dirname(oldPath)
  const base = path.basename(oldPath)
  let newBase = base
  for (const [from, to] of CONTENT_REPLACEMENTS) {
    if (newBase.includes(from)) {
      newBase = newBase.split(from).join(to)
    }
  }
  if (newBase === base) return oldPath
  const newPath = path.join(dir, newBase)
  fs.renameSync(oldPath, newPath)
  return newPath
}

// 1) rename files inside tab6 (deepest paths first)
const tab6Dir = path.join(rendererRoot, 'src/tab6')
if (fs.existsSync(tab6Dir)) {
  const files = walkFiles(tab6Dir).sort((a, b) => b.length - a.length)
  for (const f of files) {
    renamePathIfNeeded(f)
  }
  // rename folder
  const tab6Dir = path.join(rendererRoot, 'src/tab6')
  fs.renameSync(tab6Dir, tab6Dir)
  console.log('renamed src/tab6 -> src/tab6')
}

// 2) rename test data file
const testDataOld = path.join(repoRoot, 'packages/deciphony-test/src/views/data/tab6Test.ts')
const testDataNew = path.join(repoRoot, 'packages/deciphony-test/src/views/data/tab6Test.ts')
if (fs.existsSync(testDataOld)) {
  fs.renameSync(testDataOld, testDataNew)
  console.log('renamed tab6Test.ts -> tab6Test.ts')
}

// 3) rename scripts
for (const [oldName, newName] of [
  ['sync-tab6-skins.mjs', 'sync-tab6-skins.mjs'],
  ['prune-tab6-skins.mjs', 'prune-tab6-skins.mjs'],
  ['rename-tab6-to-tab6.mjs', 'rename-tab6-to-tab6.mjs'],
]) {
  const oldPath = path.join(rendererRoot, 'scripts', oldName)
  const newPath = path.join(rendererRoot, 'scripts', newName)
  if (oldName !== newName && fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    fs.renameSync(oldPath, newPath)
    console.log(`renamed scripts/${oldName} -> scripts/${newName}`)
  }
}

// 4) replace content in packages
const scanRoots = [
  path.join(rendererRoot, 'src'),
  path.join(rendererRoot, 'scripts'),
  path.join(repoRoot, 'packages/deciphony-test/src'),
]
let changed = 0
for (const root of scanRoots) {
  if (!fs.existsSync(root)) continue
  for (const file of walkFiles(root)) {
    if (replaceInFile(file)) changed++
  }
}

console.log(`content updated in ${changed} files`)
