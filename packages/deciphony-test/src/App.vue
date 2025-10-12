<script setup lang="ts">
import MusicScoreVue from "deciphony-renderer/musicScore.vue";
import RenderTest from "./views/renderTest.vue";
import PlayerTest from "./views/playerTest.vue";
import UiTest from "./views/uiTest.vue";
import WebAudioTest from "./views/webAudioTest.vue";


</script>

<template>

  <!--    <ui-test></ui-test>-->
  <render-test></render-test>
  <!--    <player-test></player-test>-->

  <!--    <web-audio-test></web-audio-test>-->
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
