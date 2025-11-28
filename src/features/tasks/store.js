/**
 * Task Store
 * Manages task state, statuses, categories, and all CRUD operations
 *
 * @module features/tasks/store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'

/**
 * Task management store
 * Provides comprehensive task functionality including CRUD operations,
 * custom statuses/categories, filtering, and real-time updates
 *
 * @example
 * const taskStore = useTaskStore()
 * await taskStore.initialize()
 * const task = await taskStore.createTask({ title: 'New Task', status_id: statusId })
 */
export const useTaskStore = defineStore('tasks', () => {
  const { supabase } = useSupabase()
  const authStore = useAuthStore()

  // State
  const tasks = ref([])
  const statuses = ref([])
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Pagination state
  const pageSize = ref(50) // Tasks per page
  const currentPage = ref(1)
  const totalTasks = ref(0)
  const hasMore = ref(true)

  // Real-time subscription
  let taskSubscription = null

  /**
   * Active tasks (not completed)
   * @type {import('vue').ComputedRef<Array>}
   */
  const activeTasks = computed(() =>
    tasks.value.filter(task => !task.completed_at)
  )

  /**
   * Completed tasks
   * @type {import('vue').ComputedRef<Array>}
   */
  const completedTasks = computed(() =>
    tasks.value.filter(task => task.completed_at)
  )

  /**
   * Get default 'Open' status
   * @type {import('vue').ComputedRef<Object|undefined>}
   */
  const defaultStatus = computed(() =>
    statuses.value.find(s => s.name === 'Open' && s.is_default)
  )

  /**
   * Fetch tasks for current user with pagination
   * Includes related status and category data
   * @param {number} page - Page number (1-indexed)
   * @param {boolean} append - Whether to append to existing tasks or replace
   * @returns {Promise<void>}
   */
  const fetchTasks = async (page = 1, append = false) => {
    loading.value = true
    error.value = null

    try {
      // Calculate range for pagination
      const from = (page - 1) * pageSize.value
      const to = from + pageSize.value - 1

      // Fetch tasks with count
      const { data, error: fetchError, count } = await supabase
        .from('tasks')
        .select(`
          *,
          status:task_statuses(id, name, color),
          category:task_categories(id, name, color)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      totalTasks.value = count || 0
      currentPage.value = page
      hasMore.value = to < (count || 0) - 1

      if (append) {
        tasks.value = [...tasks.value, ...(data || [])]
      } else {
        tasks.value = data || []
      }
    } catch (e) {
      error.value = e.message
      console.error('Error fetching tasks:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load more tasks (next page)
   * @returns {Promise<void>}
   */
  const loadMoreTasks = async () => {
    if (!hasMore.value || loading.value) return
    await fetchTasks(currentPage.value + 1, true)
  }

  /**
   * Reset pagination and fetch first page
   * @returns {Promise<void>}
   */
  const resetPagination = async () => {
    currentPage.value = 1
    hasMore.value = true
    await fetchTasks(1, false)
  }

  /**
   * Fetch available statuses (default + user custom)
   * @returns {Promise<void>}
   */
  const fetchStatuses = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('task_statuses')
        .select('*')
        .order('display_order')

      if (fetchError) throw fetchError

      statuses.value = data || []
    } catch (e) {
      console.error('Error fetching statuses:', e)
    }
  }

  /**
   * Fetch user's custom categories
   * @returns {Promise<void>}
   */
  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('task_categories')
        .select('*')
        .order('display_order')

      if (fetchError) throw fetchError

      categories.value = data || []
    } catch (e) {
      console.error('Error fetching categories:', e)
    }
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data to create
   * @param {string} taskData.title - Task title (required)
   * @param {string} taskData.description - Task description
   * @param {string} taskData.status_id - Status ID (required)
   * @param {string} taskData.category_id - Category ID
   * @param {string} taskData.priority - Priority level
   * @param {string} taskData.owner - Task owner
   * @param {string} taskData.due_date - Due date (YYYY-MM-DD format)
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createTask = async (taskData) => {
    try {
      const { data, error: createError } = await supabase
        .from('tasks')
        .insert({
          user_id: authStore.user.id,
          ...taskData
        })
        .select(`
          *,
          status:task_statuses(id, name, color),
          category:task_categories(id, name, color)
        `)
        .single()

      if (createError) throw createError

      tasks.value.unshift(data)
      return { success: true, data }
    } catch (e) {
      console.error('Error creating task:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Update an existing task
   * @param {string} taskId - Task ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateTask = async (taskId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select(`
          *,
          status:task_statuses(id, name, color),
          category:task_categories(id, name, color)
        `)
        .single()

      if (updateError) throw updateError

      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = data
      }

      return { success: true, data }
    } catch (e) {
      console.error('Error updating task:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Mark task as complete
   * @param {string} taskId - Task ID to complete
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const completeTask = async (taskId) => {
    return updateTask(taskId, { completed_at: new Date().toISOString() })
  }

  /**
   * Mark task as incomplete (reopen)
   * @param {string} taskId - Task ID to reopen
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const reopenTask = async (taskId) => {
    return updateTask(taskId, { completed_at: null })
  }

  /**
   * Delete a task
   * @param {string} taskId - Task ID to delete
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteTask = async (taskId) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (deleteError) throw deleteError

      tasks.value = tasks.value.filter(t => t.id !== taskId)
      return { success: true }
    } catch (e) {
      console.error('Error deleting task:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Create a custom status
   * @param {Object} statusData - Status data
   * @param {string} statusData.name - Status name
   * @param {string} statusData.color - Hex color code
   * @param {number} statusData.display_order - Display order
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createStatus = async (statusData) => {
    try {
      const { data, error: createError } = await supabase
        .from('task_statuses')
        .insert({
          user_id: authStore.user.id,
          is_default: false,
          ...statusData
        })
        .select()
        .single()

      if (createError) throw createError

      statuses.value.push(data)
      return { success: true, data }
    } catch (e) {
      console.error('Error creating status:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Update a custom status
   * @param {string} statusId - Status ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateStatus = async (statusId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('task_statuses')
        .update(updates)
        .eq('id', statusId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = statuses.value.findIndex(s => s.id === statusId)
      if (index !== -1) {
        statuses.value[index] = data
      }

      return { success: true, data }
    } catch (e) {
      console.error('Error updating status:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Delete a custom status
   * @param {string} statusId - Status ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteStatus = async (statusId) => {
    try {
      const { error: deleteError } = await supabase
        .from('task_statuses')
        .delete()
        .eq('id', statusId)

      if (deleteError) throw deleteError

      statuses.value = statuses.value.filter(s => s.id !== statusId)
      return { success: true }
    } catch (e) {
      console.error('Error deleting status:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Create a category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.color - Hex color code
   * @param {number} categoryData.display_order - Display order
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createCategory = async (categoryData) => {
    try {
      const { data, error: createError } = await supabase
        .from('task_categories')
        .insert({
          user_id: authStore.user.id,
          ...categoryData
        })
        .select()
        .single()

      if (createError) throw createError

      categories.value.push(data)
      return { success: true, data }
    } catch (e) {
      console.error('Error creating category:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateCategory = async (categoryId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('task_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = categories.value.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        categories.value[index] = data
      }

      return { success: true, data }
    } catch (e) {
      console.error('Error updating category:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteCategory = async (categoryId) => {
    try {
      const { error: deleteError } = await supabase
        .from('task_categories')
        .delete()
        .eq('id', categoryId)

      if (deleteError) throw deleteError

      categories.value = categories.value.filter(c => c.id !== categoryId)
      return { success: true }
    } catch (e) {
      console.error('Error deleting category:', e)
      return { success: false, error: e.message }
    }
  }

  /**
   * Subscribe to real-time task updates
   * Sets up Supabase real-time subscription for INSERT, UPDATE, DELETE events
   * @returns {void}
   */
  const subscribeToTasks = () => {
    if (taskSubscription) return // Already subscribed

    taskSubscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // All events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${authStore.user.id}`
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          switch (eventType) {
            case 'INSERT': {
              // Fetch the new task with related data
              const { data } = await supabase
                .from('tasks')
                .select(`
                  *,
                  status:task_statuses(id, name, color),
                  category:task_categories(id, name, color)
                `)
                .eq('id', newRecord.id)
                .single()

              if (data) {
                // Add to beginning of list
                tasks.value.unshift(data)
                totalTasks.value += 1
              }
              break
            }

            case 'UPDATE': {
              // Fetch the updated task with related data
              const { data } = await supabase
                .from('tasks')
                .select(`
                  *,
                  status:task_statuses(id, name, color),
                  category:task_categories(id, name, color)
                `)
                .eq('id', newRecord.id)
                .single()

              if (data) {
                const index = tasks.value.findIndex(t => t.id === newRecord.id)
                if (index !== -1) {
                  tasks.value[index] = data
                }
              }
              break
            }

            case 'DELETE': {
              // Remove from list
              tasks.value = tasks.value.filter(t => t.id !== oldRecord.id)
              totalTasks.value = Math.max(0, totalTasks.value - 1)
              break
            }
          }
        }
      )
      .subscribe()
  }

  /**
   * Unsubscribe from real-time updates
   * @returns {Promise<void>}
   */
  const unsubscribeFromTasks = async () => {
    if (taskSubscription) {
      await supabase.removeChannel(taskSubscription)
      taskSubscription = null
    }
  }

  /**
   * Initialize store by fetching all task-related data and setting up real-time subscriptions
   * @returns {Promise<void>}
   */
  const initialize = async () => {
    await Promise.all([
      fetchTasks(),
      fetchStatuses(),
      fetchCategories()
    ])

    // Set up real-time subscriptions
    subscribeToTasks()
  }

  /**
   * Clear all store data and unsubscribe from real-time updates
   * @returns {Promise<void>}
   */
  const clearStore = async () => {
    await unsubscribeFromTasks()
    tasks.value = []
    statuses.value = []
    categories.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    tasks,
    statuses,
    categories,
    loading,
    error,

    // Pagination state
    pageSize,
    currentPage,
    totalTasks,
    hasMore,

    // Computed
    activeTasks,
    completedTasks,
    defaultStatus,

    // Task operations
    fetchTasks,
    loadMoreTasks,
    resetPagination,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    deleteTask,

    // Status operations
    fetchStatuses,
    createStatus,
    updateStatus,
    deleteStatus,

    // Category operations
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Utilities
    initialize,
    clearStore,
    subscribeToTasks,
    unsubscribeFromTasks
  }
})
