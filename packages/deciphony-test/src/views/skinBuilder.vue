<script lang="ts" setup>
import {computed, ref} from 'vue'
import type {SkinItem} from '@/types/common'
import defaultSkinJson from './skins/default.json'
import SkinSymbolCard from './skinBuilder/SkinSymbolCard.vue'
import SkinSymbolEditDialog, {
  type SkinSymbolEditTarget,
} from './skinBuilder/SkinSymbolEditDialog.vue'
import SkinCompareDialog from './skinBuilder/SkinCompareDialog.vue'

type SkinPackJson = {
  standardStaff?: Record<string, SkinItem>
  numberNotation?: Record<string, SkinItem>
}

type SkinEntry = {
  category: string
  key: string
  item: SkinItem
}

const skinPack = ref<SkinPackJson>(
  JSON.parse(JSON.stringify(defaultSkinJson)) as SkinPackJson
)

/** 对照预览左侧：始终为载入时的源 default.json */
const sourceSkinPack = ref<SkinPackJson>(
  JSON.parse(JSON.stringify(defaultSkinJson)) as SkinPackJson
)

const compareDialogVisible = ref(false)

const activeCategory = ref<'standardStaff' | 'numberNotation'>('standardStaff')

const sections = computed(() => {
  const pack = skinPack.value
  return [
    {id: 'standardStaff' as const, label: '五线谱 standardStaff', items: pack.standardStaff ?? {}},
    {id: 'numberNotation' as const, label: '简谱 numberNotation', items: pack.numberNotation ?? {}},
  ]
})

const currentSection = computed(
  () => sections.value.find((s) => s.id === activeCategory.value) ?? sections.value[0]!
)

const entries = computed((): SkinEntry[] => {
  const items = currentSection.value.items
  return Object.entries(items)
    .map(([key, item]) => ({
      category: currentSection.value.label,
      key,
      item: item as SkinItem,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
})

const filterText = ref('')
const filteredEntries = computed(() => {
  const q = filterText.value.trim().toLowerCase()
  if (!q) return entries.value
  return entries.value.filter(
    (e) =>
      e.key.toLowerCase().includes(q) ||
      e.item.skinKey?.toLowerCase().includes(q)
  )
})

function exportSkinJson() {
  const json = JSON.stringify(skinPack.value, null, 2)
  const blob = new Blob([json], {type: 'application/json;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'skin.json'
  link.click()
  URL.revokeObjectURL(url)
}

const editDialogVisible = ref(false)
const editTarget = ref<SkinSymbolEditTarget | null>(null)

function openEdit(entry: SkinEntry) {
  editTarget.value = {
    categoryId: activeCategory.value,
    categoryLabel: currentSection.value.label,
    key: entry.key,
    item: entry.item,
  }
  editDialogVisible.value = true
}

function onEditSave(payload: {content: string; w: number; h: number}) {
  const target = editTarget.value
  if (!target) return
  const section = skinPack.value[target.categoryId]
  if (!section?.[target.key]) return
  section[target.key] = {
    ...section[target.key]!,
    content: payload.content,
    w: payload.w,
    h: payload.h,
  }
}
</script>

<template>
  <div class="skin-builder">
    <header class="skin-builder__header">
      <h1 class="skin-builder__title">皮肤包预览</h1>
      <p class="skin-builder__hint">
        卡片 100×100，虚线框为符号逻辑边界；content 中
        <code>node.w</code> / <code>node.h</code> 已替换（measure 的 w 固定为 100）。
        <code>slur</code> / <code>volta</code> 的 content 为颜色，展示色块。点击符号卡片可编辑 content / width / height。
      </p>
      <div class="skin-builder__toolbar">
        <el-radio-group v-model="activeCategory" size="small">
          <el-radio-button
            v-for="sec in sections"
            :key="sec.id"
            :label="sec.id"
          >
            {{ sec.label }}
          </el-radio-button>
        </el-radio-group>
        <el-input
          v-model="filterText"
          class="skin-builder__search"
          size="small"
          clearable
          placeholder="筛选符号 key / skinKey"
        />
        <span class="skin-builder__count">{{ filteredEntries.length }} 项</span>
        <el-button size="small" @click="compareDialogVisible = true">
          对照预览
        </el-button>
        <el-button type="primary" size="small" @click="exportSkinJson">
          导出 JSON
        </el-button>
      </div>
    </header>

    <div class="skin-builder__grid">
      <SkinSymbolCard
        v-for="entry in filteredEntries"
        :key="`${activeCategory}-${entry.key}`"
        :name="entry.key"
        :category="entry.category"
        :item="entry.item"
        @edit="openEdit(entry)"
      />
    </div>

    <SkinSymbolEditDialog
      v-model="editDialogVisible"
      :target="editTarget"
      @save="onEditSave"
    />

    <SkinCompareDialog
      v-model="compareDialogVisible"
      :source-skin="sourceSkinPack"
      :draft-skin="skinPack"
      :notation-category="activeCategory"
    />
  </div>
</template>

<style scoped>
.skin-builder {
  min-height: 100vh;
  padding: 16px 20px 32px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.skin-builder__header {
  margin-bottom: 16px;
}

.skin-builder__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.skin-builder__hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.skin-builder__hint code {
  font-size: 12px;
  background: #eef1f6;
  padding: 1px 4px;
  border-radius: 3px;
}

.skin-builder__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.skin-builder__search {
  width: 220px;
}

.skin-builder__count {
  font-size: 13px;
  color: #909399;
}

.skin-builder__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 12px;
}
</style>
