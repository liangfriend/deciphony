import {createServer} from 'vite'
import {writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: {middlewareMode: true},
  appType: 'custom',
  resolve: {
    alias: {
      '@deciphony/renderer': path.join(root, 'scripts/renderer-shim.ts'),
    },
  },
})
try {
  const mod = await server.ssrLoadModule('/src/views/data/conductorScore.ts')
  const score = mod.buildConductorScore()
  const out = path.join(root, 'src/views/data/总谱.sj')
  writeFileSync(out, JSON.stringify(score))
  console.log(out)
} finally {
  await server.close()
}
