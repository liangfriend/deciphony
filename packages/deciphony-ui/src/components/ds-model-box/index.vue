<!-- src/components/ds-icon/index.vue -->
<script lang="ts" setup>
import {PropType, ref} from 'vue'
import instrument from './prefab/instrument.vue'
import {BoxType, ModelEnum} from "@/types/enum";

defineOptions({
  name: 'DsModelBox'
});


const props = defineProps({
  type: {
    default: 'Instrument' as BoxType,
    type: String as PropType<BoxType>,
  },
  model: {
    default: 'Xiao' as ModelEnum, // TODO 后期改为require
    type: String as PropType<ModelEnum>,
  }
})
const modelRef = ref(null)


defineExpose({
  modelRef
})
</script>

<template>
  <instrument v-if="type === BoxType.Instrument" ref="modelRef" :model="model"></instrument>
</template>

<style scoped>
.ds-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
