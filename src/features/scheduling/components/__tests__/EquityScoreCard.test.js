import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EquityScoreCard from '../EquityScoreCard.vue'

describe('EquityScoreCard.vue', () => {
  const mountComponent = (props = {}) =>
    mount(EquityScoreCard, {
      props: {
        score: 85,
        ...props
      },
      global: {
        stubs: {
          Card: {
            template:
              '<div class="card-stub"><div class="title"><slot name="title" /></div><div class="content"><slot name="content" /></div></div>'
          },
          Badge: {
            template: '<span class="badge-stub" :data-severity="severity">{{ value }}</span>',
            props: ['value', 'severity']
          }
        }
      }
    })

  it('renders the component', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.card-stub').exists()).toBe(true)
  })

  it('displays the title "Global Equity Score"', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Global Equity Score')
  })

  it('displays the score value correctly', () => {
    const wrapper = mountComponent({ score: 85 })
    expect(wrapper.html()).toContain('85')
    expect(wrapper.html()).toContain('out of 100')
  })

  it('displays "--" when score is null', () => {
    const wrapper = mountComponent({ score: null })
    expect(wrapper.html()).toContain('--')
  })

  it.each([
    [85, 'Excellent'],
    [50, 'Good'],
    [30, 'Fair'],
    [0, 'Poor']
  ])('displays the correct quality badge for score %i', (score, quality) => {
    const wrapper = mountComponent({ score })
    const badge = wrapper.find('.badge-stub')
    expect(badge.text()).toBe(quality)
  })

  it.each([
    [85, 'success'],
    [50, 'warn'],
    [30, 'danger']
  ])('applies the correct severity for score %i', (score, severity) => {
    const wrapper = mountComponent({ score })
    const badge = wrapper.find('.badge-stub')
    expect(badge.attributes('data-severity')).toBe(severity)
  })

  it('does not show badge when score is null', () => {
    const wrapper = mountComponent({ score: null })
    const badge = wrapper.find('.badge-stub')
    expect(badge.exists()).toBe(false)
  })

  it('renders SVG circle for score visualization', () => {
    const wrapper = mountComponent({ score: 85 })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('circle').length).toBe(2) // background + progress
  })

  it('calculates stroke color based on score', () => {
    const wrapper75 = mountComponent({ score: 75 })
    const wrapper50 = mountComponent({ score: 50 })
    const wrapper30 = mountComponent({ score: 30 })

    // Green for >= 71
    expect(wrapper75.vm.scoreColor).toBe('#10B981')
    // Orange for >= 41
    expect(wrapper50.vm.scoreColor).toBe('#F59E0B')
    // Red for < 41
    expect(wrapper30.vm.scoreColor).toBe('#EF4444')
  })

  it('calculates dashOffset correctly based on score', () => {
    const wrapper = mountComponent({ score: 50 })
    const circumference = 2 * Math.PI * 85
    const expectedOffset = circumference * (1 - 0.5)
    expect(wrapper.vm.dashOffset).toBeCloseTo(expectedOffset)
  })
})
