import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContinueSection from '../ContinueSection.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock activity store
let mockActivities = []
const mockGetRecentActivities = vi.fn((limit) => mockActivities.slice(0, limit))

vi.mock('@/stores/activity', () => ({
  useActivityStore: () => ({
    activities: mockActivities,
    getRecentActivities: mockGetRecentActivities
  })
}))

describe('ContinueSection.vue', () => {
  let wrapper

  const createWrapper = (activities = []) => {
    mockActivities = activities
    mockGetRecentActivities.mockReturnValue(activities.slice(0, 5))

    wrapper = mount(ContinueSection, {
      global: {
        stubs: {
          // Stub any child components if needed
        }
      }
    })
  }

  beforeEach(() => {
    mockPush.mockClear()
    mockGetRecentActivities.mockClear()
  })

  describe('Component Structure', () => {
    it('should render without errors when there are activities', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.exists()).toBe(true)
    })

    it('should not render when there are no activities', () => {
      createWrapper([])
      expect(wrapper.find('.continue-section').exists()).toBe(false)
    })

    it('should render section title', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.text()).toContain('Continue where you left off')
    })
  })

  describe('Activity Display', () => {
    it('should display activity items', () => {
      const activities = [
        { id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() },
        { id: '2', type: 'note', title: 'Note 1', timestamp: Date.now() }
      ]
      createWrapper(activities)
      const items = wrapper.findAll('.activity-item')
      expect(items.length).toBe(2)
    })

    it('should display activity title', () => {
      const activities = [
        { id: '1', type: 'task', title: 'My Important Task', timestamp: Date.now() }
      ]
      createWrapper(activities)
      expect(wrapper.text()).toContain('My Important Task')
    })

    it('should display activity type', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.text()).toContain('task')
    })

    it('should display activity timestamp', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() - 60000 }]
      createWrapper(activities)
      const timeText = wrapper.find('.activity-time').text()
      expect(timeText).toBeTruthy()
    })
  })

  describe('Activity Icons', () => {
    it('should display task icon for task activities', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.html()).toContain('pi-check-circle')
    })

    it('should display note icon for note activities', () => {
      const activities = [{ id: '1', type: 'note', title: 'Note 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.html()).toContain('pi-file-edit')
    })

    it('should display meeting icon for meeting activities', () => {
      const activities = [{ id: '1', type: 'meeting', title: 'Meeting 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.html()).toContain('pi-calendar')
    })

    it('should display default icon for unknown activity type', () => {
      const activities = [{ id: '1', type: 'unknown', title: 'Unknown 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.html()).toContain('pi-circle')
    })
  })

  describe('Timestamp Formatting', () => {
    it('should format recent timestamps as "just now"', () => {
      const activities = [
        { id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() - 30000 } // 30 seconds ago
      ]
      createWrapper(activities)
      expect(wrapper.text()).toContain('just now')
    })

    it('should format timestamps in minutes', () => {
      const activities = [
        { id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() - 5 * 60000 } // 5 minutes ago
      ]
      createWrapper(activities)
      expect(wrapper.text()).toMatch(/5m ago/)
    })

    it('should format timestamps in hours', () => {
      const activities = [
        { id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() - 3 * 3600000 } // 3 hours ago
      ]
      createWrapper(activities)
      expect(wrapper.text()).toMatch(/3h ago/)
    })

    it('should format timestamps in days', () => {
      const activities = [
        { id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() - 2 * 86400000 } // 2 days ago
      ]
      createWrapper(activities)
      expect(wrapper.text()).toMatch(/2d ago/)
    })

    it('should format old timestamps as dates', () => {
      const oldDate = Date.now() - 10 * 86400000 // 10 days ago
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: oldDate }]
      createWrapper(activities)
      const formattedDate = new Date(oldDate).toLocaleDateString()
      expect(wrapper.text()).toContain(formattedDate)
    })
  })

  describe('Navigation', () => {
    it('should navigate to tasks when task activity is clicked', async () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)

      await wrapper.find('.activity-item').trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'tasks',
        query: { id: '1' }
      })
    })

    it('should navigate to notes when note activity is clicked', async () => {
      const activities = [{ id: '1', type: 'note', title: 'Note 1', timestamp: Date.now() }]
      createWrapper(activities)

      await wrapper.find('.activity-item').trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'notes',
        query: { id: '1' }
      })
    })

    it('should navigate to scheduling when meeting activity is clicked', async () => {
      const activities = [{ id: '1', type: 'meeting', title: 'Meeting 1', timestamp: Date.now() }]
      createWrapper(activities)

      await wrapper.find('.activity-item').trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'scheduling-detail',
        params: { id: '1' }
      })
    })

    it('should not navigate when unknown activity type is clicked', async () => {
      const activities = [{ id: '1', type: 'unknown', title: 'Unknown 1', timestamp: Date.now() }]
      createWrapper(activities)

      await wrapper.find('.activity-item').trigger('click')

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should have tabindex for keyboard navigation', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.find('.activity-item').attributes('tabindex')).toBe('0')
    })

    it('should have role button for screen readers', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.find('.activity-item').attributes('role')).toBe('button')
    })

    it('should navigate on Enter key press', async () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)

      await wrapper.find('.activity-item').trigger('keydown.enter')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'tasks',
        query: { id: '1' }
      })
    })
  })

  describe('Activity Arrow', () => {
    it('should display arrow icon', () => {
      const activities = [{ id: '1', type: 'task', title: 'Task 1', timestamp: Date.now() }]
      createWrapper(activities)
      expect(wrapper.html()).toContain('pi-arrow-right')
    })
  })
})
