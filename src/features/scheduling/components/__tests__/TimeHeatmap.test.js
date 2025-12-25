import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeHeatmap from '../TimeHeatmap.vue'

describe('TimeHeatmap.vue', () => {
  const mockHeatmapData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    score: i * 4, // 0, 4, 8, ... 92
    breakdown: {
      green: i % 4,
      orange: (i + 1) % 4,
      red: (i + 2) % 4,
      critical: (i + 3) % 4
    }
  }))

  const mountComponent = (props = {}) =>
    mount(TimeHeatmap, {
      props: {
        heatmapData: mockHeatmapData,
        ...props
      }
    })

  it('renders the grid with 24 heatmap cells', () => {
    const wrapper = mountComponent()
    const cells = wrapper.findAll('.heatmap-cell')
    expect(cells).toHaveLength(24)
  })

  it('displays the correct hour and score in a cell', () => {
    const wrapper = mountComponent()
    const firstCell = wrapper.find('.heatmap-cell') // Hour 0
    expect(firstCell.text()).toContain('12 AM')
    expect(firstCell.find('.score-label').text()).toBe('0')
  })

  it('applies the correct background color based on score', () => {
    const wrapper = mountComponent()
    const cells = wrapper.findAll('.heatmap-cell')

    // Test score 0 -> red
    expect(cells[0].attributes('style')).toContain('rgb(200, 34, 34)') // score 0
    // Test score 52 -> yellow-green (normalized 0.52, in 0.5-0.75 range)
    // ratio = 0.08, red = 184, green = 200
    expect(cells[13].attributes('style')).toContain('rgb(184, 200, 34)') // score 52
    // Test score 80 -> green (normalized 0.8, in 0.75-1.0 range)
    // greenIntensity = 200 + 0.05 * 220 = 211
    expect(cells[20].attributes('style')).toContain('rgb(34, 211, 34)') // score 80
  })

  it('emits "hourSelected" with the correct hour when a cell is clicked', async () => {
    const wrapper = mountComponent()
    const cellForHour5 = wrapper.findAll('.heatmap-cell')[5]

    await cellForHour5.trigger('click')

    expect(wrapper.emitted('hourSelected')).toBeTruthy()
    expect(wrapper.emitted('hourSelected')[0]).toEqual([5])
  })

  it('highlights the selected hour based on the currentHour prop', async () => {
    const wrapper = mountComponent({ currentHour: 10 })
    const selectedCell = wrapper.findAll('.heatmap-cell')[10]
    expect(selectedCell.attributes('aria-selected')).toBe('true')
  })

  it('generates a descriptive ARIA label for a cell', () => {
    const wrapper = mountComponent()
    const cellForHour10 = wrapper.findAll('.heatmap-cell')[10] // score 40
    // breakdown: green: 2, orange: 3, red: 0, critical: 1
    const expectedLabel = '10 AM: Equity score 40 out of 100. 2 green, 3 orange, 1 critical'
    expect(cellForHour10.attributes('aria-label')).toBe(expectedLabel)
  })

  it('handles keyboard navigation with ArrowRight', async () => {
    const wrapper = mountComponent({ currentHour: 5 })
    const cell5 = wrapper.findAll('.heatmap-cell')[5]

    await cell5.trigger('keydown', { key: 'ArrowRight' })

    // This is tricky to test as it just calls .focus(). We can check if the internal selectedHour ref is updated via the emitted event.
    // A better way is to check the emitted event from selectHour
    expect(wrapper.emitted('hourSelected')).toBeTruthy()
    expect(wrapper.emitted('hourSelected')[0]).toEqual([6])
  })

  it('handles keyboard navigation with ArrowLeft', async () => {
    const wrapper = mountComponent({ currentHour: 5 })
    const cell5 = wrapper.findAll('.heatmap-cell')[5]
    await cell5.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('hourSelected')[0]).toEqual([4])
  })

  it('handles keyboard navigation with ArrowDown', async () => {
    const wrapper = mountComponent({ currentHour: 5 })
    const cell5 = wrapper.findAll('.heatmap-cell')[5]
    await cell5.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('hourSelected')[0]).toEqual([11])
  })

  it('handles keyboard navigation with ArrowUp', async () => {
    const wrapper = mountComponent({ currentHour: 11 })
    const cell11 = wrapper.findAll('.heatmap-cell')[11]
    await cell11.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('hourSelected')[0]).toEqual([5])
  })

  it('selects the hour on Enter key press', async () => {
    const wrapper = mountComponent()
    const cell8 = wrapper.findAll('.heatmap-cell')[8]
    await cell8.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('hourSelected')[0]).toEqual([8])
  })

  it('renders the legend correctly', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.legend').text()).toContain('Equity Score Legend')
    expect(wrapper.find('.legend').text()).toContain('100 (Optimal)')
    expect(wrapper.find('.legend').text()).toContain('0 (Critical)')
  })
})
