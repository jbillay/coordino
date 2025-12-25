import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import CommandPalette from '../CommandPalette.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('CommandPalette.vue', () => {
  let wrapper

  const createWrapper = () =>
    mount(CommandPalette, {
      attachTo: document.body,
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              tasks: {
                tasks: [
                  { id: '1', title: 'Task 1' },
                  { id: '2', title: 'Task 2' }
                ]
              },
              notes: {
                notes: [
                  { id: '1', title: 'Note 1' },
                  { id: '2', title: 'Note 2' }
                ]
              }
            }
          })
        ],
        stubs: {
          Teleport: true
        }
      }
    })

  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Structure', () => {
    it('should render without errors', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should be hidden by default', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should render overlay when open', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.find('.command-palette-overlay').exists()).toBe(true)
    })

    it('should render command palette when open', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.find('.command-palette').exists()).toBe(true)
    })
  })

  describe('Open/Close Functionality', () => {
    it('should open palette with open() method', async () => {
      wrapper = createWrapper()
      expect(wrapper.vm.isOpen).toBe(false)
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('should close palette with close() method', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)
      wrapper.vm.close()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should reset query when opened', async () => {
      wrapper = createWrapper()
      wrapper.vm.query = 'test'
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.vm.query).toBe('')
    })

    it('should reset selected index when opened', async () => {
      wrapper = createWrapper()
      wrapper.vm.selectedIndex = 5
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.vm.selectedIndex).toBe(0)
    })

    it('should close when clicking overlay', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()

      await wrapper.find('.command-palette-overlay').trigger('click')
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should not close when clicking inside palette', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()

      await wrapper.find('.command-palette').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)
    })
  })

  describe('Commands', () => {
    it('should have navigation commands', () => {
      wrapper = createWrapper()
      const { commands } = wrapper.vm
      const navCommands = commands.filter((c) => c.category === 'Navigation')
      expect(navCommands.length).toBeGreaterThan(0)
    })

    it('should have action commands', () => {
      wrapper = createWrapper()
      const { commands } = wrapper.vm
      const actionCommands = commands.filter((c) => c.category === 'Actions')
      expect(actionCommands.length).toBeGreaterThan(0)
    })

    it('should include recent tasks', () => {
      wrapper = createWrapper()
      const { commands } = wrapper.vm
      const taskCommands = commands.filter((c) => c.category === 'Recent Tasks')
      expect(taskCommands.length).toBe(2)
    })

    it('should include recent notes', () => {
      wrapper = createWrapper()
      const { commands } = wrapper.vm
      const noteCommands = commands.filter((c) => c.category === 'Recent Notes')
      expect(noteCommands.length).toBe(2)
    })
  })

  describe('Search/Filtering', () => {
    it('should filter commands by title', async () => {
      wrapper = createWrapper()
      wrapper.vm.query = 'dashboard'
      await nextTick()
      const filtered = wrapper.vm.filteredCommands
      expect(filtered.some((c) => c.title.toLowerCase().includes('dashboard'))).toBe(true)
    })

    it('should filter commands by keywords', async () => {
      wrapper = createWrapper()
      wrapper.vm.query = 'home'
      await nextTick()
      const filtered = wrapper.vm.filteredCommands
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should show limited results when no query', () => {
      wrapper = createWrapper()
      wrapper.vm.query = ''
      const filtered = wrapper.vm.filteredCommands
      expect(filtered.length).toBeLessThanOrEqual(8)
    })

    it('should limit filtered results to 10', () => {
      wrapper = createWrapper()
      wrapper.vm.query = 'a'
      const filtered = wrapper.vm.filteredCommands
      expect(filtered.length).toBeLessThanOrEqual(10)
    })

    it('should return empty array when no matches', () => {
      wrapper = createWrapper()
      wrapper.vm.query = 'xyznonexistent'
      const filtered = wrapper.vm.filteredCommands
      expect(filtered.length).toBe(0)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown key', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()

      expect(wrapper.vm.selectedIndex).toBe(0)
      await wrapper.vm.handleKeydown({ key: 'ArrowDown', preventDefault: vi.fn() })
      expect(wrapper.vm.selectedIndex).toBe(1)
    })

    it('should handle ArrowUp key', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      wrapper.vm.selectedIndex = 2
      await nextTick()

      await wrapper.vm.handleKeydown({ key: 'ArrowUp', preventDefault: vi.fn() })
      expect(wrapper.vm.selectedIndex).toBe(1)
    })

    it('should not go below 0 with ArrowUp', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      wrapper.vm.selectedIndex = 0
      await nextTick()

      await wrapper.vm.handleKeydown({ key: 'ArrowUp', preventDefault: vi.fn() })
      expect(wrapper.vm.selectedIndex).toBe(0)
    })

    it('should not exceed max index with ArrowDown', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      const maxIndex = wrapper.vm.filteredCommands.length - 1
      wrapper.vm.selectedIndex = maxIndex
      await nextTick()

      await wrapper.vm.handleKeydown({ key: 'ArrowDown', preventDefault: vi.fn() })
      expect(wrapper.vm.selectedIndex).toBe(maxIndex)
    })

    it('should execute command on Enter key', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      wrapper.vm.selectedIndex = 0
      await nextTick()

      await wrapper.vm.handleKeydown({ key: 'Enter', preventDefault: vi.fn() })
      expect(mockPush).toHaveBeenCalled()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should close on Escape key', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      await nextTick()

      await wrapper.vm.handleKeydown({ key: 'Escape', preventDefault: vi.fn() })
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('Global Keyboard Shortcut', () => {
    it('should open on Ctrl+K', async () => {
      wrapper = createWrapper()
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' })
      window.dispatchEvent(event)
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('should toggle on repeated Ctrl+K', async () => {
      wrapper = createWrapper()

      const event1 = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' })
      window.dispatchEvent(event1)
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)

      const event2 = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' })
      window.dispatchEvent(event2)
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('Command Execution', () => {
    it('should execute command and close palette', async () => {
      wrapper = createWrapper()
      const command = wrapper.vm.commands[0]

      wrapper.vm.open()
      await nextTick()

      wrapper.vm.executeCommand(command)

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should navigate to correct route when command is executed', async () => {
      wrapper = createWrapper()
      const dashboardCommand = wrapper.vm.commands.find((c) => c.id === 'nav-dashboard')

      wrapper.vm.executeCommand(dashboardCommand)

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('Grouped Commands', () => {
    it('should group commands by category', () => {
      wrapper = createWrapper()
      const grouped = wrapper.vm.groupedCommands
      expect(Object.keys(grouped).length).toBeGreaterThan(0)
    })

    it('should have Navigation category', () => {
      wrapper = createWrapper()
      const grouped = wrapper.vm.groupedCommands
      expect(grouped).toHaveProperty('Navigation')
    })

    it('should have Actions category', () => {
      wrapper = createWrapper()
      const grouped = wrapper.vm.groupedCommands
      expect(grouped).toHaveProperty('Actions')
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no results', async () => {
      wrapper = createWrapper()
      wrapper.vm.open()
      wrapper.vm.query = 'xyznonexistent'
      await nextTick()

      expect(wrapper.vm.filteredCommands.length).toBe(0)
    })
  })

  describe('Expose Methods', () => {
    it('should expose open method', () => {
      wrapper = createWrapper()
      expect(typeof wrapper.vm.open).toBe('function')
    })

    it('should expose close method', () => {
      wrapper = createWrapper()
      expect(typeof wrapper.vm.close).toBe('function')
    })
  })
})
