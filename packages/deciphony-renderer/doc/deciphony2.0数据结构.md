```
// 曲谱展示模式
export enum MusicScoreShowModeEnum {
    StandardStaff = 1,        // 五线谱
    NumberNotation,      // 简谱（数字谱）
}
```

五线谱

```
type MusicScore {
	multipleStaves:MultipleStaves[] // 复谱表
}
```

```
type MultipleStaves {
	singleStaff: SingleStaff[] // 单谱表
}
```

```
type SingleStaff {
	measure: Measure[], // 小节
	
}
```

```
type Measure {
	msSymbol: [] // 符号
}
```

