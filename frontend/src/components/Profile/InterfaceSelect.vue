<script lang="ts" setup>
import { ref } from 'vue'

import { GetInterfaces } from '@/bridge'

interface Props {
  border?: boolean
}

const model = defineModel<string>()

withDefaults(defineProps<Props>(), {
  border: true
})

const emits = defineEmits(['change'])

const options = ref<any>([])

const onChange = (val: string) => {
  emits('change', val)
}

GetInterfaces().then((res) => {
  options.value = [
    {
      label: 'common.auto',
      value: ''
    },
    ...res.map((v) => ({ label: v, value: v }))
  ]
})
</script>

<template>
  <Select v-model="model" @change="onChange" :options="options" :border="border" />
</template>

<style lang="less" scoped></style>
