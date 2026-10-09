import type {MusicScore} from '@deciphony/renderer'

export type TitleFieldKey = 'title' | 'subTitle' | 'author'

export function readTitleField(musicScore: MusicScore, key: TitleFieldKey): string {
  return musicScore[key] ?? ''
}

/** 作者可多行（`\n` 分隔），保留原文以免输入时吞掉行尾换行；展示时再逐行 trim、去空行 */
export function writeTitleField(musicScore: MusicScore, key: TitleFieldKey, raw: string): void {
  if (!raw.trim()) {
    delete musicScore[key]
    return
  }
  musicScore[key] = key === 'author' ? raw.replace(/\r\n?/g, '\n') : raw.trim()
}
