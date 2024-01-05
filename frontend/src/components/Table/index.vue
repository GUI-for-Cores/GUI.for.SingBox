<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { type CSSProperties } from 'vue'

import { getValue } from '@/utils'
import type { Menu } from '@/stores'

export type Column = {
  title: string
  key: string
  align?: CSSProperties['textAlign']
  customRender?: (v: { value: any; record: Record<string, any> }) => string
}

interface Props {
  menu?: Menu[]
  columns: Column[]
  dataSource: Record<string, any>[]
}

withDefaults(defineProps<Props>(), {
  menu: () => []
})

defineEmits(['leftClick', 'rightClick'])

const { t } = useI18n()
</script>

<template>
  <div class="table">
    <table>
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ textAlign: column.align || 'center' }"
          >
            {{ t(column.title) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="data in dataSource"
          v-menu="menu.map((v) => ({ ...v, handler: () => v.handler?.(data) }))"
          :key="data.id"
          @click="$emit('leftClick', data)"
          @click.right="$emit('rightClick', data)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :style="{ textAlign: column.align || 'center' }"
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
