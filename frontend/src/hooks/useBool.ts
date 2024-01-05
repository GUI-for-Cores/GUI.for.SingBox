import { ref, type Ref } from 'vue'

export const useBool = (initialValue: boolean): [Ref<boolean>, () => void] => {
  const value = ref(initialValue)

  const toggle = () => {
    value.value = !value.value
  }

  return [value, toggle]
}
