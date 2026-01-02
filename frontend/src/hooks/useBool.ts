import { ref } from 'vue'

export const useBool = (initialValue: boolean) => {
  const value = ref(initialValue)

  const toggle = () => {
    value.value = !value.value
  }

  return [value, toggle] as const
}
