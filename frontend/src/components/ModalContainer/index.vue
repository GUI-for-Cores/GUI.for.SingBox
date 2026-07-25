<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    empty?: boolean
    scrollable?: boolean
  }>(),
  {
    empty: false,
    scrollable: true,
  },
)
</script>

<template>
  <div class="h-full flex flex-col">
    <div v-if="$slots.top" class="p-8 top-0">
      <slot name="top"></slot>
    </div>
    <slot v-if="props.empty" name="empty">
      <Empty />
    </slot>
    <ScrollView v-else-if="props.scrollable" :pt="0" :pr="16" :pb="16" :pl="16">
      <slot name="body"></slot>
    </ScrollView>
    <div v-else class="flex-1 overflow-hidden px-16 pb-16">
      <slot name="body"></slot>
    </div>
  </div>
</template>
