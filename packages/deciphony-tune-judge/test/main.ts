import { activeContext, closeTuneJudge, startTuneJudge } from '../src/ContextManager';
import { loadSequence, pause, play } from '../src/judge';
import type { Sequence } from '../src/types';

// 以 C 调（4/4）给出“祝你生日快乐”主旋律，单位为 Unit256（四分音符=64）。
const happyBirthday: Sequence = [
  { midi: 60, playTime: 0, duration: 64 },
  { midi: 60, playTime: 64, duration: 64 },
  { midi: 62, playTime: 128, duration: 128 },
  { midi: 60, playTime: 256, duration: 128 },
  { midi: 65, playTime: 384, duration: 128 },
  { midi: 64, playTime: 512, duration: 256 },
  { midi: 60, playTime: 768, duration: 64 },
  { midi: 60, playTime: 832, duration: 64 },
  { midi: 62, playTime: 896, duration: 128 },
  { midi: 60, playTime: 1024, duration: 128 },
  { midi: 67, playTime: 1152, duration: 128 },
  { midi: 65, playTime: 1280, duration: 256 },
  { midi: 60, playTime: 1536, duration: 64 },
  { midi: 60, playTime: 1600, duration: 64 },
  { midi: 72, playTime: 1664, duration: 128 },
  { midi: 69, playTime: 1792, duration: 128 },
  { midi: 65, playTime: 1920, duration: 128 },
  { midi: 64, playTime: 2048, duration: 128 },
  { midi: 62, playTime: 2176, duration: 256 },
  { midi: 70, playTime: 2432, duration: 64 },
  { midi: 70, playTime: 2496, duration: 64 },
  { midi: 69, playTime: 2560, duration: 128 },
  { midi: 65, playTime: 2688, duration: 128 },
  { midi: 67, playTime: 2816, duration: 128 },
  { midi: 65, playTime: 2944, duration: 256 }
];

const seqView = document.getElementById('seqView');
if (seqView) seqView.textContent = JSON.stringify(happyBirthday, null, 2);

document.getElementById('start')?.addEventListener('click', async () => {
  loadSequence(happyBirthday);
  startTuneJudge();
  await activeContext();
  await play();
});

document.getElementById('stop')?.addEventListener('click', () => {
  pause();
  closeTuneJudge();
});
