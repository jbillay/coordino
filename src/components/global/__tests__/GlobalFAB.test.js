import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GlobalFAB from '../GlobalFAB.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('GlobalFAB.vue', () => {
  let wrapper

  beforeEach(() => {
    mockPush.mockClear()
    wrapper = mount(GlobalFAB)
  })

  describe('Component Structure', () => {
    it('should render without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should render main FAB button', () => {
      expect(wrapper.find('.fab-main').exists()).toBe(true)
    })

    it('should render FAB menu', () => {
      expect(wrapper.find('.fab-menu').exists()).toBe(true)
    })

    it('should render three menu items', () => {
      const items = wrapper.findAll('.fab-item')
      expect(items.length).toBe(3)
    })
  })

  describe('Initial State', () => {
    it('should start collapsed', () => {
      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('should show plus icon when collapsed', () => {
      expect(wrapper.find('.fab-main i').classes()).toContain('pi-plus')
    })

    it('should not show backdrop when collapsed', () => {
      expect(wrapper.find('.fab-backdrop').exists()).toBe(false)
    })

    it('should have menu hidden when collapsed', () => {
      const menu = wrapper.find('.fab-menu')
      expect(menu.classes()).not.toContain('expanded')
    })
  })

  describe('Toggle Functionality', () => {
    it('should expand when main button is clicked', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)
    })

    it('should show times icon when expanded', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.find('.fab-main i').classes()).toContain('pi-times')
    })

    it('should show backdrop when expanded', async () => {
      await wrapper.find('.fab-main').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.fab-backdrop').exists()).toBe(true)
    })

    it('should add expanded class to menu when expanded', async () => {
      await wrapper.find('.fab-main').trigger('click')
      const menu = wrapper.find('.fab-menu')
      expect(menu.classes()).toContain('expanded')
    })

    it('should collapse when clicked again', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('should collapse when backdrop is clicked', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      await wrapper.find('.fab-backdrop').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(false)
    })
  })

  describe('Menu Items', () => {
    it('should have New Task menu item', () => {
      const items = wrapper.findAll('.fab-item')
      const taskItem = items.find((item) => item.text().includes('New Task'))
      expect(taskItem).toBeTruthy()
    })

    it('should have New Note menu item', () => {
      const items = wrapper.findAll('.fab-item')
      const noteItem = items.find((item) => item.text().includes('New Note'))
      expect(noteItem).toBeTruthy()
    })

    it('should have New Meeting menu item', () => {
      const items = wrapper.findAll('.fab-item')
      const meetingItem = items.find((item) => item.text().includes('New Meeting'))
      expect(meetingItem).toBeTruthy()
    })

    it('should have correct icons for menu items', () => {
      const items = wrapper.findAll('.fab-item')
      expect(items[0].html()).toContain('pi-check-circle')
      expect(items[1].html()).toContain('pi-file-edit')
      expect(items[2].html()).toContain('pi-calendar-plus')
    })
  })

  describe('Navigation', () => {
    it('should navigate to tasks when New Task is clicked', async () => {
      const items = wrapper.findAll('.fab-item')
      const taskItem = items.find((item) => item.text().includes('New Task'))

      await taskItem.trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'tasks',
        query: { action: 'create' }
      })
    })

    it('should navigate to notes when New Note is clicked', async () => {
      const items = wrapper.findAll('.fab-item')
      const noteItem = items.find((item) => item.text().includes('New Note'))

      await noteItem.trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'notes-create'
      })
    })

    it('should navigate to scheduling when New Meeting is clicked', async () => {
      const items = wrapper.findAll('.fab-item')
      const meetingItem = items.find((item) => item.text().includes('New Meeting'))

      await meetingItem.trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'scheduling-create'
      })
    })

    it('should close menu after navigation', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      const items = wrapper.findAll('.fab-item')
      await items[0].trigger('click')

      expect(wrapper.vm.isExpanded).toBe(false)
    })
  })

  describe('Keyboard Handling', () => {
    it('should close menu on Escape key', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      await wrapper.trigger('keydown', { key: 'Escape' })
      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('should not close menu on other keys', async () => {
      await wrapper.find('.fab-main').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      await wrapper.trigger('keydown', { key: 'Enter' })
      expect(wrapper.vm.isExpanded).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-expanded attribute on main button', () => {
      const mainButton = wrapper.find('.fab-main')
      expect(mainButton.attributes('aria-expanded')).toBeDefined()
    })

    it('should update aria-expanded when toggled', async () => {
      const mainButton = wrapper.find('.fab-main')
      expect(mainButton.attributes('aria-expanded')).toBe('false')

      await mainButton.trigger('click')
      expect(mainButton.attributes('aria-expanded')).toBe('true')
    })

    it('should have aria-label on main button', () => {
      const mainButton = wrapper.find('.fab-main')
      expect(mainButton.attributes('aria-label')).toBe('Quick actions')
    })

    it('should have aria-label on menu items', () => {
      const items = wrapper.findAll('.fab-item')
      items.forEach((item) => {
        expect(item.attributes('aria-label')).toBeTruthy()
      })
    })

    it('should have aria-hidden on backdrop', async () => {
      await wrapper.find('.fab-main').trigger('click')
      const backdrop = wrapper.find('.fab-backdrop')
      expect(backdrop.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Menu Methods', () => {
    it('should have toggleMenu method', () => {
      expect(typeof wrapper.vm.toggleMenu).toBe('function')
    })

    it('should have closeMenu method', () => {
      expect(typeof wrapper.vm.closeMenu).toBe('function')
    })

    it('should have createTask method', () => {
      expect(typeof wrapper.vm.createTask).toBe('function')
    })

    it('should have createNote method', () => {
      expect(typeof wrapper.vm.createNote).toBe('function')
    })

    it('should have createMeeting method', () => {
      expect(typeof wrapper.vm.createMeeting).toBe('function')
    })
  })
})
