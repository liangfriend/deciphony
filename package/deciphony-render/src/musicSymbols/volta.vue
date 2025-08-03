<template>
  <div class="volta" :style="voltaStyle">
    <div>1,2,3</div>
  </div>
</template>
<script setup lang="ts">
import {computed, CSSProperties, PropType} from "vue";
import {SpanSymbol, Volta} from "@/applications/ChuangKeApplication/components/musicScore/types";
import {SpanSymbolTypeEnum} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";

const props = defineProps({
  volta: {
    type: Object as PropType<Volta>,
    required: true
  }
})
const voltaStyle = computed(() => {

  const style: CSSProperties = {
    width: '100%',
    height: '100%'

  }


  return style
})
</script>


<style scoped>
.volta {

  border-left: 1px solid black;
  border-top: 1px solid black;
  pointer-events: auto;
  user-select: none;

  > * {
    pointer-events: none;
  }
}
</style>