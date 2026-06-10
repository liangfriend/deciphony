import type {Chronaxie} from 'deciphony-renderer'
import type {NotesNumberInfo} from 'deciphony-renderer'

const SYLLABLE_LABEL: Record<NotesNumberInfo['syllable'], string> = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  X: 'X',
}

function numberSvg(label: string, w = 14, h = 18): string {
  return `<text x="${w / 2}" y="${h - 4}" text-anchor="middle" font-size="14" font-family="Arial,sans-serif" fill="#409eff">${label}</text>`
}

export function previewNumberSvgHtml(syllable: NotesNumberInfo['syllable']): string {
  return numberSvg(SYLLABLE_LABEL[syllable] ?? '1')
}

export function previewNumberRestSvgHtml(_chronaxie: Chronaxie): string {
  return numberSvg('0')
}
