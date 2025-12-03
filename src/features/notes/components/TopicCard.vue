<script setup>
defineProps({
  topic: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select', 'edit', 'delete'])
</script>

<template>
  <div
    class="topic-card flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors"
    :class="{
      'bg-primary-50 dark:bg-primary-900/20 border-l-4': selected,
      'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent': !selected
    }"
    :style="{ borderLeftColor: selected ? topic.color : 'transparent' }"
    @click="$emit('select')"
  >
    <div class="flex items-center space-x-3 flex-1 min-w-0">
      <!-- Drag Handle -->
      <i
        class="pi pi-bars drag-handle text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
        @click.stop
      ></i>

      <!-- Color Indicator -->
      <div
        class="w-3 h-3 rounded-full flex-shrink-0"
        :style="{ backgroundColor: topic.color || '#6b7280' }"
      ></div>

      <!-- Topic Info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ topic.name }}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ topic.note_count || 0 }} notes</p>
      </div>
    </div>

    <!-- Actions Menu -->
    <div class="flex items-center space-x-1">
      <Button
        v-tooltip.bottom="'Edit topic'"
        icon="pi pi-pencil"
        class="p-button-rounded p-button-text p-button-sm"
        @click.stop="$emit('edit')"
      />
      <Button
        v-tooltip.bottom="'Delete topic'"
        icon="pi pi-trash"
        class="p-button-rounded p-button-text p-button-sm p-button-danger"
        @click.stop="$emit('delete')"
      />
    </div>
  </div>
</template>

<style scoped>
.topic-card {
  user-select: none;
}

.drag-handle {
  opacity: 0;
  transition: opacity 0.2s;
}

.topic-card:hover .drag-handle {
  opacity: 1;
}
</style>
