import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EquityScoreDisplay from '../EquityScoreDisplay.vue'

describe('EquityScoreDisplay.vue', () => {
  const mockBreakdown = {
    green_count: 3,
    orange_count: 1,
    red_count: 0,
    critical_count: 0
  }

  let wrapper

  beforeEach(() => {
    wrapper = mount(EquityScoreDisplay, {
      props: {
        score: 85,
        breakdown: mockBreakdown
      },
      global: {
        stubs: {
          Card: {
            template: '<div class="card-stub"><slot name="title" /><slot name="content" /></div>'
          },
          Badge: {
            template: '<span class="badge-stub">{{ value }}</span>',
            props: ['value', 'severity']
          }
        }
      }
    })
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the score value', () => {
    expect(wrapper.text()).toContain('85')
  })

  it('displays "out of 100" text', () => {
    expect(wrapper.text()).toContain('out of 100')
  })

  it('displays quality badge for excellent score', () => {
    expect(wrapper.text()).toContain('Excellent')
  })

  it('displays quality badge for good score', async () => {
    await wrapper.setProps({ score: 60 })
    expect(wrapper.text()).toContain('Good')
  })

  it('displays quality badge for fair score', async () => {
    await wrapper.setProps({ score: 30 })
    expect(wrapper.text()).toContain('Fair')
  })

  it('displays quality badge for poor score', async () => {
    await wrapper.setProps({ score: 0 })
    expect(wrapper.text()).toContain('Poor')
  })

  it('displays breakdown with correct counts', () => {
    expect(wrapper.text()).toContain('3') // green count
    expect(wrapper.text()).toContain('1') // orange count
    expect(wrapper.text()).toContain('0') // red count
  })

  it('displays Optimal label for green count', () => {
    expect(wrapper.text()).toContain('Optimal')
  })

  it('displays Acceptable label for orange count', () => {
    expect(wrapper.text()).toContain('Acceptable')
  })

  it('displays Poor label for red count', () => {
    expect(wrapper.text()).toContain('Poor')
  })

  it('shows critical conflicts section when critical_count > 0', async () => {
    await wrapper.setProps({
      breakdown: {
        ...mockBreakdown,
        critical_count: 2
      }
    })
    expect(wrapper.text()).toContain('Critical Conflicts')
    expect(wrapper.text()).toContain('2')
  })

  it('hides critical conflicts section when critical_count is 0', () => {
    expect(wrapper.text()).not.toContain('Critical Conflicts')
  })

  it('displays placeholder when no breakdown provided', async () => {
    await wrapper.setProps({ score: null, breakdown: null })
    expect(wrapper.text()).toContain('Add participants to see equity score')
  })

  it('displays -- when score is null', async () => {
    await wrapper.setProps({ score: null })
    expect(wrapper.text()).toContain('--')
  })

  it('renders SVG circle for score visualization', () => {
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    const circles = wrapper.findAll('circle')
    expect(circles.length).toBe(2) // background and progress circles
  })

  it('applies green color for excellent score', () => {
    // Score 85 should be green (#10B981)
    const html = wrapper.html()
    expect(html).toContain('#10B981')
  })

  it('applies orange color for good score', async () => {
    await wrapper.setProps({ score: 60 })
    const html = wrapper.html()
    expect(html).toContain('#F59E0B')
  })

  it('applies red color for poor score', async () => {
    await wrapper.setProps({ score: 30 })
    const html = wrapper.html()
    expect(html).toContain('#EF4444')
  })

  it('calculates correct dash offset for score', () => {
    // For score 85, dashOffset should be 15% of circumference
    const circumference = 2 * Math.PI * 85
    const expectedOffset = circumference * (1 - 0.85)
    const svg = wrapper.find('svg')
    const progressCircle = svg.findAll('circle')[1]
    const offset = progressCircle.attributes('stroke-dashoffset')
    expect(parseFloat(offset)).toBeCloseTo(expectedOffset, 1)
  })
})
