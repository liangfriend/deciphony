<template>
  <div class="bottom-menu">
    <div class="menu-item" v-for="item in modelValue" :key="item.title" @click="() => item.callback?.()">
      <!-- 可拓展图标插槽：<Icon name="item.icon" /> -->
      <span class="menu-title">{{ item.title }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
type MenuListItem = {
  title: string,
  callback?: () => void,
  children?: [] // 二级菜单做二期
}
const props = defineProps({
  modelValue: {
    type: Array<MenuListItem>,
    default: () => [],
  }
})
</script>
<style scoped>
.bottom-menu {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  bottom: 0;
  left: 0;
  right: 0;
  width: fit-content;
  height: 64px;
  background: #fff;
  display: flex;
  border-top: 1px solid #ddd;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
  z-index: 1000;
}

.menu-item {
  flex: 1;
  width: 100px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  user-select: none;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item:active {
  background-color: #e0e0e0;
}

.menu-title {
  margin-top: 2px;
}
</style>
