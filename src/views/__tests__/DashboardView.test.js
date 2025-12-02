import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

describe('DashboardView.vue', () => {
  const getWrapper = () =>
    mount(DashboardView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: {
                  user_metadata: {
                    full_name: 'Test User'
                  },
                  email: 'test@example.com'
                }
              }
            }
          })
        ],
        stubs: {
          AppLayout: {
            template: '<div><slot /></div>'
          }
        },
        mocks: {
          $route: {
            meta: {}
          }
        }
      }
    })

  it('renders correctly with user name and time-based greeting', () => {
    // Mock Date to control getTimeOfDay
    const mockDate = new Date(2025, 10, 15, 10, 0, 0) // November 15, 2025, 10:00:00
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('Good Morning, Test')
    expect(wrapper.text()).toContain('Add New Task')
    expect(wrapper.text()).toContain('Urgent')
    expect(wrapper.text()).toContain('High Priority')
    expect(wrapper.text()).toContain('Overdue')

    vi.useRealTimers()
  })

  it('renders correctly with email username fallback', () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: {
                  email: 'test@example.com'
                }
              }
            }
          })
        ],
        stubs: {
          AppLayout: {
            template: '<div><slot /></div>'
          }
        },
        mocks: {
          $route: {
            meta: {}
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Good Morning, test')
  })

  it('renders correctly with generic greeting fallback', () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: null
              }
            }
          })
        ],
        stubs: {
          AppLayout: {
            template: '<div><slot /></div>'
          }
        },
        mocks: {
          $route: {
            meta: {}
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Good Morning, there')
  })
})
