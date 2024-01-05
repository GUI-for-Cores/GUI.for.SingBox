<script lang="ts" setup>
import { ref } from 'vue'

import { GetInterfaces } from '@/utils/bridge'

interface Props {
  modelValue: string
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  border: true
})

const emits = defineEmits(['update:modelValue', 'change'])

const value = ref(props.modelValue)
const options = ref<any>([])

const onChange = (val: string) => {
  emits('update:modelValue', val)
  emits('change', val)
}

GetInterfaces().then((res) => {
  options.value = [
    {
      label: 'common.auto',
      value: 'Auto'
    },
    ...res.map((v) => ({ label: v, value: v }))
  ]
})
</script>

<template>
  <Select v-model="value" @change="onChange" :options="options" :border="border" />
</template>

<style lang="less" scoped></style>
