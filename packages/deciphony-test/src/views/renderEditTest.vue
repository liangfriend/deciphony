<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import data from './data/empty'
import {onBeforeUnmount, onMounted} from "vue";
import {getDrPlaySequence} from "./dr-extensions/dr-play/play-util";

const musicScoreData = data


onMounted(async () => {

})

onBeforeUnmount(() => {

})


</script>

<template>
  <div class="play-test">
    <div class="play-test__score">
      <musicScoreVue :data="musicScoreData" :slot-config="{'g-r':{w:50},'g-l':{w:50},'g-d':{h:50}}"
                     skin-name="default"
      >
        <template #g-d>
          <text>{{ slotProp }}asd</text>
        </template>
      </musicScoreVue>

    </div>
    <div class="play-test__panel">

    </div>
  </div>
</template>

<style scoped>
.play-test {
  display: flex;
  align-items: flex-start;
  height: 100%;
  gap: 16px;
}

.play-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.play-test__panel {
  width: 200px;
  flex-shrink: 0;
  padding: 16px;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-btn {
  width: 60px;
  height: 60px;
}
</style>
