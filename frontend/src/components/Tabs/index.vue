<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type TabItemType = {
  key: string
  tab: string
}

interface Props {
  activeKey: string
  items: TabItemType[]
  height?: string
  tabPosition?: 'left' | 'top'
}

const props = withDefaults(defineProps<Props>(), {
  height: '',
  tabPosition: 'left'
})

const emits = defineEmits(['update:activeKey'])

const { t } = useI18n()

const handleChange = (key: string) => emits('update:activeKey', key)

const isActive = ({ key }: TabItemType) => key === props.activeKey
</script>

<template>
  <div :style="{ height }" :class="'position-' + tabPosition" class="tabs">
    <div class="tab">
      <Button
        v-for="tab in items"
        :key="tab.key"
        @click="handleChange(tab.key)"
        :type="isActive(tab) ? 'link' : 'text'"
      >
        {{ t(tab.tab) }}
      </Button>
      <slot name="extra" />
    </div>

    <div class="slot">
      <slot :name="activeKey"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.tabs {
  display: flex;
}
.tab {
  display: flex;
  align-items: center;
}
.slot {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.position-left {
  .tab {
    width: 20%;
    flex-direction: column;
  }
  .slot {
    width: 80%;
  }
}
.position-top {
  flex-direction: column;
  .tab {
    justify-content: center;
    margin-bottom: 8px;
  }
}
</style>
