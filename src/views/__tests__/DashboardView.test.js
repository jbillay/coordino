import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/features/tasks/store'
import { useNotesStore } from '@/features/notes/store'
import { getTaskStats } from '@/features/tasks/utils'

// Mock the tasks utility
vi.mock('@/features/tasks/utils', () => ({
  getTaskStats: vi.fn(() => ({
    byPriority: { urgent: 1, high: 2 },
    overdue: 3
  }))
}))

// Mock the task store
vi.mock('@/features/tasks/store')

// Mock the notes store
vi.mock('@/features/notes/store')

const mockPush = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush
    })
  }
})

describe('DashboardView.vue', () => {
  let pinia
  let router

  // Comprehensive setup function
  const createWrapper = (authStoreState = {}, taskStoreState = {}, stubs = {}) => {
    pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: DashboardView },
        { path: '/tasks', name: 'tasks', component: { template: '<div>Tasks</div>' } },
        { path: '/notes', name: 'notes', component: { template: '<div>Notes</div>' } }
      ]
    })

    // Get stores and apply partial state
    const authStore = useAuthStore()
    vi.mocked(useTaskStore).mockReturnValue({
      tasks: [],
      activeTasks: [],
      loading: false,
      initialize: vi.fn(),
      unsubscribeFromTasks: vi.fn(),
      ...taskStoreState
    })

    vi.mocked(useNotesStore).mockReturnValue({
      notes: [],
      recentNotes: [],
      loading: false,
      fetchNotes: vi.fn(),
      unsubscribe: vi.fn()
    })

    Object.assign(authStore, {
      user: { email: 'test@example.com', user_metadata: {} },
      ...authStoreState
    })

    return mount(DashboardView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          ContinueSection: { template: '<div class="continue-section-stub"></div>' },
          TaskCard: { template: '<div class="task-card-stub"></div>', props: ['task'] },
          StatCardSkeleton: { template: '<div class="stat-card-skeleton-stub"></div>' },
          ...stubs
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('Greeting and Initialization', () => {
    it.each([
      [10, 'Morning'], // 10 AM
      [14, 'Afternoon'], // 2 PM
      [20, 'Evening'] // 8 PM
    ])('renders "Good %s" at %i:00', (hour, expectedGreeting) => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2025, 10, 15, hour))

      const wrapper = createWrapper({
        user: { user_metadata: { full_name: 'Test User' } }
      })

      expect(wrapper.find('h1').text()).toBe(`Good ${expectedGreeting}, Test`)

      vi.useRealTimers()
    })

    it('uses email username as a fallback for greeting', () => {
      const wrapper = createWrapper({ user: { email: 'fallback@example.com' } })
      expect(wrapper.find('h1').text()).toContain('fallback')
    })

    it('uses a generic greeting if no user data is available', () => {
      const wrapper = createWrapper({ user: null })
      expect(wrapper.find('h1').text()).toContain('there')
    })

    it('calls taskStore.initialize on mount', () => {
      createWrapper()
      const taskStore = useTaskStore()
      expect(taskStore.initialize).toHaveBeenCalledTimes(1)
    })

    it('calls taskStore.unsubscribeFromTasks on unmount', () => {
      const wrapper = createWrapper()
      const taskStore = useTaskStore()
      wrapper.unmount()
      expect(taskStore.unsubscribeFromTasks).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('shows skeletons when taskStore is loading', () => {
      const wrapper = createWrapper({}, { loading: true })
      expect(wrapper.findAll('.stat-card-skeleton-stub')).toHaveLength(3)
      expect(wrapper.find('.stat-card').exists()).toBe(false)
    })
  })

  describe('Data Display', () => {
    const mockTasks = [
      { id: 1, title: 'Active Task 1' },
      { id: 2, title: 'Active Task 2' }
    ]

    it('displays task statistics correctly', () => {
      const wrapper = createWrapper({}, { tasks: mockTasks })
      expect(getTaskStats).toHaveBeenCalledWith(mockTasks)

      const statValues = wrapper.findAll('.stat-value')
      expect(statValues[0].text()).toBe('1') // Urgent
      expect(statValues[1].text()).toBe('2') // High Priority
      expect(statValues[2].text()).toBe('3') // Overdue
    })

    it('displays a list of active tasks', () => {
      const wrapper = createWrapper({}, { activeTasks: mockTasks })
      const taskCards = wrapper.findAll('.task-card-stub')
      expect(taskCards).toHaveLength(2)
    })

    it('shows an empty state message when there are no active tasks', () => {
      const wrapper = createWrapper({}, { activeTasks: [] })
      expect(wrapper.find('.text-center.text-gray-500').text()).toContain('No active tasks.')
      expect(wrapper.find('.task-card-stub').exists()).toBe(false)
    })

    it('displays a maximum of 5 tasks', () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({ id: i, title: `Task ${i}` }))
      const wrapper = createWrapper({}, { activeTasks: manyTasks })
      const taskCards = wrapper.findAll('.task-card-stub')
      expect(taskCards).toHaveLength(5)
    })
  })

  describe('Interactivity', () => {
    it('navigates to tasks with "urgent" filter when urgent stat card is clicked', async () => {
      const wrapper = createWrapper()
      await wrapper.find('[aria-label="View urgent tasks"]').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'tasks', query: { filter: 'urgent' } })
    })

    it('navigates to tasks with "high-priority" filter when high priority stat card is clicked', async () => {
      const wrapper = createWrapper()
      await wrapper.find('[aria-label="View high priority tasks"]').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'tasks', query: { filter: 'high-priority' } })
    })

    it('navigates to tasks with "overdue" filter when overdue stat card is clicked', async () => {
      const wrapper = createWrapper()
      await wrapper.find('[aria-label="View overdue tasks"]').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'tasks', query: { filter: 'overdue' } })
    })
  })
})
