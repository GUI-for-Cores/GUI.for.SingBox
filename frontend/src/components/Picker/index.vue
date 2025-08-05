<script setup lang="ts" generic="ValueType = any, PickerType extends 'single' | 'multi' = 'single'">
import { ref, toRaw, type Ref } from 'vue'

import useI18n from '@/lang'

export type PickerItem<T> = {
  label: string
  value: T
  description?: string
  background?: string
  onSelect?: (args: {
    value: PickerItem<T>['value']
    option: PickerItem<T>
    options: PickerItem<T>[]
    selected: PickerItem<T>['value'][]
  }) => void
}

interface Props<T, K> {
  type: K
  title: string
  options: PickerItem<T>[]
  initialValue?: T[]
}

const props = withDefaults(defineProps<Props<ValueType, PickerType>>(), {
  options: () => [],
  initialValue: () => [],
})

const emit = defineEmits<{
  confirm: [val: PickerType extends 'single' ? ValueType : ValueType[]]
  cancel: []
  finish: []
}>()

const selected = ref(
  new Set(
    props.initialValue.filter((v) => props.options.find((o) => o.value === v)).map((v) => toRaw(v)),
  ),
) as Ref<Set<ValueType>>

const { t } = useI18n.global

const handleConfirm = () => {
  const res: any = Array.from(selected.value).map((v) => toRaw(v))
  if (props.type === 'single') {
    emit('confirm', res[0])
  } else {
    emit('confirm', res)
  }
  emit('finish')
}

const handleCancel = () => {
  emit('cancel')
  emit('finish')
}

const isSelected = (option: ValueType) => selected.value.has(option)

const handleSelect = (option: PickerItem<ValueType>) => {
  if (isSelected(option.value)) {
    selected.value.delete(option.value)
  } else {
    if (props.type === 'single') selected.value.clear()
    selected.value.add(option.value)
    option.onSelect?.({
      value: option.value,
      option,
      options: props.options,
      selected: Array.from(selected.value).map((v) => toRaw(v)),
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
          class="item my-4 py-8 px-8 break-all"
        >
          <div class="flex items-center justify-between leading-relaxed">
            <div class="font-bold">{{ t(o.label) }}</div>
            <Icon
              v-show="isSelected(o.value)"
              :size="26"
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
