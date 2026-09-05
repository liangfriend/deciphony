import type {SJW} from '@deciphony/work'
import {addText} from '@deciphony/work'

/** 开发用伪造 sjw JSON */
const mockSjw: SJW = {
  name: '示例课件 · 基础布局',
  author: 'deciphony-test',
  pages: [
    {
      id: 'page-1',
      width: 794,
      height: 1123,
      scores: [],
      elements: [],
    },
    {
      id: 'page-2',
      width: 794,
      height: 1123,
      // 有 thumbnail：侧栏展示图片；其余页走默认 Page 预览
      thumbnail:
        'data:image/svg+xml,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123">
            <rect width="100%" height="100%" fill="#fdf6ec"/>
            <text x="50%" y="50%" text-anchor="middle" fill="#e6a23c" font-size="48">缩略图</text>
          </svg>`,
        ),
      scores: [],
      elements: [],
    },
    {
      id: 'page-3',
      width: 794,
      height: 1123,
      scores: [],
      elements: [],
    },
  ],
}

addText(mockSjw.pages[0]!, {
  x: 80,
  y: 120,
  text: '示例文本（addText）',
  fontSize: 32,
  color: '#409eff',
})

export default mockSjw
