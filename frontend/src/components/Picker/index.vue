<script setup lang="ts">
import { ref } from 'vue'

import useI18n from '@/lang'

export type PickerItem = {
  label: string
  value: string
  description?: string
  background?: string
  onSelect?: (args: {
    value: PickerItem['value']
    option: PickerItem
    options: PickerItem[]
    selected: PickerItem['value'][]
  }) => void
}

interface Props {
  type: 'single' | 'multi'
  title: string
  options: PickerItem[]
  initialValue?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  initialValue: () => [],
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

const handleSelect = (option: PickerItem) => {
  if (isSelected(option.value)) {
    selected.value.delete(option.value)
  } else {
    if (props.type === 'single') selected.value.clear()
    selected.value.add(option.value)
    option.onSelect?.({
      value: option.value,
      option,
      options: props.options,
      selected: [...selected.value],
    })
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
    <div class="gui-picker flex flex-col p-8 shadow rounded-8">
      <div class="font-bold px-4 py-8">{{ t(title) }}</div>

      <div class="flex-1 overflow-auto">
        <div
          v-for="(o, i) in options"
          :key="i"
          @click="handleSelect(o)"
          :style="{ background: o.background }"
          class="item my-4 px-8 break-all"
        >
          <div class="flex items-center justify-between leading-relaxed">
            <div>{{ t(o.label) }}</div>
            <Icon
              v-show="isSelected(o.value)"
              :size="32"
              icon="selected"
              fill="var(--primary-color)"
              class="shrink-0"
            />
          </div>
          <div class="text-12 leading-relaxed" style="opacity: 0.7">{{ o.description }}</div>
        </div>
      </div>

      <div class="form-action gap-4">
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
.gui-picker {
  min-width: 340px;
  max-width: 60%;
  background: var(--toast-bg);

  .item {
    &:nth-child(odd) {
      background: var(--table-tr-odd-bg);
    }
    &:nth-child(even) {
      background: var(--table-tr-even-bg);
    }
  }
}
</style>
