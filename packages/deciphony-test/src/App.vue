<script lang="ts" setup>
import RenderTest from "./views/renderTest.vue";
import WebAudioTest from "./views/webAudioTest.vue";
import ElectronMessage from "./views/electronMessage.vue";
import UiTest from "./views/uiTest.vue";
import PlayerTest from "./views/playerTest.vue";
</script>

<template>

  <!--  <ui-test></ui-test>-->
  <render-test></render-test>
  <!--    <electron-message></electron-message>-->
  <!--    <test></test>-->
  <!--    <player-test></player-test>-->

  <!--  <web-audio-test></web-audio-test>-->
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
