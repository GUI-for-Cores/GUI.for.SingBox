<script setup lang="ts">
import { ref } from 'vue'

import useI18n from '@/lang'

interface Props {
  type: 'single' | 'multi'
  title: string
  options: { label: string; value: string; description?: string }[]
  initialValue?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  initialValue: () => []
})

const emits = defineEmits(['confirm', 'cancel', 'finish'])

const selected = ref(new Set<string>(props.initialValue))

const { t } = useI18n.global

const handleConfirm = () => {
  let res: any = Array.from(selected.value)
  if (props.type === 'single') {
    res = res[0]
  }
  emits('confirm', res)
  emits('finish')
}

const handleCancel = () => {
  emits('cancel')
  emits('finish')
}

const isSelected = (option: string) => selected.value.has(option)

const handleSelect = (option: string) => {
  if (isSelected(option)) {
    selected.value.delete(option)
  } else {
    if (props.type === 'single') selected.value.clear()
    selected.value.add(option)
  }
}

const handleSelectAll = () => {
  if (props.options.some((v) => !selected.value.has(v.value))) {
    props.options.forEach((v) => selected.value.add(v.value))
  } else {
    selected.value.clear()
  }
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="picker">
      <div class="title">{{ t(title) }}</div>

      <div class="options">
        <div v-for="(o, i) in options" :key="i" @click="handleSelect(o.value)" class="item">
          <div class="label">
            <div>{{ o.label }}</div>
            <Icon
              v-show="isSelected(o.value)"
              :size="32"
              icon="selected"
              fill="var(--primary-color)"
              style="flex-shrink: 0"
            />
          </div>
          <div class="description">{{ o.description }}</div>
        </div>
      </div>

      <div class="form-action">
        <Button v-if="type === 'multi'" @click="handleSelectAll" type="text" size="small">
          {{ t('common.selectAll') }}
        </Button>
        <Button type="text" size="small" class="mr-auto">
          {{ selected.size }} / {{ options.length }}
        </Button>
        <Button @click="handleCancel" size="small">{{ t('common.cancel') }}</Button>
        <Button @click="handleConfirm" size="small" type="primary">
          {{ t('common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.picker {
  min-width: 340px;
  max-width: 60%;
  padding: 8px;
  background: var(--toast-bg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 4px;

  .title {
    font-weight: bold;
    padding: 8px 4px;
  }

  .options {
    max-height: 300px;
    overflow: auto;
  }
  .item {
    margin: 4px 0;
    padding: 0 8px;
    word-wrap: break-word;
    word-break: break-all;
    &:nth-child(odd) {
      background: var(--table-tr-odd-bg);
    }
    &:nth-child(even) {
      background: var(--table-tr-even-bg);
    }

    .label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      line-height: 32px;
    }

    .description {
      font-size: 12px;
      line-height: 22px;
      opacity: 0.7;
    }
  }
}
</style>
