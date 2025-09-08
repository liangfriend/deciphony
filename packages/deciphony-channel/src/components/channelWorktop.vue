<script setup lang="ts">

import ChannelExhibition from "./channelExhibition.vue";
import ChannelEditor from "./channelEditor.vue";
</script>

<template>
  <div class="group">
    <channel-exhibition/>
  </div>
  <div class="group">
    <channel-editor></channel-editor>
  </div>
</template>

<style scoped>

.group {
  border: 2px dashed #ccc;
  border-radius: 12px;

}
</style>
