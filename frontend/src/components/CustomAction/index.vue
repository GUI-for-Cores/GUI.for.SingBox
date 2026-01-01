<script lang="ts" setup>
import { computed, h, isVNode, ref, resolveComponent, watch } from 'vue'

import type { CustomAction, CustomActionFn, CustomActionApi } from '@/types/app'

interface Props {
  actions: (CustomAction | CustomActionFn)[]
}

const props = defineProps<Props>()

const resolvedActionMap = ref(new Map<string, CustomAction>())
const api: CustomActionApi = {
  h: (type: any, ...args: any[]) => h(resolveComponent(type), ...args),
  ref,
}

const computedActions = computed(() => Array.from(resolvedActionMap.value.values()))

const resolveDynamicField = <T,>(field: T): T => (typeof field === 'function' ? field(api) : field)

const renderCustomActionSlot = (slot: CustomAction['componentSlots']) => {
  const resolved = resolveDynamicField(slot ?? {})
  return isVNode(resolved) ? resolved : h('div', resolved)
}

watch(
  () => props.actions,
  (actions) => {
    const newMap = new Map<string, CustomAction>()
    for (const action of actions) {
      const id = action.id!
      if (resolvedActionMap.value.has(id)) {
        newMap.set(id, resolvedActionMap.value.get(id)!)
      } else {
        newMap.set(id, typeof action === 'function' ? action(api) : action)
      }
    }
    resolvedActionMap.value = newMap
  },
  { immediate: true, deep: true },
)
</script>
<template>
  <component
    :is="action.component"
    v-for="action in computedActions"
    :key="action.id"
    v-memo="action.id"
    v-bind="resolveDynamicField(action.componentProps)"
  >
    <template
      v-for="[name, slot] in Object.entries(resolveDynamicField(action.componentSlots ?? {}))"
      :key="name"
      #[name]
    >
      <component :is="renderCustomActionSlot(slot)" />
    </template>
  </component>
</template>
