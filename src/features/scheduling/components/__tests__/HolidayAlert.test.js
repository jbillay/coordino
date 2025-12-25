import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HolidayAlert from '../HolidayAlert.vue'

describe('HolidayAlert.vue', () => {
  const mockSuggestions = [{ hour: 10, score: 90 }]

  const mountComponent = (participants = [], suggestions = []) =>
    mount(HolidayAlert, {
      props: {
        participants,
        suggestions
      },
      global: {
        stubs: {
          Message: {
            template: '<div class="mock-message"><slot /></div>',
            props: ['severity']
          }
        }
      }
    })

  it('does not render if there are no critical participants', () => {
    const participants = [
      { id: '1', name: 'Alice', status: 'green' },
      { id: '2', name: 'Bob', status: 'orange' }
    ]
    const wrapper = mountComponent(participants)
    expect(wrapper.find('.holiday-alert').exists()).toBe(false)
  })

  it('renders correctly for one critical participant', () => {
    const participants = [
      { id: '1', name: 'Alice', status: 'critical', statusReason: 'Holiday: Christmas Day' }
    ]
    const wrapper = mountComponent(participants, mockSuggestions)

    expect(wrapper.find('.holiday-alert').exists()).toBe(true)
    expect(wrapper.find('h4').text()).toBe('Critical Scheduling Conflict Detected')
    expect(wrapper.text()).toContain('1 participant.')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('(Holiday: Christmas Day)')
  })

  it('renders correctly for multiple critical participants', () => {
    const participants = [
      { id: '1', name: 'Alice', status: 'critical', statusReason: 'Holiday: Christmas Day' },
      { id: '2', name: 'Charlie', status: 'critical', statusReason: 'Outside working hours' }
    ]
    const wrapper = mountComponent(participants)

    expect(wrapper.text()).toContain('2 participants.')
    expect(wrapper.findAll('.participant-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Charlie')
  })

  it('extracts and displays unique holiday names', () => {
    const participants = [
      { id: '1', name: 'Alice', status: 'critical', statusReason: 'Holiday: Christmas Day' },
      { id: '2', name: 'David', status: 'critical', statusReason: 'Holiday: Christmas Day' },
      { id: '3', name: 'Eve', status: 'critical', statusReason: 'Holiday: New Year' }
    ]
    const wrapper = mountComponent(participants, mockSuggestions)

    expect(wrapper.text()).toContain('Reschedule to avoid: Christmas Day, New Year')
  })

  it('does not display holiday-specific suggestion if no participants have holiday reason', () => {
    const participants = [
      { id: '1', name: 'Charlie', status: 'critical', statusReason: 'Outside working hours' }
    ]
    const wrapper = mountComponent(participants, mockSuggestions)
    expect(wrapper.text()).not.toContain('Reschedule to avoid:')
  })

  it('shows suggestions when provided', () => {
    const participants = [
      { id: '1', name: 'Alice', status: 'critical', statusReason: 'Holiday: Christmas Day' }
    ]
    const wrapper = mountComponent(participants, mockSuggestions)
    expect(wrapper.find('.suggestions').exists()).toBe(true)
    expect(wrapper.text()).toContain('Review the optimal time suggestions')
  })

  it('hides suggestions when not provided', () => {
    const participants = [
      { id: '1', name: 'Alice', status: 'critical', statusReason: 'Holiday: Christmas Day' }
    ]
    const wrapper = mountComponent(participants, []) // No suggestions
    expect(wrapper.find('.suggestions').exists()).toBe(false)
  })
})
