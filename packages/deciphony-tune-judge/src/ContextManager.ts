export let _audioContext: AudioContext | null = null;
/**
 * 传入audioContext
 * 用于计时
 */
export function startTuneJudge(context: AudioContext | null = null) {
  if (_audioContext) return;
  _audioContext = context ?? new AudioContext();
}
export function closeTuneJudge() {
  if (_audioContext) {
    _audioContext = null;
  }
}
export async function activeContext() {
  if (_audioContext) {
    await _audioContext.resume();
  }
}
