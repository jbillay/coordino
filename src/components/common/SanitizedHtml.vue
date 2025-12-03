<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  html: {
    type: String,
    default: ''
  }
})

const contentRef = ref(null)

const setInnerHTML = () => {
  if (contentRef.value) {
    contentRef.value.innerHTML = props.html
  }
}

// Watch for changes in the html prop and update innerHTML
watch(() => props.html, setInnerHTML, { immediate: true })

// Set initial innerHTML when component is mounted
onMounted(setInnerHTML)
</script>

<template>
  <span ref="contentRef"></span>
</template>
