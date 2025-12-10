import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ParticipantCard from '../ParticipantCard.vue'

describe('ParticipantCard.vue', () => {
  const mockParticipant = {
    id: '1',
    name: 'John Doe',
    country: 'US',
    timezone: 'America/New_York',
    notes: 'VP of Engineering'
  }

  const mockStatus = {
    status: 'green',
    is_critical: false,
    reason: 'Within optimal working hours',
    holiday: null
  }

  let wrapper

  beforeEach(() => {
    wrapper = mount(ParticipantCard, {
      props: {
        participant: mockParticipant,
        status: mockStatus,
        localTime: '10:00 AM',
        removable: true
      },
      global: {
        stubs: {
          Card: {
            template: '<div class="card-stub"><slot name="content" /></div>'
          },
          Badge: {
            template: '<span class="badge-stub">{{ value }}</span>',
            props: ['value', 'severity']
          },
          Button: {
            template: '<button class="button-stub"><slot /></button>',
            props: ['icon', 'severity']
          }
        }
      }
    })
  })

  it('renders participant name', () => {
    expect(wrapper.text()).toContain('John Doe')
  })

  it('displays participant timezone', () => {
    expect(wrapper.text()).toContain('America/New_York')
  })

  it('displays participant country', () => {
    expect(wrapper.text()).toContain('United States')
    expect(wrapper.text()).toContain('US')
  })

  it('displays local time', () => {
    expect(wrapper.text()).toContain('10:00 AM')
  })

  it('displays status badge with correct label', () => {
    expect(wrapper.text()).toContain('Optimal')
  })

  it('displays participant notes', () => {
    expect(wrapper.text()).toContain('VP of Engineering')
  })

  it('shows remove button when removable is true', () => {
    expect(wrapper.find('.button-stub').exists()).toBe(true)
  })

  it('hides remove button when removable is false', async () => {
    await wrapper.setProps({ removable: false })
    expect(wrapper.find('.button-stub').exists()).toBe(false)
  })

  it('emits remove event when remove button is clicked', async () => {
    await wrapper.find('.button-stub').trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')[0]).toEqual(['1'])
  })

  it('displays critical badge when status is critical', async () => {
    await wrapper.setProps({
      status: {
        ...mockStatus,
        is_critical: true,
        status: 'red'
      }
    })
    expect(wrapper.text()).toContain('CRITICAL')
  })

  it('displays holiday information when present', async () => {
    await wrapper.setProps({
      status: {
        ...mockStatus,
        holiday: 'Independence Day'
      }
    })
    expect(wrapper.text()).toContain('Independence Day')
  })

  it('applies correct status class for green status', () => {
    expect(wrapper.html()).toContain('border-green-500')
  })

  it('applies correct status class for orange status', async () => {
    await wrapper.setProps({
      status: { ...mockStatus, status: 'orange' }
    })
    expect(wrapper.html()).toContain('border-orange-500')
  })

  it('applies correct status class for red status', async () => {
    await wrapper.setProps({
      status: { ...mockStatus, status: 'red' }
    })
    expect(wrapper.html()).toContain('border-red-500')
  })

  it('applies critical border when is_critical is true', async () => {
    await wrapper.setProps({
      status: { ...mockStatus, is_critical: true }
    })
    expect(wrapper.html()).toContain('border-red-600')
  })

  it('renders without status', async () => {
    await wrapper.setProps({ status: null })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('John Doe')
  })
})
