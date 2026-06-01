import { ToneColor } from './types';

export let _audioContext: AudioContext | null = null;

export function startJPlayer(context: AudioContext | null = null) {
  if (_audioContext) return;
  _audioContext = context ?? new AudioContext();
}
export function closeJPlayer() {
  if (_audioContext) {
    clearGlobalToneBufferCache();
    _audioContext = null;
  }
}
export async function activeContext() {
  if (_audioContext) {
    await _audioContext.resume();
  }
}

/** ================ 全局音色 AudioBuffer（由 addToneColor 写入；播放时 _getBuffer 可命中） ===================*/
const _globalToneBufferCache = new Map<string, AudioBuffer>();
// 获取音色
export function getGlobalToneBuffer(cacheKey: string): AudioBuffer | undefined {
  return _globalToneBufferCache.get(cacheKey);
}
// 添加音色
export async function addGlobalToneColor(name: string, toneColor: ToneColor) {
  if (!_audioContext) {
    throw new Error('全局音色添加失败，请先调用startJPlayer');
  }
  const ctx = _audioContext;
  for (const [midiStr, dataUrl] of Object.entries(toneColor)) {
    const midi = Number(midiStr);
    if (Number.isNaN(midi) || !dataUrl) continue;
    const cacheKey = `${name}:${midi}`;
    try {
      const res = await fetch(dataUrl);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      _globalToneBufferCache.set(cacheKey, buffer);
    } catch (err) {
      console.warn('NPlayer音色添加失败', { cacheKey, midi, err });
    }
  }
}

// 清空音色缓存
export function clearGlobalToneBufferCache(): void {
  _globalToneBufferCache.clear();
}
