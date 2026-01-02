import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { sanitizeHTML } from './utils'
import { logger } from '@/utils/logger'
import { NOTE_ERRORS } from '@/utils/errors'

export const useNotesStore = defineStore('notes', () => {
  const { supabase } = useSupabase()
  const authStore = useAuthStore()

  // State
  const topics = ref([])
  const notes = ref([])
  const selectedTopicId = ref(null)
  const searchQuery = ref('')
  const showArchived = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Real-time subscription channels
  let topicsChannel = null
  let notesChannel = null

  // Computed Properties
  const selectedTopic = computed(() => {
    if (selectedTopicId.value === null) {
      return null
    }
    return topics.value.find((t) => t.id === selectedTopicId.value)
  })

  const filteredNotes = computed(() => {
    let filtered = notes.value

    // Filter by topic
    if (selectedTopicId.value) {
      filtered = filtered.filter((n) => n.topic_id === selectedTopicId.value)
    }

    // Filter archived
    if (!showArchived.value) {
      filtered = filtered.filter((n) => !n.archived_at)
    }

    // Sort: pinned first, then by updated_at
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) {
        return -1
      }
      if (!a.is_pinned && b.is_pinned) {
        return 1
      }
      return new Date(b.updated_at) - new Date(a.updated_at)
    })

    return filtered
  })

  const pinnedNotes = computed(() =>
    notes.value
      .filter((n) => n.is_pinned && !n.archived_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
  )

  const recentNotes = computed(() =>
    notes.value
      .filter((n) => !n.archived_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
  )

  const activeNotesCount = computed(() => notes.value.filter((n) => !n.archived_at).length)

  // Topic Actions
  const fetchTopics = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('topics')
        .select('*, notes(id)')
        .order('display_order', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Add note count to each topic
      topics.value = data.map((topic) => ({
        ...topic,
        note_count: topic.notes?.length || 0,
        notes: undefined // Remove the notes array
      }))
    } catch (e) {
      // Check for specific error types
      if (e.message?.toLowerCase().includes('network')) {
        error.value = NOTE_ERRORS.FETCH_NETWORK_ERROR
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        error.value = NOTE_ERRORS.FETCH_PERMISSION_DENIED
      } else {
        error.value = NOTE_ERRORS.FETCH_TOPIC_FAILED
      }
      logger.error('Error fetching topics:', e)
    } finally {
      loading.value = false
    }
  }

  const createTopic = async (topicData) => {
    try {
      // Get the max display_order
      const maxOrder = topics.value.reduce((max, t) => Math.max(max, t.display_order || 0), 0)

      const { data, error: createError } = await supabase
        .from('topics')
        .insert({
          user_id: authStore.user.id,
          display_order: maxOrder + 1,
          ...topicData
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      topics.value.push({ ...data, note_count: 0 })
      return { success: true, data }
    } catch (e) {
      logger.error('Error creating topic:', e)

      // Check for specific error codes and conditions
      if (e.code === '23505') {
        // Unique violation - duplicate name
        return { success: false, error: NOTE_ERRORS.TOPIC_CREATE_DUPLICATE }
      } else if (e.code === '23502') {
        // Not null violation
        if (e.message?.includes('name')) {
          return { success: false, error: NOTE_ERRORS.TOPIC_CREATE_MISSING_NAME }
        }
      } else if (e.message?.toLowerCase().includes('network')) {
        return { success: false, error: NOTE_ERRORS.NETWORK_ERROR }
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        return { success: false, error: NOTE_ERRORS.CREATE_PERMISSION_DENIED }
      }

      // Fallback to generic error
      return { success: false, error: NOTE_ERRORS.TOPIC_CREATE_FAILED }
    }
  }

  const updateTopic = async (topicId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', topicId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const index = topics.value.findIndex((t) => t.id === topicId)
      if (index !== -1) {
        topics.value[index] = { ...topics.value[index], ...data }
      }

      return { success: true, data }
    } catch (e) {
      logger.error('Error updating topic:', e)

      // Check for specific error codes and conditions
      if (e.code === 'PGRST116') {
        // Result contains 0 rows - topic not found
        return { success: false, error: NOTE_ERRORS.TOPIC_UPDATE_NOT_FOUND }
      } else if (e.code === '23505') {
        // Unique violation - duplicate name
        return { success: false, error: NOTE_ERRORS.TOPIC_UPDATE_DUPLICATE }
      } else if (e.code === '23502') {
        // Not null violation
        if (e.message?.includes('name')) {
          return { success: false, error: NOTE_ERRORS.TOPIC_UPDATE_MISSING_NAME }
        }
      } else if (e.message?.toLowerCase().includes('network')) {
        return { success: false, error: NOTE_ERRORS.NETWORK_ERROR }
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        return { success: false, error: NOTE_ERRORS.UPDATE_PERMISSION_DENIED }
      }

      // Fallback to generic error
      return { success: false, error: NOTE_ERRORS.TOPIC_UPDATE_FAILED }
    }
  }

  const deleteTopic = async (topicId) => {
    try {
      const { error: deleteError } = await supabase.from('topics').delete().eq('id', topicId)

      if (deleteError) {
        throw deleteError
      }

      topics.value = topics.value.filter((t) => t.id !== topicId)
      notes.value = notes.value.filter((n) => n.topic_id !== topicId)

      if (selectedTopicId.value === topicId) {
        selectedTopicId.value = null
      }

      return { success: true }
    } catch (e) {
      logger.error('Error deleting topic:', e)

      // Check for specific error conditions
      if (e.code === 'PGRST116') {
        // Result contains 0 rows - topic not found
        return { success: false, error: NOTE_ERRORS.TOPIC_DELETE_NOT_FOUND }
      } else if (e.code === '23503') {
        // Foreign key violation - has notes
        return { success: false, error: NOTE_ERRORS.TOPIC_DELETE_HAS_NOTES }
      } else if (e.message?.toLowerCase().includes('network')) {
        return { success: false, error: NOTE_ERRORS.NETWORK_ERROR }
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        return { success: false, error: NOTE_ERRORS.DELETE_PERMISSION_DENIED }
      }

      // Fallback to generic error
      return { success: false, error: NOTE_ERRORS.TOPIC_DELETE_FAILED }
    }
  }

  const reorderTopics = async (newOrder) => {
    try {
      // Update display_order for all topics
      const updates = newOrder.map((topic, index) => ({
        id: topic.id,
        display_order: index
      }))

      // Batch update in database using PostgreSQL function (FR-032)
      // This reduces multiple database calls to a single RPC call
      const { error: rpcError } = await supabase.rpc('batch_update_topic_order', {
        topic_updates: updates
      })

      if (rpcError) {
        throw rpcError
      }

      // Update local state
      topics.value = newOrder

      return { success: true }
    } catch {
      return { success: false, error: NOTE_ERRORS.TOPIC_UPDATE_FAILED }
    }
  }

  // Note Actions
  const fetchNotes = async (topicId = null) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('notes')
        .select(
          `
          *,
          topic:topics(id, name, color)
        `
        )
        .order('updated_at', { ascending: false })

      if (topicId) {
        query = query.eq('topic_id', topicId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      notes.value = data
    } catch (e) {
      // Check for specific error types
      if (e.message?.toLowerCase().includes('network')) {
        error.value = NOTE_ERRORS.FETCH_NETWORK_ERROR
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        error.value = NOTE_ERRORS.FETCH_PERMISSION_DENIED
      } else {
        error.value = NOTE_ERRORS.FETCH_NOTE_FAILED
      }
      logger.error('Error fetching notes:', e)
    } finally {
      loading.value = false
    }
  }

  const createNote = async (noteData) => {
    try {
      // Sanitize HTML content before storing to prevent XSS
      const sanitizedData = {
        ...noteData,
        content: noteData.content ? sanitizeHTML(noteData.content) : ''
      }

      const { data, error: createError } = await supabase
        .from('notes')
        .insert({
          user_id: authStore.user.id,
          ...sanitizedData
        })
        .select(
          `
          *,
          topic:topics(id, name, color)
        `
        )
        .single()

      if (createError) {
        throw createError
      }

      notes.value.unshift(data)

      // Update topic note count
      const topic = topics.value.find((t) => t.id === data.topic_id)
      if (topic) {
        topic.note_count++
      }

      return { success: true, data }
    } catch (e) {
      logger.error('Error creating note:', e)

      // Check for specific error codes and conditions
      if (e.code === '23502') {
        // Not null violation
        if (e.message?.includes('topic_id')) {
          return { success: false, error: NOTE_ERRORS.CREATE_MISSING_TOPIC }
        } else if (e.message?.includes('title')) {
          return { success: false, error: NOTE_ERRORS.CREATE_MISSING_TITLE }
        } else if (e.message?.includes('content')) {
          return { success: false, error: NOTE_ERRORS.CREATE_MISSING_CONTENT }
        }
      } else if (e.code === '23503') {
        // Foreign key violation - invalid topic
        if (e.message?.includes('topic')) {
          return { success: false, error: NOTE_ERRORS.CREATE_INVALID_TOPIC }
        }
      } else if (e.message?.toLowerCase().includes('network')) {
        return { success: false, error: NOTE_ERRORS.NETWORK_ERROR }
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        return { success: false, error: NOTE_ERRORS.CREATE_PERMISSION_DENIED }
      }

      // Fallback to generic error
      return { success: false, error: NOTE_ERRORS.CREATE_FAILED }
    }
  }

  const updateNote = async (noteId, updates) => {
    try {
      // Sanitize HTML content before storing to prevent XSS
      const sanitizedUpdates = {
        ...updates
      }

      if (updates.content) {
        sanitizedUpdates.content = sanitizeHTML(updates.content)
      }

      const { data, error: updateError } = await supabase
        .from('notes')
        .update(sanitizedUpdates)
        .eq('id', noteId)
        .select(
          `
          *,
          topic:topics(id, name, color)
        `
        )
        .single()

      if (updateError) {
        throw updateError
      }

      const index = notes.value.findIndex((n) => n.id === noteId)
      if (index !== -1) {
        notes.value[index] = data
      }

      return { success: true, data }
    } catch (e) {
      logger.error('Error updating note:', e)

      // Check for specific error codes and conditions
      if (e.code === 'PGRST116') {
        // Result contains 0 rows - note not found
        return { success: false, error: NOTE_ERRORS.UPDATE_NOT_FOUND }
      } else if (e.code === '23502') {
        // Not null violation
        if (e.message?.includes('content')) {
          return { success: false, error: NOTE_ERRORS.UPDATE_MISSING_CONTENT }
        }
      } else if (e.code === '23503') {
        // Foreign key violation - invalid topic
        if (e.message?.includes('topic')) {
          return { success: false, error: NOTE_ERRORS.UPDATE_INVALID_TOPIC }
        }
      } else if (e.message?.toLowerCase().includes('network')) {
        return { success: false, error: NOTE_ERRORS.NETWORK_ERROR }
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        return { success: false, error: NOTE_ERRORS.UPDATE_PERMISSION_DENIED }
      }

      // Fallback to generic error
      return { success: false, error: NOTE_ERRORS.UPDATE_FAILED }
    }
  }

  const deleteNote = async (noteId) => {
    try {
      const note = notes.value.find((n) => n.id === noteId)
      const topicId = note?.topic_id

      const { error: deleteError } = await supabase.from('notes').delete().eq('id', noteId)

      if (deleteError) {
        throw deleteError
      }

      notes.value = notes.value.filter((n) => n.id !== noteId)

      // Update topic note count
      if (topicId) {
        const topic = topics.value.find((t) => t.id === topicId)
        if (topic && topic.note_count > 0) {
          topic.note_count--
        }
      }

      return { success: true }
    } catch (e) {
      logger.error('Error deleting note:', e)

      // Check for specific error conditions
      if (e.code === 'PGRST116') {
        // Result contains 0 rows - note not found
        return { success: false, error: NOTE_ERRORS.DELETE_NOT_FOUND }
      } else if (e.message?.toLowerCase().includes('network')) {
        return { success: false, error: NOTE_ERRORS.NETWORK_ERROR }
      } else if (e.message?.toLowerCase().includes('permission denied')) {
        return { success: false, error: NOTE_ERRORS.DELETE_PERMISSION_DENIED }
      }

      // Fallback to generic error
      return { success: false, error: NOTE_ERRORS.DELETE_FAILED }
    }
  }

  // Pin/Archive Actions
  const togglePin = async (noteId) => {
    const note = notes.value.find((n) => n.id === noteId)
    if (!note) {
      return { success: false, error: NOTE_ERRORS.UPDATE_NOT_FOUND }
    }

    return updateNote(noteId, { is_pinned: !note.is_pinned })
  }

  const toggleArchive = async (noteId) => {
    const note = notes.value.find((n) => n.id === noteId)
    if (!note) {
      return { success: false, error: NOTE_ERRORS.UPDATE_NOT_FOUND }
    }

    const archived_at = note.archived_at ? null : new Date().toISOString()
    return updateNote(noteId, { archived_at })
  }

  // Search Action
  const searchNotes = async (query) => {
    if (!query || query.trim().length === 0) {
      return { success: true, data: [] }
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: searchError } = await supabase
        .from('notes')
        .select(
          `
          *,
          topic:topics(id, name, color)
        `
        )
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        })
        .is('archived_at', null)
        .limit(50)

      if (searchError) {
        throw searchError
      }

      return { success: true, data }
    } catch (e) {
      error.value = e.message
      logger.error('Error searching notes:', e)
      return { success: false, error: e.message, data: [] }
    } finally {
      loading.value = false
    }
  }

  // Real-time Subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!authStore.user) {
      return
    }

    // Topics subscription
    topicsChannel = supabase
      .channel('topics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          handleTopicChange(payload)
        }
      )
      .subscribe()

    // Notes subscription
    notesChannel = supabase
      .channel('notes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          handleNoteChange(payload)
        }
      )
      .subscribe()
  }

  const handleTopicChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        if (!topics.value.find((t) => t.id === newRecord.id)) {
          topics.value.push({ ...newRecord, note_count: 0 })
        }
        break

      case 'UPDATE': {
        const updateIndex = topics.value.findIndex((t) => t.id === newRecord.id)
        if (updateIndex !== -1) {
          topics.value[updateIndex] = { ...topics.value[updateIndex], ...newRecord }
        }
        break
      }

      case 'DELETE':
        topics.value = topics.value.filter((t) => t.id !== oldRecord.id)
        notes.value = notes.value.filter((n) => n.topic_id !== oldRecord.id)
        if (selectedTopicId.value === oldRecord.id) {
          selectedTopicId.value = null
        }
        break
    }
  }

  const handleNoteChange = async (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Helper function to attach topic info from local cache (FR-033)
    // Avoids N+1 query pattern by using locally cached topic data
    const attachTopicInfo = (note) => {
      if (!note.topic_id) {
        return note
      }

      const topic = topics.value.find((t) => t.id === note.topic_id)
      if (topic) {
        return {
          ...note,
          topic: {
            id: topic.id,
            name: topic.name,
            color: topic.color
          }
        }
      }

      return note
    }

    switch (eventType) {
      case 'INSERT':
        if (!notes.value.find((n) => n.id === newRecord.id)) {
          // Use local topic cache instead of database query (FR-033)
          const noteWithTopic = attachTopicInfo(newRecord)
          notes.value.unshift(noteWithTopic)

          // Update topic note count
          const topic = topics.value.find((t) => t.id === newRecord.topic_id)
          if (topic) {
            topic.note_count++
          }
        }
        break

      case 'UPDATE': {
        const updateIndex = notes.value.findIndex((n) => n.id === newRecord.id)
        if (updateIndex !== -1) {
          // Use local topic cache instead of database query (FR-033)
          const noteWithTopic = attachTopicInfo(newRecord)
          notes.value[updateIndex] = noteWithTopic
        }
        break
      }

      case 'DELETE': {
        const note = notes.value.find((n) => n.id === oldRecord.id)
        const topicId = note?.topic_id

        notes.value = notes.value.filter((n) => n.id !== oldRecord.id)

        // Update topic note count
        if (topicId) {
          const topic = topics.value.find((t) => t.id === topicId)
          if (topic && topic.note_count > 0) {
            topic.note_count--
          }
        }
        break
      }
    }
  }

  const cleanupRealtimeSubscriptions = () => {
    if (topicsChannel) {
      supabase.removeChannel(topicsChannel)
      topicsChannel = null
    }
    if (notesChannel) {
      supabase.removeChannel(notesChannel)
      notesChannel = null
    }
  }

  // Initialize - fetch all data
  const initialize = async () => {
    await Promise.all([fetchTopics(), fetchNotes()])
    setupRealtimeSubscriptions()
  }

  return {
    // State
    topics,
    notes,
    selectedTopicId,
    searchQuery,
    showArchived,
    loading,
    error,

    // Computed
    selectedTopic,
    filteredNotes,
    pinnedNotes,
    recentNotes,
    activeNotesCount,

    // Topic Actions
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,

    // Note Actions
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,

    // Pin/Archive
    togglePin,
    toggleArchive,

    // Search
    searchNotes,

    // Real-time
    setupRealtimeSubscriptions,
    cleanupRealtimeSubscriptions,
    handleTopicChange,
    handleNoteChange,

    // Initialize
    initialize
  }
})
