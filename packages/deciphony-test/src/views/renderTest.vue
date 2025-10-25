<script lang="ts" setup>
import {computed, onBeforeMount, onMounted, ref, UnwrapRef} from 'vue';

import BottomMenu from "./editor/components/bottomMenu.vue";
import {
  addMeasure,
  addMsSymbol,
  addMsSymbolContainer,
  addSpanSymbol,
  ChronaxieEnum, measureTemplate,
  MsMode,
  msSymbolContainerTemplate,
  MsSymbolContainerTypeEnum,
  msSymbolTemplate,
  MsSymbolTypeEnum,
  MsTypeNameEnum,
  MusicScoreShowModeEnum,
  musicScoreTemplate,
  ReserveMsSymbolType, Slur,
  spanSymbolTemplate, SpanSymbolTypeEnum,
  StaffPositionTypeEnum,
  StaffRegionEnum, Volta
} from "deciphony-core";
import RightTools from "./editor/components/rightTools/rightTools.vue";
import MeasureFunction from "./editor/components/rightTools/measureFunction.vue";
import BasicFunction from "./editor/components/rightTools/basicFunction.vue";
import SingleStaffFunction from "./editor/components/rightTools/singleStaffFunction.vue";
import MultipleStavesFunction from "./editor/components/rightTools/multipleStavesFunction.vue";
import NoteHeadFunction from "./editor/components/rightTools/noteHeadFunction.vue";
import SpanSymbolFunction from "./editor/components/rightTools/spanSymbolFunction.vue";
import ClefFunction from "./editor/components/rightTools/clefFunction.vue";
import KeySignatureFunction from "./editor/components/rightTools/keySignatureFunction.vue";
import TimeSignatureFunction from "./editor/components/rightTools/timeSignatureFunction.vue";
import BarLineFunction from "./editor/components/rightTools/barLineFunction.vue";
import RestFunction from "./editor/components/rightTools/restFunction.vue";

import MusicScoreVue, {MusicScoreRef} from "deciphony-renderer";

type addedWb = {
  getMsRef: () => UnwrapRef<MusicScoreRef>
}
const msRef = ref<MusicScoreRef>(null!)
const curModeText = ref("教学模式")
const msMode = computed(() => {
  return msRef.value?.mode
})
const currentResevedType = computed(() => {
  return msRef.value.currentResevedType
})

function changeCurrentReservedType(value: ReserveMsSymbolType) {
  if (msRef.value) {
    msRef.value.setCurrentResevedType(value)
  }
}

function switchMode() {
  if (!msRef.value) return
  if (msMode.value === MsMode.edit) {
    msRef.value.changeMode(MsMode.normal);
    curModeText.value = '编辑模式'
    wbDrag.value = true
  } else {
    msRef.value.changeMode(MsMode.edit);
    curModeText.value = '教学模式'
    wbDrag.value = false
  }
}

const play = async () => {
// 存储播放序列
//   await msPlayUtils.addMusicToMap(MusicMapKey.CMK, musicScoreData.value)
//   await msPlayUtils.play(MusicMapKey.CMK)
};
const pause = () => {
  // msPlayUtils.pause((MusicMapKey.CMK))
};
const stop = () => {
  // msPlayUtils.stop((MusicMapKey.CMK))
};
const resume = () => {
  // msPlayUtils.resume(MusicMapKey.CMK)
}
const showMode = ref(MusicScoreShowModeEnum.standardStaff)
const jianxianSwitch = () => {
  //
  if (showMode.value === MusicScoreShowModeEnum.standardStaff) {
    msRef.value.switchShowMode(musicScoreData.value)
  } else {
    msRef.value.switchShowMode(musicScoreData.value)
  }
}
const wbDrag = ref(false)


const bottomMenuData = ref([{
  title: curModeText,
  callback: switchMode
}, {
  title: '播放',
  callback: play
}, {
  title: '暂停',
  callback: pause
}, {
  title: '恢复播放',
  callback: resume
}, {
  title: '停止',
  callback: stop
}, {
  title: '简线切换',
  callback: jianxianSwitch
}]);
const musicLoaded = ref(false)
// watch(musicScoreData, (newVal) => {
//   musicLoaded.value = false
//   // musicScore发生变化时，需要更新播放器生成tonejs序列
//   msPlayUtils.addMusicToMap(MusicMapKey.CMK, newVal, () => {
//     musicLoaded.value = true
//   })
// }, {deep: true})
const currentSelected = computed(() => {
  return msRef.value?.currentSelected || null
})

const musicScoreData = ref(musicScoreTemplate({}))

function addMsSymbolQuickly() {
  const msSymbol1 = add()
  const msSymbol2 = add()
  const measure = musicScoreData.value.multipleStavesArray[0].singleStaffArray[0].measureArray[0]

  // 添加volta
  // const volta = spanSymbolTemplate({
  //   type: SpanSymbolTypeEnum.volta,
  //   startTargetId: measure.id,
  //   endTargetId: measure.id
  // }) as Volta
  // addSpanSymbol(volta, measure, measure, musicScoreData.value)
// 添加slur
  const slur = spanSymbolTemplate({
    type: SpanSymbolTypeEnum.slur,
    startTargetId: msSymbol1.id,
    endTargetId: msSymbol2.id
  }) as Slur
  addSpanSymbol(slur, msSymbol1, msSymbol2, musicScoreData.value)

  const newMeasure = measureTemplate({})
  addMeasure(newMeasure, measure, musicScoreData.value, 'before')
  const newMeasure2 = measureTemplate({})
  addMeasure(newMeasure2, measure, musicScoreData.value, 'after')
}

function add() {
  const msSymbol = msSymbolTemplate({
    type: MsSymbolTypeEnum.NoteHead, region: {
      region: StaffRegionEnum.Main,
      type: StaffPositionTypeEnum.Space,
      index: 1
    },
    chronaxie: ChronaxieEnum.eighth,
  })

  const msSymbolContainer = msSymbolContainerTemplate({
    type: MsSymbolContainerTypeEnum.variable
  })
  addMsSymbolContainer(msSymbolContainer, musicScoreData.value.multipleStavesArray[0].singleStaffArray[0].measureArray[0], musicScoreData.value)
  addMsSymbol(msSymbol, msSymbolContainer, musicScoreData.value)
  msSymbol.beamId = 2
  return msSymbol
}

onMounted(() => {
  addMsSymbolQuickly()
  // addMsSymbolQuickly()
  // addMsSymbolQuickly()
  // addMsSymbolQuickly()
  // addMsSymbolQuickly()
  //TEST
  window.musicScore = musicScoreData.value

  // jianxianSwitch()


});
onBeforeMount(() => {
})

</script>
<template>
  <div class="stack">
    <div class="stackItem">
      <music-score-vue
          ref="msRef"
          :height="800"
          :mode="MsMode.normal"
          :music-score="musicScoreData"
          :show-mode="showMode"
          :width="1000"></music-score-vue>
    </div>
    <div class="stackItem toolsLayer" comment="工具层">
      <div class="rightTools">
        <right-tools>
          <template v-slot:function>
            <div class="rightToolsFunction">
              <div>
                <el-button @click="msRef?.cancelSelect()">取消选中</el-button>
              </div>
              <measure-function v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.Measure"
                                :measure="currentSelected"
                                :msRef="msRef"
                                :music-score="musicScoreData"></measure-function>
              <single-staff-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.SingleStaff"
                  :msRef="msRef"
                  :music-score="musicScoreData"
                  :singleStaff="currentSelected"></single-staff-function>
              <multiple-staves-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MultipStaves"
                  :msRef="msRef"
                  :multipleStaves="currentSelected"
                  :music-score="musicScoreData"></multiple-staves-function>
              <note-head-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MsSymbol
                                  && currentSelected.type === MsSymbolTypeEnum.NoteHead"
                  :msRef="msRef"
                  :music-score="musicScoreData"
                  :noteHead="currentSelected"></note-head-function>
              <rest-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MsSymbol
                                  && currentSelected.type === MsSymbolTypeEnum.Rest"
                  :msRef="msRef"
                  :music-score="musicScoreData"
                  :rest="currentSelected"></rest-function>
              <clef-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MsSymbol
                                  && (currentSelected.type === MsSymbolTypeEnum.Clef || currentSelected.type === MsSymbolTypeEnum.Clef_f)"
                  :clef="currentSelected"
                  :msRef="msRef"
                  :music-score="musicScoreData"></clef-function>
              <key-signature-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MsSymbol
                                  && currentSelected.type === MsSymbolTypeEnum.KeySignature"
                  :keySignature="currentSelected"
                  :msRef="msRef"
                  :music-score="musicScoreData"></key-signature-function>
              <time-signature-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MsSymbol
                                  && currentSelected.type === MsSymbolTypeEnum.TimeSignature"
                  :msRef="msRef"
                  :music-score="musicScoreData"
                  :timeSignature="currentSelected"></time-signature-function>
              <bar-line-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.MsSymbol
                                  && (currentSelected.type === MsSymbolTypeEnum.BarLine || currentSelected.type === MsSymbolTypeEnum.BarLine_f)"
                  :barLine="currentSelected"
                  :msRef="msRef"
                  :music-score="musicScoreData"></bar-line-function>
              <basic-function v-if="msRef && !currentSelected?.msTypeName"
                              :current-reseved-type="currentResevedType"
                              :msRef="msRef"
                              :music-score="musicScoreData"
                              @changeCurrentReservedType="changeCurrentReservedType"></basic-function>
              <span-symbol-function
                  v-if="msRef && currentSelected?.msTypeName === MsTypeNameEnum.SpanSymbol"
                  :msRef="msRef"
                  :music-score="musicScoreData"
                  :span-symbol="currentSelected"></span-symbol-function>

            </div>
          </template>
        </right-tools>
      </div>

      <div class="bottomMenu">
        <bottom-menu v-model="bottomMenuData"></bottom-menu>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.whiteBoard {
  width: 100%;
  height: 100%;
}


.bottomMenu {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.toolsLayer {
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.rightTools {
  position: absolute;
  right: 0;
  height: 100%;
  pointer-events: auto;
}

.back {
  cursor: pointer;
  position: fixed;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: antiquewhite;
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 10px;
  left: 10px;
}

.rightToolsFunction {
  display: flex;
  justify-content: space-between;
  row-gap: 10px;
  flex-wrap: wrap;

  > button {
    width: 120px;
    margin-left: 0;
  }
}
</style>
