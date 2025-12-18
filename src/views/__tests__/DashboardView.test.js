import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'

describe('DashboardView.vue', () => {
  const createRouterForTest = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' }
        },
        {
          path: '/tasks',
          name: 'tasks',
          component: { template: '<div>Tasks</div>' }
        },
        {
          path: '/notes',
          name: 'notes',
          component: { template: '<div>Notes</div>' }
        },
        {
          path: '/meetings',
          name: 'meetings',
          component: { template: '<div>Meetings</div>' }
        }
      ]
    })

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
              },
              activity: {
                recentActivity: []
              }
            }
          }),
          createRouterForTest()
        ],
        stubs: {
          AppLayout: {
            template: '<div><slot /></div>'
          },
          Button: {
            template: '<button>{{ label }}</button>',
            props: ['label', 'icon', 'loading']
          },
          ContinueSection: {
            template: '<div class="continue-section-stub"></div>'
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
    expect(wrapper.text()).toContain('Urgent')
    expect(wrapper.text()).toContain('High Priority')
    expect(wrapper.text()).toContain('Overdue')

    vi.useRealTimers()
  })

  it('renders correctly with email username fallback', () => {
    // Mock Date to control getTimeOfDay
    const mockDate = new Date(2025, 10, 15, 10, 0, 0) // November 15, 2025, 10:00:00
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

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
              },
              activity: {
                recentActivity: []
              }
            }
          }),
          createRouterForTest()
        ],
        stubs: {
          AppLayout: {
            template: '<div><slot /></div>'
          },
          Button: {
            template: '<button>{{ label }}</button>',
            props: ['label', 'icon', 'loading']
          },
          ContinueSection: {
            template: '<div class="continue-section-stub"></div>'
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Good Morning, test')

    vi.useRealTimers()
  })

  it('renders correctly with generic greeting fallback', () => {
    // Mock Date to control getTimeOfDay
    const mockDate = new Date(2025, 10, 15, 10, 0, 0) // November 15, 2025, 10:00:00
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: null
              },
              activity: {
                recentActivity: []
              }
            }
          }),
          createRouterForTest()
        ],
        stubs: {
          AppLayout: {
            template: '<div><slot /></div>'
          },
          Button: {
            template: '<button>{{ label }}</button>',
            props: ['label', 'icon', 'loading']
          },
          ContinueSection: {
            template: '<div class="continue-section-stub"></div>'
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Good Morning, there')

    vi.useRealTimers()
  })
})
