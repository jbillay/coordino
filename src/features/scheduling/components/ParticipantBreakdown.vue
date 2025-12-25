<script setup>
import Card from 'primevue/card'

defineProps({
  breakdown: {
    type: Object,
    default: null
  }
})
</script>

<template>
  <Card class="h-full">
    <template #title>
      <span>Participant Breakdown</span>
    </template>

    <template #content>
      <div v-if="breakdown" class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div class="flex items-center space-x-2">
            <i class="pi pi-check-circle text-green-600"></i>
            <span class="font-medium">Optimal</span>
          </div>
          <span class="font-bold text-green-600">{{ breakdown.green_count }}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div class="flex items-center space-x-2">
            <i class="pi pi-exclamation-circle text-orange-600"></i>
            <span class="font-medium">Acceptable</span>
          </div>
          <span class="font-bold text-orange-600">{{ breakdown.orange_count }}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div class="flex items-center space-x-2">
            <i class="pi pi-times-circle text-red-600"></i>
            <span class="font-medium">Poor</span>
          </div>
          <span class="font-bold text-red-600">{{ breakdown.red_count }}</span>
        </div>

        <div
          v-if="breakdown.critical_count > 0"
          class="flex items-center justify-between p-3 bg-red-100 rounded-lg border-2 border-red-300"
        >
          <div class="flex items-center space-x-2">
            <i class="pi pi-ban text-red-700"></i>
            <span class="font-medium">Critical Conflicts</span>
          </div>
          <span class="font-bold text-red-700">{{ breakdown.critical_count }}</span>
        </div>
      </div>

      <div v-else class="text-center text-gray-500 py-8">
        <i class="pi pi-users text-4xl mb-3"></i>
        <p>Add participants to see breakdown</p>
      </div>
    </template>
  </Card>
</template>
