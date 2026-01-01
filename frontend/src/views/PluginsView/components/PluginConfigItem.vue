<script lang="ts" setup>
import { ref, watch } from 'vue'

import { deepClone, message } from '@/utils'

import type { Plugin } from '@/types/app'

interface Props {
  plugin: Plugin
  modelValue?: Recordable
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
})

const emit = defineEmits(['change', 'update:modelValue'])

const model = ref(deepClone(props.modelValue ?? {}))

let internalUpdate = false

watch(
  () => props.modelValue,
  (val) => {
    if (!internalUpdate) {
      model.value = val
    }
    internalUpdate = false
  },
  { deep: true },
)

const getOptions = (val: string[]) => {
  return val.map((v) => {
    const arr = v.split(',')
    return { label: arr[0], value: arr[1] || arr[0] }
  })
}

const emitUpdate = () => {
  const val = deepClone(model.value)
  emit('update:modelValue', val)
  emit('change', val)
  internalUpdate = true
}

const onChange = (key: string, originalValue: any, value: any) => {
  // TODO: array order
  if (JSON.stringify(originalValue) === JSON.stringify(value)) {
    delete model.value[key]
  } else {
    model.value[key] = value
  }
  emitUpdate()
}

const handleReset = (key: string) => {
  delete model.value[key]
  emitUpdate()
}

const handleResetAll = () => {
  model.value = {}
  emitUpdate()
  message.success('common.success')
}

defineExpose({ reset: handleResetAll })
</script>

<template>
  <div class="flex flex-col gap-8 pr-8">
    <slot name="header" v-bind="{ handleResetAll }"></slot>
    <Card
      v-for="(conf, index) in plugin.configuration"
      :key="conf.id"
      :title="`${index + 1}. ${conf.title}`"
      :class="{ warn: model[conf.key] !== undefined }"
      class="card"
    >
      <template v-if="model[conf.key] !== undefined" #extra>
        <Button
          v-tips="'settings.plugin.resetSetting'"
          :icon-size="12"
          icon="clear"
          type="text"
          size="small"
          @click="handleReset(conf.key)"
        />
      </template>
      <div class="mb-8 text-12">{{ conf.description }}</div>
      <Component
        :is="conf.component"
        :model-value="model[conf.key] ?? conf.value"
        :options="getOptions(conf.options)"
        :autofocus="false"
        editable
        lang="yaml"
        @change="(val: any) => onChange(conf.key, conf.value, val)"
      />
    </Card>
  </div>
</template>

<style scoped>
.card {
  border-left: 2px solid transparent;
}
.warn {
  border-left: 2px solid var(--primary-color);
}
</style>
