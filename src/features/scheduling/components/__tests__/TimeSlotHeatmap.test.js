import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeSlotHeatmap from '../TimeSlotHeatmap.vue'

describe('TimeSlotHeatmap.vue', () => {
  const mockSlots = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    score: i * 4,
    green_count: i % 4,
    orange_count: (i + 1) % 4,
    red_count: (i + 2) % 4,
    critical_count: (i + 3) % 4,
    datetime: new Date(2025, 11, 25, i).toISOString()
  }))

  const mountComponent = (props = {}) =>
    mount(TimeSlotHeatmap, {
      props: {
        slots: mockSlots,
        ...props
      },
      global: {
        stubs: {
          i: true // Stub primevue icons
        }
      }
    })

  it('shows a loading spinner when loading is true', () => {
    const wrapper = mountComponent({ loading: true, slots: [] })
    expect(wrapper.find('.heatmap-loading').exists()).toBe(true)
    expect(wrapper.find('.heatmap-container').exists()).toBe(false)
  })

  it('shows an empty state message when no slots are provided', () => {
    const wrapper = mountComponent({ slots: [] })
    expect(wrapper.find('.heatmap-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain(
      'Add participants and propose a time to generate the equity heatmap.'
    )
  })

  it('renders the grid of 24 slots when data is provided', () => {
    const wrapper = mountComponent()
    const slots = wrapper.findAll('.slot')
    expect(slots).toHaveLength(24)
  })

  it('applies the correct CSS class based on the score', () => {
    const wrapper = mountComponent()
    const slots = wrapper.findAll('.slot')

    // Score 92 (23 * 4) -> excellent
    expect(slots[23].classes()).toContain('excellent')
    // Score 68 (17 * 4) -> good
    expect(slots[17].classes()).toContain('good')
    // Score 48 (12 * 4) -> fair
    expect(slots[12].classes()).toContain('fair')
    // Score 20 (5 * 4) -> poor
    expect(slots[5].classes()).toContain('poor')
  })

  it('emits "slot-selected" with the slot object when a slot is clicked', async () => {
    const wrapper = mountComponent()
    const slot5 = wrapper.findAll('.slot')[5]
    await slot5.trigger('click')

    expect(wrapper.emitted('slot-selected')).toBeTruthy()
    expect(wrapper.emitted('slot-selected')[0][0]).toEqual(mockSlots[5])
  })

  it('highlights the selected slot and shows details', async () => {
    const wrapper = mountComponent()
    const slot10 = wrapper.findAll('.slot')[10]
    await slot10.trigger('click')

    expect(slot10.classes()).toContain('selected')
    const details = wrapper.find('.slot-details')
    expect(details.exists()).toBe(true)
    expect(details.text()).toContain('Selected Time: 10:00 AM')
    // Score is Math.round(10 * 4) = 40
    expect(details.text()).toContain('40/100')
  })

  it('handles keyboard navigation with ArrowRight', async () => {
    const wrapper = mountComponent()
    const slot5 = wrapper.findAll('.slot')[5]

    await slot5.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('slot-selected')[0][0]).toEqual(mockSlots[6])
  })

  it('renders the legend correctly', () => {
    const wrapper = mountComponent()
    const legend = wrapper.find('.heatmap-legend')
    expect(legend.exists()).toBe(true)
    expect(legend.text()).toContain('Excellent (80-100)')
    expect(legend.text()).toContain('Poor (0-39)')
  })
})
