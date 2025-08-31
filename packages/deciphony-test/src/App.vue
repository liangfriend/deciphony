<script setup lang="ts">
import MusicScoreVue from "deciphony-render/musicScore.vue";
import RenderTest from "./views/renderTest.vue";


</script>

<template>
  <render-test></render-test>
  <!--  <player-test></player-test>-->
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
