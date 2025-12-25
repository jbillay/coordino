import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EquityScoreCard from '../EquityScoreCard.vue'

describe('EquityScoreCard.vue', () => {
  const mockBreakdown = {
    green: 3,
    orange: 1,
    red: 0,
    critical: 0
  }

  const mountComponent = (props = {}) =>
    mount(EquityScoreCard, {
      props: {
        score: 85,
        breakdown: mockBreakdown,
        ...props
      },
      global: {
        stubs: {
          Badge: {
            template: '<span class="badge-stub">{{ value }}</span>',
            props: ['value', 'severity']
          }
        }
      }
    })

  it('renders the main title', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.card-title').text()).toBe('Meeting Equity Score')
  })

  it('displays the score value correctly', () => {
    const wrapper = mountComponent({ score: 85 })
    expect(wrapper.find('.score-value').text()).toBe('85')
  })

  it.each([
    [95, 'Excellent meeting time for all participants'],
    [80, 'Good meeting time with minor compromises'],
    [65, 'Acceptable meeting time with some conflicts'],
    [45, 'Challenging meeting time for several participants'],
    [20, 'Poor meeting time - consider finding a better slot']
  ])('displays the correct description for a score of %i', (score, description) => {
    const wrapper = mountComponent({ score })
    expect(wrapper.find('.score-subtitle').text()).toBe(description)
  })

  it.each([
    [90, 'var(--p-green-500)'],
    [70, 'var(--p-orange-500)'],
    [50, 'var(--p-yellow-600)'],
    [30, 'var(--p-red-500)']
  ])('applies the correct color for a score of %i', (score, color) => {
    const wrapper = mountComponent({ score })
    const progressCircle = wrapper.find('.progress-ring-progress')
    expect(progressCircle.attributes('stroke')).toBe(color)
  })

  it('displays the correct breakdown counts', () => {
    const wrapper = mountComponent()
    const items = wrapper.findAll('.breakdown-item')
    expect(items[0].text()).toContain('3') // Green
    expect(items[1].text()).toContain('1') // Orange
    expect(items[2].text()).toContain('0') // Red
    expect(items[3].text()).toContain('0') // Critical
  })

  it('conditionally shows the critical breakdown item', async () => {
    const wrapper = mountComponent({ breakdown: { ...mockBreakdown, critical: 0 } })
    // The 4th item is always rendered, let's check its content
    expect(wrapper.findAll('.breakdown-item')[3].text()).toContain('0')

    await wrapper.setProps({ breakdown: { ...mockBreakdown, critical: 2 } })
    expect(wrapper.findAll('.breakdown-item')[3].text()).toContain('2')
  })

  it('calculates the stroke-dashoffset correctly', () => {
    const wrapper = mountComponent({ score: 25 })
    const circumference = 2 * Math.PI * 70
    const expectedOffset = circumference - 0.25 * circumference
    const progressCircle = wrapper.find('.progress-ring-progress')
    expect(parseFloat(progressCircle.attributes('stroke-dashoffset'))).toBeCloseTo(expectedOffset)
  })
})
