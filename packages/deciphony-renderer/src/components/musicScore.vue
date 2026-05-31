<template>
  <svg :height="data.height" :viewBox="`0 0 ${data.width} ${data.height}`" :width="data.width"
       preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" @pointerdown="">
    <template v-for="node in vDom"
              :key="`${node.targetId ?? ''}-${node.tag}-${node.skinKey ?? ''}-${node.skinName ?? 'default'}`">
      <Group v-if="!AFFILIATION_TAGS.has(node.tag)" :node="node" :notation-type="data.type"
             :skin="skin"/>
      <g
          v-else-if="AFFILIATION_TAGS.has(node.tag)"
          :data-comment="node.dataComment"
          :data-slot-name="node.slotName??''"
          :data-target-id="node.targetId"
          :transform="`translate(${node.x}, ${node.y})`"
      >
        <Slur v-if="node.special?.slur" :v-dom="node"/>
        <Volta v-else-if="node.special?.volta !== undefined" :v-dom="node"/>
        <Beam v-else-if="node.special?.beam" :v-dom="node"/>
        <slot v-else-if="node.tag === 'slot'" :name="node.slotName" v-bind="{ node }">

        </slot>
        <Group v-else :node="node" :notation-type="data.type" :skin="skin"/>
      </g>
    </template>
  </svg>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import mockNumberNotation from '@/numberNotation/mock/happyBirthday'
import mockStandardStaff from '@/standardStaff/mock/happyBirthday'
import {musicScoreToVDom as musicScoreToVDomNumber} from '@/numberNotation/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomStandard} from '@/standardStaff/render/musicScoreToVDom'
import {applyVDomUpdate, diffAndMergeVDom} from '@/render/update'
import {defaultSkin, defaultSkinBlue, defaultSkinRed} from '@/skins/defaultSkin'
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import Group from './group.vue'
import Slur from './slur.vue'
import Volta from './volta.vue'
import Beam from './beam.vue'
import type {MusicScore} from '@/types/MusicScoreType'
import type {Skin, SkinPack, SlotConfig, VDom} from '@/types/common'

const AFFILIATION_TAGS = new Set<string>(['slot', 'affiliation', 'beam', 'noteBeam'])

const props = defineProps<{
  data: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
  slotConfig?: SlotConfig
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
  skinName?: string
}>()
// 测试：更改谱子类型
const notationType = computed(() => props.data?.type ?? MusicScoreTypeEnum.NumberNotation)
const defaultMock = computed(() =>
    notationType.value === MusicScoreTypeEnum.StandardStaff ? mockStandardStaff : mockNumberNotation
)
const data = computed(() => props.data ?? defaultMock.value)
const skin = computed<Skin>(() =>
        props.skin ?? {
          default: defaultSkin,
          red: defaultSkinRed,
          blue: defaultSkinBlue,
        }
)

/** skinName 在 skin 中查得到则用 skinName，否则用 default */
const effectiveSkinName = computed(() => {
  const sn = props.skinName
  const s = skin.value
  return sn && s && sn in s ? sn : 'default'
})

const skinPackForLayout = computed<SkinPack>(() => skin.value?.[effectiveSkinName.value] ?? defaultSkin)

const emit = defineEmits<{ renderMusicScore: [vDom: VDom[]] }>()
const vDom = ref<VDom[]>([])

const musicScoreToVDom = computed(() =>
    notationType.value === MusicScoreTypeEnum.NumberNotation ? musicScoreToVDomNumber : musicScoreToVDomStandard
)

// data、slotConfig、skin、skinName 变化时重新计算 vDom，使用 diff 原地更新以提升性能
watch(
    [data, () => props.slotConfig, skinPackForLayout, effectiveSkinName],
    ([d, slotConfig]) => {
      const next = d
          ? musicScoreToVDom.value(d, slotConfig, {skin: skin.value, skinName: effectiveSkinName.value})
          : []
      vDom.value = diffAndMergeVDom(vDom.value, next)//next//
      emit('renderMusicScore', vDom.value)
    },
    {immediate: true, deep: true}
)

/**
 * 更新 VDom：传入 updater 对深拷贝后的 vDom 做修改（如替换某符号 skinName），仅替换有变化的节点，实现部分重渲染
 * @param updater (vDom: VDom[]) => VDom[] 用户修改后 return
 */
function updateVDomHandler(updater: (vDom: VDom[]) => VDom[]) {
  vDom.value = applyVDomUpdate(vDom.value, updater)
}

defineExpose({updateVDom: updateVDomHandler})
</script>
<style scoped>
svg {
  user-select: none;
}
</style>
