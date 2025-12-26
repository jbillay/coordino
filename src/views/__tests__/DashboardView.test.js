import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/features/tasks/store'
import { useNotesStore } from '@/features/notes/store'
import { useSchedulingStore } from '@/features/scheduling/store'
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

// Mock the scheduling store
vi.mock('@/features/scheduling/store')

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
        { path: '/notes', name: 'notes', component: { template: '<div>Notes</div>' } },
        {
          path: '/scheduling',
          name: 'scheduling',
          component: { template: '<div>Scheduling</div>' }
        },
        {
          path: '/scheduling/:id',
          name: 'scheduling-detail',
          component: { template: '<div>Meeting Detail</div>' }
        }
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

    vi.mocked(useSchedulingStore).mockReturnValue({
      meetings: [],
      recentMeetings: [],
      loading: false,
      fetchMeetings: vi.fn(),
      ...stubs.schedulingStore
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

  describe('Meetings Section', () => {
    it('calls schedulingStore.fetchMeetings on mount', () => {
      createWrapper()
      const schedulingStore = useSchedulingStore()
      expect(schedulingStore.fetchMeetings).toHaveBeenCalledTimes(1)
    })

    it('shows skeleton loaders when scheduling store is loading', () => {
      const wrapper = createWrapper(
        {},
        {},
        {
          schedulingStore: { loading: true, recentMeetings: [] }
        }
      )
      expect(wrapper.findAll('.meeting-item-skeleton')).toHaveLength(3)
    })

    it('shows empty state when no meetings exist', () => {
      const wrapper = createWrapper(
        {},
        {},
        {
          schedulingStore: { loading: false, recentMeetings: [] }
        }
      )
      expect(wrapper.text()).toContain('No meetings scheduled')
    })

    it('displays recent meetings correctly', () => {
      const mockMeetings = [
        {
          id: '1',
          title: 'Team Sync',
          proposed_time: '2025-01-15T14:00:00Z',
          participant_count: 3,
          equity_score: 85,
          updated_at: '2025-01-10T10:00:00Z'
        }
      ]
      const wrapper = createWrapper(
        {},
        {},
        {
          schedulingStore: { loading: false, recentMeetings: mockMeetings }
        }
      )
      expect(wrapper.text()).toContain('Team Sync')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('85')
    })

    it('navigates to meeting detail when meeting is clicked', async () => {
      const mockMeetings = [
        {
          id: 'meeting-123',
          title: 'Team Sync',
          proposed_time: '2025-01-15T14:00:00Z',
          participant_count: 3,
          updated_at: '2025-01-10T10:00:00Z'
        }
      ]
      const wrapper = createWrapper(
        {},
        {},
        {
          schedulingStore: { loading: false, recentMeetings: mockMeetings }
        }
      )

      await wrapper.find('.meeting-item').trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'scheduling-detail',
        params: { id: 'meeting-123' }
      })
    })

    it('navigates to scheduling page when "View All" is clicked', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      const viewAllBtn = buttons.find((btn) => btn.text().includes('View All'))
      await viewAllBtn.trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'scheduling' })
    })

    it('does not show equity badge when score is null', () => {
      const mockMeetings = [
        {
          id: '1',
          title: 'Team Sync',
          proposed_time: '2025-01-15T14:00:00Z',
          participant_count: 3,
          equity_score: null,
          updated_at: '2025-01-10T10:00:00Z'
        }
      ]
      const wrapper = createWrapper(
        {},
        {},
        {
          schedulingStore: { loading: false, recentMeetings: mockMeetings }
        }
      )
      expect(wrapper.find('.equity-badge').exists()).toBe(false)
    })

    it('shows correct equity badge class for excellent score', () => {
      const mockMeetings = [
        {
          id: '1',
          title: 'Team Sync',
          proposed_time: '2025-01-15T14:00:00Z',
          participant_count: 3,
          equity_score: 85,
          updated_at: '2025-01-10T10:00:00Z'
        }
      ]
      const wrapper = createWrapper(
        {},
        {},
        {
          schedulingStore: { loading: false, recentMeetings: mockMeetings }
        }
      )
      const badge = wrapper.find('.equity-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('equity-excellent')
    })
  })
})
