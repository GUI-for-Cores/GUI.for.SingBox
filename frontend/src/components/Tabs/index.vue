<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type TabItemType = {
  key: string
  tab: string
}

interface Props {
  activeKey: string
  items: readonly TabItemType[]
  height?: string
  tabPosition?: 'left' | 'top'
}

const props = withDefaults(defineProps<Props>(), {
  height: '',
  tabPosition: 'left',
})

const emits = defineEmits(['update:activeKey'])

const { t } = useI18n()

const handleChange = (key: string) => emits('update:activeKey', key)

const isActive = ({ key }: TabItemType) => key === props.activeKey
</script>

<template>
  <div :style="{ height }" :class="'position-' + tabPosition" class="gui-tabs flex">
    <div class="gui-tabs-tab flex">
      <Button
        v-for="tab in items"
        :key="tab.key"
        @click="handleChange(tab.key)"
        :type="isActive(tab) ? 'link' : 'text'"
      >
        {{ t(tab.tab) }}
      </Button>
      <slot name="extra"></slot>
    </div>

    <div class="slot flex flex-col overflow-y-auto">
      <slot :name="activeKey"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.position-left {
  .gui-tabs-tab {
    min-width: 20%;
    flex-direction: column;
  }
  .slot {
    width: 80%;
  }
}
.position-top {
  flex-direction: column;
  .gui-tabs-tab {
    justify-content: center;
    margin-bottom: 8px;
  }
}
</style>
