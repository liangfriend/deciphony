<script setup lang="ts">
import {ref} from "vue";


const active = ref('function')
</script>

<template>
  <div class="toolBox">
    <el-tabs class="tabs" v-model="active" type="border-card">
      <el-tab-pane label="功能" name="function">
        <slot name="function">
        </slot>
      </el-tab-pane>
      <el-tab-pane label="属性" name="properties">
        <slot name="properties"></slot>
      </el-tab-pane>
    </el-tabs>

  </div>
</template>

<style scoped>
.toolBox {
  width: 300px;
  height: 100%;
  border-left: 1px solid black;
}

.tabs {
  height: 100%;
}
</style>