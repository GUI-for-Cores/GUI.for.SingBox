<script lang="ts" setup>
import { ref, computed, isVNode, h } from 'vue'

import vMenu from '@/directives/menu'
import useI18n from '@/lang'
import { getValue } from '@/utils'

import type { Menu } from '@/types/app'

export type Column = {
  title: string
  key: string
  align?: 'center' | 'left' | 'right'
  hidden?: boolean
  minWidth?: string
  sort?: (a: Record<string, any>, b: Record<string, any>) => number
  customRender?: (v: { value: any; record: Record<string, any> }) => any
}

interface Props {
  menu?: Menu[]
  columns: Column[]
  dataSource: Record<string, any>[]
  sort?: string
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => [],
})

const sortField = ref(props.sort)
const sortReverse = ref(true)
const sortFunc = computed(
  () => props.columns.find((column) => column.key === sortField.value)?.sort,
)

const { t } = useI18n.global

const handleChangeSortField = (field: string) => {
  if (sortField.value === field) {
    if (sortReverse.value) {
      sortReverse.value = false
      return
    }
    sortField.value = ''
    sortReverse.value = true
    return
  }
  sortField.value = field
  sortReverse.value = true
}

const tableData = computed(() => {
  if (!sortField.value || !sortFunc.value) return props.dataSource
  const sorted = props.dataSource.slice().sort(sortFunc.value)
  if (sortReverse.value) sorted.reverse()
  return sorted
})

const tableColumns = computed(() => {
  return props.columns.filter((column) => !column.hidden)
})

const renderCell = (column: Column, record: Recordable) => {
  const value = getValue(record, column.key)
  let result = column.customRender?.({ value, record }) ?? value ?? '-'
  if (!isVNode(result)) {
    result = h('div', String(result))
  }
  return result
}
</script>

<template>
  <div class="gui-table overflow-auto">
    <table class="w-full text-12 border-collapse">
      <thead>
        <tr class="sticky top-0 shadow">
          <th
            v-for="column in tableColumns"
            :key="column.key"
            class="px-4 py-8 whitespace-nowrap cursor-pointer"
          >
            <div
              @click="handleChangeSortField(column.key)"
              :style="{
                justifyContent: { left: 'flext-start', center: 'center', right: 'flex-end' }[
                  column.align || 'left'
                ],
                minWidth: column.minWidth || 'auto',
              }"
              class="flex items-center"
            >
              {{ t(column.title) }}
              <div v-if="sortField === column.key && sortFunc">
                <span class="px-4"> {{ sortReverse ? '↑' : '↓' }} </span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in tableData"
          v-menu="menu.map((v) => ({ ...v, handler: () => v.handler?.(record) }))"
          :key="record.id"
          class="transition duration-200"
        >
          <td
            v-for="column in tableColumns"
            :key="column.key"
            :style="{ textAlign: column.align || 'left' }"
            class="select-text whitespace-nowrap p-8"
          >
            <slot :name="column.key" :="{ column, record }">
              <component :is="renderCell(column, record)" />
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="less" scoped>
table {
  thead {
    tr {
      background: var(--table-tr-odd-bg);
    }
  }
  tbody {
    tr {
      &:nth-child(odd) {
        background: var(--table-tr-odd-bg);
        &:hover {
          background: var(--table-tr-odd-hover-bg);
        }
      }
      &:nth-child(even) {
        background: var(--table-tr-even-bg);
        &:hover {
          background: var(--table-tr-even-hover-bg);
        }
      }
    }
  }
}
</style>
