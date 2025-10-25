<!--微观编辑器-->
<script setup lang="ts">
import {ref, onMounted, nextTick, computed, watch} from "vue"
import ChannelWindow from "./channelWindow.vue";
import {HighlightItem} from "@core/types";

const canvasRef = ref<HTMLCanvasElement>(null!)
const channelWindowRef = ref<{ draw: () => void }>(null!)
const zoom = ref(1) // 缩放因子（横向）
const sampleStep = ref(1) // 采样点步长
const amplitudeScale = ref(1) // 振幅缩放因子
const channelData = ref<number[]>([])
const selectedIndx = ref(0)
// 模式
const curMode = ref<'select' | 'mark'>('select')

// slider 控制项
function onZoomChange(e: Event) {
  zoom.value = Number((e.target as HTMLInputElement).value)
}

// 采样步长
function onStepChange(e: Event) {
  sampleStep.value = Number((e.target as HTMLInputElement).value)
}

// 振幅高度
function onAmpChange(e: Event) {
  amplitudeScale.value = Number((e.target as HTMLInputElement).value)
}

// 生成逻辑
function channelGenerate() {
  channelData.value = Array.from({length: dataLength.value}, (v, i) => 0);
}


// 波形时间
const duration = computed(() => {
  return channelData.value.length * copyCount.value / cacheChannelData.value.sampleRate
})
// 数据长度
const dataLength = ref(169)
// 复制次数
const copyCount = ref(261)


watch(channelData, () => {
}, {
  deep: true
})
// 选中点编辑
const selectPoint = ref({
  index: 0,
  coefficient: 2, // 系数
  influenceLength: 0,// 影响范围
  weightType: 1,//权重模式 始终相等1，直线递减2 圆滑递减3 尖锐递减4
  direction: 1, // 两侧1 左侧2 右侧3
  relativeHeight: 0, // 相对高度调整
})

function getWeightForPoint(offset: number, range: number, type: number, coefficient: number = 2): number {
  if (range < 0) return 0
  const d = Math.abs(offset) / (range + 1) // 距离比值 0~1
  switch (type) {
    case 1: { // 始终相等
      return 1
    }
    case 2: { // 直线递减
      return 1 - d
    }
    case 3: { // 圆滑递减
      return 1 - Math.pow(d, coefficient)
    }
    case 4: { // 尖锐递减
      return Math.pow(1 - d, coefficient)
    }
    default:
      return 1 - d
  }
}

function changeHeightForPoint(val: number) {
  console.log('chicken',)
  if (val === 0) return
  channelData.value[highlightList.value[0].index] += val
  const center = +highlightList.value[0].index// 不知道为啥，这里总会变成字符串，所以加了+
  const range = selectPoint.value.influenceLength
  const len = channelData.value.length
  const direction = +selectPoint.value.direction // 1 两侧 2左侧 3右侧
  for (let offset = -range; offset <= range; offset++) {
    if (offset === 0) continue // 跳过中心点

    // === 根据方向过滤 ===
    if (direction === 2 && offset > 0) continue // 只左侧
    if (direction === 3 && offset < 0) continue // 只右侧

    const idx = center + offset
    if (idx < 0 || idx >= len) continue

    // 权重计算
    const weight = getWeightForPoint(
        offset,
        range,
        +selectPoint.value.weightType,
        selectPoint.value.coefficient
    )

    channelData.value[idx] += val * weight
  }
}

// 波形导出
const cacheChannelData = ref<{ channel: Array<number>, sampleRate: number, name: string }>({
  channel: [], sampleRate: 44100, name: ''
})
const emits = defineEmits(['cacheChannel'])

function copyChannel() {
  channelData.value = Array(copyCount.value).fill(channelData.value).flat();
}

function cacheChannel() {
  cacheChannelData.value.channel = channelData.value
  emits('cacheChannel', JSON.parse(JSON.stringify(cacheChannelData.value)));
}

function pointClick(payload: { index: number, value: number }) {

  if (curMode.value === "select") {
    const selectionLine = highlightList.value.find(e => e.key === 'selection')!
    selectionLine.index = payload.index
  } else if (curMode.value === "mark") {
    highlightList.value.push({
      index: payload.index,
      key: '' + Date.now(),
      name: '新标记',
      color: 'orange',
      show: true
    })
  }
}

// 标记列表
const highlightList = ref<Array<HighlightItem>>([{
  index: 0,
  key: 'selection',
  name: '当前选择',
  color: 'red',
  show: true
}])
const selectedMarkKey = ref('')

function activeMark(item: HighlightItem) {
  const target = highlightList.value.find(e => e === item)!
  target.color = '#4096ff'
}

function deactiveMark(item: HighlightItem) {
  const target = highlightList.value.find(e => e === item)!
  if (target.key !== selectedMarkKey.value) {
    target.color = 'orange'
  } else {
    target.color = 'green'
  }

}

function selectMark(item: HighlightItem) {
  // 取消之前的高亮
  const preTarget = highlightList.value.find(e => e.key === selectedMarkKey.value)
  if (preTarget) {
    preTarget.color = 'orange'
  }
  const target = highlightList.value.find(e => e === item)!
  selectedMarkKey.value = target.key
  target.color = 'green'
}

function deleteMark(item: HighlightItem) {
  const targetIndex = highlightList.value.findIndex(e => e === item)
  highlightList.value.splice(targetIndex, 1)
}

function addMark(item: { index: number, key: string, name: string }) {
  highlightList.value.push({
    show: true,
    color: 'orange',
    index: item.index,
    key: item.key,
    name: item.name
  })
}

const markAddInfo = ref({
  index: 0,
  key: '',
  name: ''
})

// 区域编辑
const selectRegion = ref({
  startIndex: 0,  // 开始索引
  endIndex: 0,  // 结束索引
  coefficient: 2, // 系数
  relativeMove: 0.01, // 相对移动值
  baseLine: 0,  // 基准线
  direction: 1, // 1两侧 2左侧 3右侧
  weightType: 1, // 权重模式 1始终相等 2直线递减 3圆滑递减 4尖锐递减
})

function amplitudeAdjustment() {
  const val = selectRegion.value.relativeMove
  if (val === 0) return

  const len = channelData.value.length
  const startIndex = selectRegion.value.startIndex
  const endIndex = selectRegion.value.endIndex
  const direction = +selectRegion.value.direction // 1 两侧 2 左侧 3 右侧
  const weightType = +selectRegion.value.weightType
  const coefficient = selectRegion.value.coefficient
  const baseLine = +selectRegion.value.baseLine

  const total = endIndex - startIndex
  if (total <= 0) return
  for (let i = startIndex; i <= endIndex; i++) {
    if (i < 0 || i >= len) continue

    // 归一化位置 0~1
    const pos = (i - startIndex) / total
    let d: number

    if (direction === 1) {
      // 两侧到中间递减
      d = 1 - Math.abs(pos - 0.5) * 2
    } else if (direction === 2) {
      // 从左到右递减
      d = 1 - pos
    } else {
      // 从右到左递减
      d = pos
    }

    const weight = getWeightForPoint(
        d * total, // offset
        total,
        weightType,
        coefficient
    )

    const current = channelData.value[i]

    // === 基准线 → 不调整
    if (current === baseLine) continue

    // 判断基准线：高于 → 正常，低于 → 反向
    const directionFactor = current > baseLine ? 1 : -1

    channelData.value[i] = current + val * weight * directionFactor
  }
}

function clipChannelData(
    startIndex: number,
    endIndex: number,
    type: 'outside' | 'inside' = 'inside'
) {
  if (endIndex < startIndex) {
    throw new Error("endIndex 必须 >= startIndex")
  }

  // 取消高亮的标记线
  selectedMarkKey.value = ''

  if (type === 'inside') {
    // === 内裁剪：删掉 [startIndex, endIndex]
    const deleteCount = endIndex + 1 - startIndex
    channelData.value.splice(startIndex, deleteCount)

    highlightList.value = highlightList.value
        .filter(item => item.index < startIndex || item.index > endIndex || item.key === 'selection')
        .map(item => {
          // 操作当前选择标记线
          if (!(item.index < startIndex || item.index > endIndex) && item.key === 'selection') {
            return {...item, index: 0}
          }
          if (item.index > endIndex) {
            return {...item, index: item.index - deleteCount}
          }
          return item
        })
  } else {
    // === 外裁剪：保留 [startIndex, endIndex]
    channelData.value = channelData.value.slice(startIndex, endIndex + 1)

    highlightList.value = highlightList.value
        .filter(item => (item.index >= startIndex && item.index <= endIndex) || item.key === 'selection')
        .map(item => {
          // 操作当前选择标记线
          if (!(item.index >= startIndex && item.index <= endIndex) && item.key === 'selection') {
            return {...item, index: 0}
          }
          // 索引重新映射到新的数组 (从 0 开始)
          return {...item, index: item.index - startIndex}
        })


  }
}

function setChannel(channelInfo: { channel: Array<number>, sampleRate: number, name: string }) {
  channelData.value = channelInfo.channel
  cacheChannelData.value.sampleRate = channelInfo.sampleRate
  cacheChannelData.value.name = channelInfo.name
}

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.height = 200
  }
  channelData.value = []

  // for (let i = 0; i < 400; i++) {
  //   channelData.value.push(Math.sin(i % Math.PI))
  // }
})

defineExpose({setChannel})
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="text-2xl">波形编辑</div>
    <div class="flex items-center">
      <label>波形生成：</label>
      <div class="mr-4">
        数据长度：<input type="number" v-model="dataLength"/>
      </div>

      <button @click="channelGenerate">生成</button>
      <div>标准C4(261.63赫兹)，再采样率为444100时，一秒的音频数据需要168.55个数据点</div>
    </div>
    <div class="flex items-center space-x-4 " v-if="channelData.length">
      <label>当前编辑波形信息：</label>
      <div class="mr-4">
        数据长度：{{ channelData.length }}
      </div>
    </div>
    <div>注：我们推荐用选中点编辑创造一个最小周期波形，然后复制出完整波形再用选中区域编辑谐波</div>
    <div
        class="border rounded h-52 w-full overflow-auto hide-scrollbar"
    >
      <channel-window
          :zoom="zoom"
          :channel-data="channelData"
          :sampleStep="sampleStep"
          :amplitude-scale="amplitudeScale"
          :highlight-list="highlightList"
          @pointClick="pointClick"
          ref="channelWindowRef"></channel-window>
    </div>


    <div comment="控制区" class="flex items-center space-x-4 region">
      <label>缩放：</label>{{ zoom }}
      <input type="range" min="0.5" :max="Math.max(5,channelData.length/1000)" step="0.1"
             v-model="zoom" @input="onZoomChange"/>

      <label>采样步长：</label>
      <input type="range" min="1" max="2000" step="1"
             v-model.number="sampleStep" @input="onStepChange"/>
      <span>{{ sampleStep }}</span>

      <label>振幅高度：</label>
      <input type="range" min="0.1" max="5" step="0.1"
             v-model.number="amplitudeScale" @input="onAmpChange"/>
      <span>{{ amplitudeScale && amplitudeScale.toFixed(1) }}x</span>
    </div>

    <div comment="编辑区" class="region" v-if="channelData.length">
      <div>
        <label><input type="radio" value="select" v-model.number="curMode"/> 选择模式</label>
        <label><input type="radio" value="mark" v-model.number="curMode"/> 标记模式</label>
      </div>
      <div comment="当前选择编辑" class="flex justify-between tag">
        <div comment="左侧">
          <div class="text-2xl text-red-400">选中点编辑</div>
          <div class="mr-4 flex">
            <div class="w-fit">高度：</div>
            <div class="flex justify-between items-center">
              <button @click="changeHeightForPoint(-0.01)">-</button>
              <div><input type="number" step="0.05" disabled v-model="channelData[highlightList[0].index]"/>{{ }}</div>
              <button @click="changeHeightForPoint(0.01)">+</button>
            </div>
            <input type="range" v-model="highlightList[0].index" min="0" :max="channelData.length-1"/>
            <div class="mr-4">
              当前点位：<input class="w-16" type="number" v-model="highlightList[0].index"/>
            </div>
            <div class="mr-4">
              影响范围：<input class="w-16" type="number" step="1" v-model="selectPoint.influenceLength"/>
            </div>
            <div class="mr-4">
              系数（默认=2，只对圆滑和尖锐模式有效）：<input class="w-16" type="number" step="1"
                                                         v-model="selectPoint.coefficient"/>
            </div>
          </div>
          <div class="mr-2">
            相对高度调整：
            <input type="number" v-model="selectPoint.relativeHeight"/>
            <button @click="changeHeightForPoint(selectPoint.relativeHeight)">更新</button>
          </div>
          <div class="mr-4">
            权重模式：
            <label><input type="radio" value="1" v-model.number="selectPoint.weightType"/> 始终相等</label>
            <label><input type="radio" value="2" v-model.number="selectPoint.weightType"/> 直线递减</label>
            <label><input type="radio" value="3" v-model.number="selectPoint.weightType"/> 圆滑递减</label>
            <label><input type="radio" value="4" v-model.number="selectPoint.weightType"/> 尖锐递减</label>
          </div>
          <div class="mr-4">
            方向：
            <label><input type="radio" value="1" v-model.number="selectPoint.direction"/> 两侧</label>
            <label><input type="radio" value="2" v-model.number="selectPoint.direction"/> 左侧</label>
            <label><input type="radio" value="3" v-model.number="selectPoint.direction"/> 右侧</label>
          </div>

        </div>
        <div comment="右侧" class="flex">


        </div>
      </div>
      <div comment="标记点位编辑" class="tag">
        <div>标记列表：</div>
        <div class="overscroll-x-auto flex p-2 bg-amber-100 h-10">
          <div class="hover:bg-[#4096ff] flex  items-center mr-4 bg-amber-200 w-fit px-2"
               @mouseenter="activeMark(item)"
               @mouseleave="deactiveMark(item)"
               @click="selectMark(item)"
               :style="{backgroundColor: item.key === selectedMarkKey?'green':'#fee685'}"
               v-for="(item,index) in highlightList"
               v-show="item.key !=='selection'">
            {{ item.name }}
            <div @click.stop="deleteMark(item) "
                 class="ml-2 bg-white w-4 h-4 flex justify-center items-center text-xs rounded-[50%]">X
            </div>
          </div>
        </div>
        <div class="flex justify-between">
          <div comment="左侧" v-if="highlightList.find(e => e.key === selectedMarkKey)">
            <div>当前选择标记信息：</div>
            <div>索引：<input type="number" v-model="highlightList.find(e=>e.key===selectedMarkKey)!.index"/>
            </div>
            <div>高度：{{ channelData[highlightList.find(e => e.key === selectedMarkKey)!.index] }}</div>
            <div>名称：<input type="text" v-model="highlightList.find(e => e.key === selectedMarkKey)!.name"/></div>
          </div>
          <div v-else commment="保持布局"></div>
          <div comment="右侧">
            <button @click="addMark(markAddInfo)">添加标记</button>
            <div>索引：<input type="number" v-model="markAddInfo.index"/></div>
            <div>键名：<input type="text" v-model="markAddInfo.key"/></div>
            <div>名称<input type="text" v-model="markAddInfo.name"/></div>
          </div>
        </div>
      </div>
      <div comment="选区编辑" class="tag">
        <div class="text-2xl text-red-400">选中区域编辑(两侧闭区间)</div>
        <div>
          起点索引<input type="number" v-model="selectRegion.startIndex"/>-
          <input type="number" v-model="selectRegion.endIndex"/>终点索引
        </div>
        <div class="flex items-center" v-if="channelData.length">
          <div>相对拉伸程度
            <input type="number" v-model="selectRegion.relativeMove" step="0.01"/>
          </div>
          <div>基准线
            <input type="number" v-model="selectRegion.baseLine" step="0.01"/></div>
          <div>系数
            <input type="number" v-model="selectRegion.coefficient" step="0.01"/></div>


        </div>
        <div class="mr-4">
          权重模式：
          <label><input type="radio" value="1" v-model.number="selectRegion.weightType"/> 始终相等</label>
          <label><input type="radio" value="2" v-model.number="selectRegion.weightType"/> 直线递减</label>
          <label><input type="radio" value="3" v-model.number="selectRegion.weightType"/> 圆滑递减</label>
          <label><input type="radio" value="4" v-model.number="selectRegion.weightType"/> 尖锐递减</label>
        </div>
        <div class="mr-4">
          方向：
          <label><input type="radio" value="1" v-model.number="selectRegion.direction"/> 两侧</label>
          <label><input type="radio" value="2" v-model.number="selectRegion.direction"/> 左侧</label>
          <label><input type="radio" value="3" v-model.number="selectRegion.direction"/> 右侧</label>
        </div>
        <div>
          <button @click="amplitudeAdjustment">振幅拉伸调整</button>
          <button @click="clipChannelData(selectRegion.startIndex,selectRegion.endIndex,'inside')">删除片段</button>
          <button @click="clipChannelData(selectRegion.startIndex,selectRegion.endIndex,'outside')">保留片段</button>

        </div>
      </div>


    </div>
    <div comment="导出区" class="flex items-center region" v-if="channelData.length">
      <label>音频生成：</label>
      <div class="">
        采样率：<input type="number" class="w-24" v-model="cacheChannelData.sampleRate"/>
      </div>
      <div class="w-52">音频时长：{{ duration }}秒</div>
      <div class="mr-2">
        复制次数：<input type="number" class="w-24" v-model="copyCount"/>
        <button class="w-36" @click="copyChannel">复制</button>
      </div>

      <button class="w-36" @click="cacheChannel">缓存波形</button>
      <div class="w-64">波形名：<input type="text" v-model="cacheChannelData.name"></div>
    </div>


  </div>
</template>

<style scoped>
canvas {
  display: block;

}

.region {
  background: rgba(57, 68, 76, 0.2);
  margin-bottom: 6px;
  padding: 6px;
}

.tag {
  border: 1px dashed red;
  margin-bottom: 6px;
  margin-top: 6px;
}

input[type='number'], input[type='text'] {
  outline: 1px solid black;
}

button {
  border-radius: 6px;
  padding: 2px 6px;
  border: 1px solid black;
}
</style>
