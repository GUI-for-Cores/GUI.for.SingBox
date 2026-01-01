<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type TabItemType = {
  key: string
  tab: string
}

interface Props {
  activeKey: string
  items: readonly TabItemType[]
  tabPosition?: 'left' | 'top'
  tabWidth?: string
  contentWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  tabPosition: 'left',
  tabWidth: '20%',
  contentWidth: '80%',
})

const emits = defineEmits(['update:activeKey'])

const { t } = useI18n()

const isTop = computed(() => props.tabPosition === 'top')

const handleChange = (key: string) => emits('update:activeKey', key)

const isActive = ({ key }: TabItemType) => key === props.activeKey
</script>

<template>
  <div :class="{ 'flex-col': isTop }" class="gui-tabs flex">
    <div
      :class="{ 'justify-center mb-8': isTop, 'flex-col': !isTop }"
      :style="{ width: isTop ? 'auto' : tabWidth }"
      class="gui-tabs-tab flex"
    >
      <Button
        v-for="tab in items"
        :key="tab.key"
        :type="isActive(tab) ? 'link' : 'text'"
        @click="handleChange(tab.key)"
      >
        {{ t(tab.tab) }}
      </Button>
      <slot name="extra"></slot>
    </div>

    <div class="flex flex-col overflow-y-auto" :style="{ width: isTop ? 'auto' : contentWidth }">
      <slot :name="activeKey"></slot>
    </div>
  </div>
</template>
