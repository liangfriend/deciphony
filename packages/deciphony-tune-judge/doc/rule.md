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

第一个检测音响起，与此时目标midi的差。赋值为midiFixedOffset， 如果加上midiFixedOffset的midi的值，称为fixedMidi，

此后每返回一个新的音，新的音与目标midi的差与旧的midiFixedOffset*(midiFixedOffset生成次数-1)相加除以*(midiFixedOffset生成次数)

先这样

##### 吸附调整

如果fixedMidi 在pitchScoreElasticity范围内， 此时fixedMidi和targetMidi的差被称为midiAdsorbedOffset(吸附值), 最终的midi值被成为adsorbedMidi。 这个值理论上将，存在的话，就等于targetMidi

推荐是音轨条展示为fixedMidi。因为实际算分是adsorbedMidi，所以pitchScoreElasticity不易太大。否则看起来会不和谐，明明看上去没有唱对，却给了正确分
