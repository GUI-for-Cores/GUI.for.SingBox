<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'

import { getValue } from '@/utils'
import type { Menu } from '@/stores'

type SortType = (a: Record<string, any>, b: Record<string, any>) => number

export type Column = {
  title: string
  key: string
  align?: 'center' | 'left' | 'right'
  minWidth?: string
  sort?: SortType
  customRender?: (v: { value: any; record: Record<string, any> }) => string
}

interface Props {
  menu?: Menu[]
  columns: Column[]
  dataSource: Record<string, any>[]
  sort?: string
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => []
})

const sortField = ref(props.sort)
const sortReverse = ref(false)
let sortFunc: SortType

const { t } = useI18n()

const handleChangeSortField = (field: string, sort: any) => {
  if (sortField.value === field) {
    if (!sortReverse.value) {
      sortReverse.value = true
      return
    }
    sortField.value = ''
    sortReverse.value = false
    return
  }
  if (sort) {
    sortField.value = field
    sortFunc = sort
    sortReverse.value = false
  }
}

const tableData = computed(() => {
  if (!sortField.value || !sortFunc) return props.dataSource
  const sorted = props.dataSource.slice().sort(sortFunc)
  if (sortReverse.value) sorted.reverse()
  return sorted
})
</script>

<template>
  <div class="table">
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            <div
              class="title"
              @click="handleChangeSortField(column.key, column.sort)"
              :style="{
                justifyContent: { left: 'flext-start', center: 'center', right: 'flex-end' }[
                  column.align || 'left'
                ],
                minWidth: column.minWidth || 'auto'
              }"
            >
              {{ t(column.title) }}
              <div v-if="sortField === column.key">
                <span v-if="sortReverse" class="title-sort"> ↑ </span>
                <span v-else class="title-sort"> ↓ </span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="data in tableData"
          v-menu="menu.map((v) => ({ ...v, handler: () => v.handler?.(data) }))"
          :key="data.id"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :style="{
              textAlign: column.align || 'left'
            }"
            class="user-select"
          >
            {{
              column.customRender
                ? column.customRender({ value: getValue(data, column.key), record: data })
                : getValue(data, column.key)
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="less" scoped>
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
  thead {
    tr {
      position: sticky;
      top: 0;
      background: var(--table-tr-odd-bg);
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
      th {
        padding: 8px 4px;
        white-space: nowrap;
        cursor: pointer;
        .title {
          display: flex;
          align-items: center;
          &-sort {
            padding: 0 4px;
          }
        }
      }
    }
  }
  tbody {
    tr {
      transition: all 0.2s;
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
      td {
        padding: 8px;
        white-space: nowrap;
      }
    }
  }
}
</style>
