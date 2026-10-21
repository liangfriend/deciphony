和弦弹唱谱(吉他)

{

title:string,
author:stirng,
width:number
height:number // 组件的实际像素
fontFamily:string
lyrics:[[{ // 二维数组，多行歌词
id:string
text:String,
color:String,
chord:{
text:string,
color:string
}
}]]

data:{ // 用户自定义数据

}
}

保留出一个组件，只展示内容部分，不渲染歌词作者等。
内容部分为歌词，每行歌词相隔一定距离方便放置和弦

分为展示模式和编辑模式

编辑模式编辑歌词和歌词的和弦，和弦就内置标准的和弦列表，CDE Am这种的全套

## 使用

```ts
import {ClSheet, createClSheet, parseChordLyrics} from '@deciphony/cl-sheet'
import '@deciphony/cl-sheet/dist/cl-sheet.css'

const data = ref(createClSheet({
  title: '茉莉花',
  author: '江苏民歌',
  width: 560,
  height: 460,
  lyrics: parseChordLyrics('[C]好一朵美丽的[Am]茉莉[C]花\n[F]好一朵美丽的[C]茉莉[G]花'),
}))
```

```vue
<ClSheet :data="data" mode="edit" :font-size="20" @change="save"/>
```

编辑模式：点字选和弦（← → ↑ ↓ 切换，Delete 删除），行尾「+」在行尾加和弦，双击改整行文字（Enter 拆行、行首 Backspace 合并、可粘贴多行），拖动和弦换位置（Ctrl 复制）。

详细规则见 `AGENTS.md`。
