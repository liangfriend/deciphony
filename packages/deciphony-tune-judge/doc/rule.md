#### 演唱测评规则

```
  mode: 'relative' | 'absolute';
  pitchScoreElasticity: number; // 弹性范围，单位midi,弹性范围内命中 absorbedMidi会被吸附到目标midi上
  rhythmScoreRange: Unit256; // 音符开始时刻向左右扩展的命中范围，此范围内命中，获取节奏得分
  completenessScoreRange: Unit256; // 音符两侧向外的扩展命中范围，此范围内命中，获取完整性得分
```

横向的时间这个不控制，不过算分对横向精确程度可以进行宽松调整

- rhythmScoreRange
- completenessScoreRange

纵向的midi这个返回用户的真实midi, 但是算分会加上midi的offset, 所以实际会进行操作改变真实结果：

最终输出的结果（加上offset后）会根据是否在pitchScoreElasticity范围内，来计算是否算分

- pitchScoreElasticity

##### relative模式规则

每秒用「目标 midi − 检测 midi」样本统计出一个整半音修正 `midiFixedOffset`；`fixedMidi = realMidi + midiFixedOffset`。

默认 `midiFixedOffset` 从 **0** 开始，约满 1 秒且样本足够后才锁定，因此开唱前一段会偏。可配置初值避免冷启动：

```ts
setInitialMidiFixedOffset(savedOffset) // 下次 play/clearData 从此值起算；已配置则首秒即生效并与后续校准混合
getInitialMidiFixedOffset()            // 读取配置的初值
getMidiFixedOffset()                   // 读取当前生效值（演唱结束后可持久化，供下次 setInitial）
```

进度回调里的 `midiFixedOffset` 与 `getMidiFixedOffset()` 一致。

##### 吸附调整

如果fixedMidi 在pitchScoreElasticity范围内， 此时fixedMidi和targetMidi的差被称为midiAdsorbedOffset(吸附值), 最终的midi值被成为adsorbedMidi。 这个值理论上将，存在的话，就等于targetMidi

推荐是音轨条展示为fixedMidi。因为实际算分是adsorbedMidi，所以pitchScoreElasticity不易太大。否则看起来会不和谐，明明看上去没有唱对，却给了正确分
