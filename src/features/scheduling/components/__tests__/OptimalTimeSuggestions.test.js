import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OptimalTimeSuggestions from '../OptimalTimeSuggestions.vue'

describe('OptimalTimeSuggestions.vue', () => {
  const mockSuggestions = [
    {
      hour: 10,
      score: 95,
      meetingTime: new Date().toISOString(),
      breakdown: { green: 4, orange: 0, red: 0, critical: 0 }
    },
    {
      hour: 11,
      score: 88,
      meetingTime: new Date().toISOString(),
      breakdown: { green: 3, orange: 1, red: 0, critical: 0 }
    },
    {
      hour: 9,
      score: 85,
      meetingTime: new Date().toISOString(),
      breakdown: { green: 3, orange: 0, red: 1, critical: 0 }
    }
  ]

  const mountComponent = (props = {}) =>
    mount(OptimalTimeSuggestions, {
      props: {
        suggestions: mockSuggestions,
        ...props
      },
      global: {
        stubs: {
          Button: {
            name: 'Button',
            template: '<button :disabled="disabled"><slot>{{ label }}</slot></button>',
            props: ['label', 'icon', 'severity', 'disabled']
          }
        }
      }
    })

  it('renders the list of suggestions', () => {
    const wrapper = mountComponent()
    const cards = wrapper.findAll('.suggestion-card')
    expect(cards).toHaveLength(3)
  })

  it('displays the empty state when no suggestions are provided', () => {
    const wrapper = mountComponent({ suggestions: [] })
    expect(wrapper.find('.no-suggestions').exists()).toBe(true)
    expect(wrapper.text()).toContain('No suggestions available.')
  })

  it('displays correct rank, time, score, and breakdown for a suggestion', () => {
    const wrapper = mountComponent()
    const firstCard = wrapper.find('.suggestion-card')

    expect(firstCard.find('.rank-number').text()).toBe('1')
    expect(firstCard.find('.time-label').text()).toBe('10:00 AM UTC')
    expect(firstCard.find('.score-info').text()).toContain('95/100')
    expect(firstCard.find('.breakdown').text()).toContain('4 optimal')
  })

  it('emits "timeSelected" with suggestion data when a button is clicked', async () => {
    const wrapper = mountComponent()
    const secondCardButton = wrapper.findAllComponents({ name: 'Button' })[1]

    await secondCardButton.trigger('click')

    expect(wrapper.emitted('timeSelected')).toBeTruthy()
    expect(wrapper.emitted('timeSelected')[0][0]).toEqual(mockSuggestions[1])
  })

  it('disables the button and shows "Selected" for the current hour', () => {
    const wrapper = mountComponent({ currentHour: 11 }) // Select the second suggestion
    const buttons = wrapper.findAllComponents({ name: 'Button' })

    expect(buttons[0].props('disabled')).toBe(false)
    expect(buttons[0].text()).toBe('Select This Time')

    expect(buttons[1].props('disabled')).toBe(true)
    expect(buttons[1].text()).toBe('Selected')
  })

  it('correctly formats different hours', () => {
    const wrapper = mountComponent()

    // Test AM
    expect(wrapper.vm.formatHour(9)).toBe('9:00 AM')
    // Test PM
    expect(wrapper.vm.formatHour(14)).toBe('2:00 PM')
    // Test noon
    expect(wrapper.vm.formatHour(12)).toBe('12:00 PM')
    // Test midnight
    expect(wrapper.vm.formatHour(0)).toBe('12:00 AM')
  })
})
