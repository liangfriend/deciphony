// scripts/generate-global-dts.js
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const COMPONENTS_DIRS = [
    path.join(DIST, 'components'),
    path.join(DIST, 'lib', 'components'),
    path.join(DIST, 'esm', 'components'),
].filter(fs.existsSync); // 支持多种结构，优先 dist/components

// Read package.json for package name fallback
const pkgPath = path.join(ROOT, 'package.json');
const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
const packageName = pkg.name || 'deciphony-ui';

// optional mapping file path
const mapFile = path.join(ROOT, 'scripts', 'global-dts.map.json');
let mapping = {};
if (fs.existsSync(mapFile)) {
    try {
        mapping = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
    } catch (e) {
        console.error('Failed to parse mapping file', mapFile, e);
        process.exit(1);
    }
}

if (!fs.existsSync(DIST)) {
    console.error('dist directory not found. Run build first.');
    process.exit(1);
}

if (COMPONENTS_DIRS.length === 0) {
    console.warn('No components directory found under dist. I will still generate minimal global.d.ts using index.d.ts exports if available.');
}

// helper: convert file stem to PascalCase (if needed)
function toPascalCase(name) {
    return name
        .replace(/(^\w|[-_.\s]\w)/g, s => s.replace(/[-_.\s]/, '').toUpperCase());
}

// collect component names from dist/components/*.d.ts
let remoteNames = new Set();

for (const compsDir of COMPONENTS_DIRS) {
    const files = fs.readdirSync(compsDir);
    for (const f of files) {
        // accept patterns like ds-icon.d.ts, ds-icon.vue.d.ts, index.d.ts inside component folder
        const full = path.join(compsDir, f);
        const stat = fs.statSync(full);
        if (stat.isFile() && /\.d\.ts$/.test(f)) {
            // e.g. ds-icon.d.ts -> DsIcon
            const stem = f.replace(/(\.vue)?\.d\.ts$/, '');
            const candidate = toPascalCase(stem);
            remoteNames.add(candidate);
        } else if (stat.isDirectory()) {
            // maybe components are directories with index.d.ts inside
            const idx = path.join(full, 'index.d.ts');
            if (fs.existsSync(idx)) {
                const dirName = path.basename(full);
                const candidate = toPascalCase(dirName);
                remoteNames.add(candidate);
            }
        }
    }
}

// fallback: try parse exports from dist/index.d.ts if nothing found
if (remoteNames.size === 0) {
    const indexDts = path.join(DIST, 'index.d.ts');
    if (fs.existsSync(indexDts)) {
        const content = fs.readFileSync(indexDts, 'utf8');
        // try to match "export { X, Y }" or "export declare const X"
        const exportBrace = content.match(/export\s*\{\s*([^\}]+)\s*\}/);
        if (exportBrace) {
            const names = exportBrace[1].split(',').map(s => s.trim()).filter(Boolean);
            names.forEach(n => remoteNames.add(n));
        } else {
            const declareMatches = [...content.matchAll(/export\s+(?:declare\s+)?(?:const|function|class|type)\s+([A-Za-z0-9_]+)/g)];
            declareMatches.forEach(m => remoteNames.add(m[1]));
        }
    }
}

// build pairs: localName -> remoteName
// mapping file has shape { "HlIcon": "DsIcon", ... }
// if mapping empty: localName = remoteName
const pairs = [];
remoteNames.forEach(remote => {
    // if mapping contains remote as value, use that local (reverse lookup)
    const mappedLocal = Object.keys(mapping).find(k => mapping[k] === remote);
    if (mappedLocal) {
        pairs.push({local: mappedLocal, remote});
    } else {
        // if mapping has an explicit key for remote (unlikely), use it
        // check mapping where key equals remote
        if (mapping[remote]) {
            pairs.push({local: remote, remote: mapping[remote]});
        } else {
            // default: local = remote
            pairs.push({local: remote, remote});
        }
    }
});

// also include any mapping entries not present in remoteNames (manual additions)
Object.keys(mapping).forEach(local => {
    const remote = mapping[local];
    if (!pairs.find(p => p.local === local)) {
        pairs.push({local, remote});
    }
});

if (pairs.length === 0) {
    console.warn('No components detected and no mapping provided. Exiting without writing global.d.ts.');
    process.exit(0);
}

// generate content
const lines = [];
lines.push('// Auto-generated global component types');
lines.push('export {}');
lines.push('');
lines.push("declare module 'vue' {");
lines.push('  export interface GlobalComponents {');

pairs.forEach(({local, remote}) => {
    // safe escape names
    const safeLocal = local.replace(/[^A-Za-z0-9_]/g, '');
    const safeRemote = remote.replace(/[^A-Za-z0-9_]/g, '');
    lines.push(`    ${safeLocal}: (typeof import('${packageName}'))['${safeRemote}'];`);
});

lines.push('  }');
lines.push('}');
lines.push('');

const out = lines.join('\n');
const outPath = path.join(DIST, 'global.d.ts');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath);

// ensure dist/index.d.ts exists; if not, create one
const indexDtsPath = path.join(DIST, 'index.d.ts');
let indexContent = '';
if (fs.existsSync(indexDtsPath)) {
    indexContent = fs.readFileSync(indexDtsPath, 'utf8');
} else {
    indexContent = `export * from './components';\n`;
}

// ensure reference at top
const refLine = '/// <reference path="./global.d.ts" />\n';
if (!indexContent.startsWith(refLine)) {
    indexContent = refLine + indexContent;
    fs.writeFileSync(indexDtsPath, indexContent, 'utf8');
    console.log('Prepended reference to', indexDtsPath);
} else {
    console.log('Reference already present in', indexDtsPath);
}

console.log('Done. Generated global.d.ts and ensured index.d.ts references it.');
