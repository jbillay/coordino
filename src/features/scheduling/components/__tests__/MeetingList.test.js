import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MeetingList from '../MeetingList.vue'
import { nextTick } from 'vue'

describe('MeetingList.vue', () => {
  const mockMeetings = [
    {
      id: '1',
      title: 'Sync Up',
      proposed_time: '2025-11-10T10:00:00.000Z',
      participants: [{}, {}]
    },
    {
      id: '2',
      title: 'Project Kickoff',
      proposed_time: '2025-11-11T14:30:00.000Z',
      participants: [{}]
    }
  ]

  const mountComponent = (props = {}) =>
    mount(MeetingList, {
      props: {
        meetings: mockMeetings,
        ...props
      },
      global: {
        stubs: {
          Card: { template: '<div><slot name="title" /><slot name="content" /></div>' }
        }
      }
    })

  it('shows loading state', () => {
    const wrapper = mountComponent({ loading: true, meetings: [] })
    expect(wrapper.text()).toContain('Loading meetings...')
  })

  it('shows empty state when no meetings are provided', () => {
    const wrapper = mountComponent({ meetings: [] })
    expect(wrapper.text()).toContain('No meetings yet')
    expect(wrapper.text()).toContain('Create Meeting')
  })

  it('renders a list of meetings', () => {
    const wrapper = mountComponent()
    const items = wrapper.findAll('.p-4.border.rounded-lg')
    expect(items).toHaveLength(2)
    expect(wrapper.text()).toContain('Sync Up')
    expect(wrapper.text()).toContain('Project Kickoff')
  })

  it('formats and displays meeting time and participant count', () => {
    const wrapper = mountComponent()
    const firstMeeting = wrapper.findAll('.p-4.border.rounded-lg')[0]
    expect(firstMeeting.text()).toContain('November 10, 2025')
    // Note: time formatting depends on test runner's timezone. Just check for presence.
    expect(firstMeeting.text()).toMatch(/\d{1,2}:\d{2}\s(A|P)M/)
    expect(firstMeeting.text()).toContain('2 participants')
  })

  it('emits "select" with meeting ID when an item is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.find('.p-4.border.rounded-lg').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['1'])
  })

  it('emits "delete" with meeting ID when delete button is clicked', async () => {
    const wrapper = mountComponent()
    const deleteButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Delete'))
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual(['1'])
  })

  it('emits "create" when "New Meeting" button is clicked', async () => {
    const wrapper = mountComponent()
    const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Meeting'))
    await createButton.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('debounces search input and emits "search"', async () => {
    vi.useFakeTimers()
    const wrapper = mountComponent()

    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('test')

    // Should not emit immediately
    expect(wrapper.emitted('search')).toBeFalsy()

    // Advance timers past the debounce delay
    await vi.advanceTimersByTimeAsync(301)

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')[0]).toEqual(['test'])
    vi.useRealTimers()
  })

  it('shows no results message when search filters out all meetings', async () => {
    const wrapper = mountComponent()
    await wrapper.find('input[type="text"]').setValue('nomatch')
    await nextTick()
    expect(wrapper.text()).toContain('No meetings found matching "nomatch"')
  })

  it('highlights the selected meeting', () => {
    const wrapper = mountComponent({ selectedId: '2' })
    const items = wrapper.findAll('.p-4.border.rounded-lg')
    expect(items[0].classes()).not.toContain('border-blue-500')
    expect(items[1].classes()).toContain('border-blue-500')
  })
})
