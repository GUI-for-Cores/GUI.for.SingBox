<script setup lang="ts">
import { computed, ref } from 'vue'

const switchState = ref(false)
const selectState = ref('two')

const list = ref(['one', 'two', 'three'])

const options = computed(() => list.value.map((v) => ({ label: v, value: v })))
</script>

<template>
  <div>
    <div class="row">
      <Button type="primary">Primary Button</Button>
      <Button type="normal">Default Button</Button>
      <Button type="primary" size="small">Small Button</Button>
    </div>

    <div class="row">
      <Button type="normal" size="large">Large Button</Button>
      <Button loading type="link">Link Button</Button>
      <Button loading type="text">Text Button</Button>
    </div>

    <div class="row">
      <Switch v-model="switchState" />
      <Button loading type="primary">Loading</Button>
      <Radio v-model="selectState" :options="options" />
      <Select v-model="selectState" :options="options" />
    </div>

    <InputList v-model="list" />
  </div>
</template>

<style lang="less" scoped>
.row {
  display: flex;
  align-items: center;
}
</style>
