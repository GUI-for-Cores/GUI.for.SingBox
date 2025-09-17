<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  options: { label: string; value: string }[]
  border?: boolean
  size?: 'default' | 'small'
  placeholder?: string
  autoSize?: boolean
  clearable?: boolean
}

const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  border: true,
  size: 'default',
  autoSize: false,
  clearable: false,
})

const emits = defineEmits(['change'])

const { t } = useI18n()

const displayLabel = computed(() => {
  const label = props.options.find((v) => v.value === model.value)?.label
  if (label !== '' && label !== undefined) {
    return label
  }
  return (model.value || props.placeholder) ?? 'common.none'
})

const handleClear = () => {
  model.value = ''
}
</script>

<template>
  <Dropdown :trigger="['click']">
    <template #default="{ toggle }">
      <div
        :class="{ border, [size]: true, 'auto-size': autoSize }"
        class="gui-select cursor-pointer min-h-30 inline-flex items-center min-w-128 rounded-4 px-8"
      >
        <span class="line-clamp-1 break-all">
          {{ t(displayLabel) }}
        </span>
        <Button
          :icon="clearable && model ? 'close' : 'arrowDown'"
          @click.stop="() => (clearable && model ? handleClear() : toggle())"
          type="text"
          size="small"
          class="ml-auto"
          style="margin-right: -6px"
        />
      </div>
    </template>

    <template #overlay="{ close }">
      <div class="flex flex-col gap-4 min-w-64 p-4">
        <Button
          v-for="o in options"
          :key="o.value"
          @click="
            () => {
              model = o.value
              close()
              emits('change', o.value)
            }
          "
          type="text"
        >
          {{ t(o.label) }}
        </Button>
      </div>
    </template>
  </Dropdown>
</template>

<style lang="less" scoped>
.gui-select {
  background: var(--select-bg);
}

.auto-size {
  width: 100%;
}

.border {
  border: 1px solid var(--primary-color);
}

.small {
  font-size: 12px;
}
</style>
