<script setup>
/**
 * AccountSettings Component
 * Feature: 001-user-config - User Story 3 (Account Deletion)
 *
 * Wrapper component for AccountManagement.
 * Provides account security and deletion functionality.
 *
 * @component
 * @emits changes - Emitted when form has unsaved changes
 * @emits saved - Emitted when changes are saved successfully
 */
import AccountManagement from './AccountManagement.vue'

const emit = defineEmits(['changes', 'saved'])

// Pass through events from AccountManagement
const handleChanges = (changed) => {
  emit('changes', changed)
}

const handleSaved = () => {
  emit('saved')
}
</script>

<template>
  <AccountManagement @changes="handleChanges" @saved="handleSaved" />
</template>

<style scoped>
@reference "tailwindcss";
</style>
