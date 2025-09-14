<!-- src/components/hl-icon/index.vue -->
<script setup lang="ts">
import {onMounted, PropType, ref} from 'vue'
import instrument from './prefab/instrument.vue'

defineOptions({
  name: 'DsModelBox'
});

enum BoxType {
  Instrument = 'Instrument',
  Normal = 'Normal'
}

enum ModelEnum {
  Xiao = 'Xiao',
}

const props = defineProps({
  type: {
    default: 'Instrument',
    type: String as PropType<BoxType>,
  },
  model: {
    default: 'Xiao', // TODO 后期改为require
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
.hl-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
