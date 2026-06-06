import type {MusicScore} from 'deciphony-renderer'

export type TitleFieldKey = 'title' | 'subTitle' | 'author'

export function readTitleField(musicScore: MusicScore, key: TitleFieldKey): string {
  return musicScore[key] ?? ''
}

export function writeTitleField(musicScore: MusicScore, key: TitleFieldKey, raw: string): void {
  const value = raw.trim()
  if (value) {
    musicScore[key] = value
  } else {
    delete musicScore[key]
  }
}
