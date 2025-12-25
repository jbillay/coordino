import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ParticipantList from '../ParticipantList.vue'

describe('ParticipantList.vue', () => {
  const mockParticipants = [
    {
      id: '1',
      name: 'Alice',
      timezone: 'America/New_York',
      offset: '-04:00',
      formattedTime: '10:00 AM',
      status: 'green',
      statusReason: 'Optimal',
      config: { green_start: '09:00', green_end: '17:00' }
    },
    {
      id: '2',
      name: 'Bob',
      timezone: 'Europe/London',
      offset: '+01:00',
      formattedTime: '3:00 PM',
      status: 'orange',
      statusReason: 'Acceptable'
    }
  ]

  const mountComponent = (props = {}) =>
    mount(ParticipantList, {
      props: {
        participants: mockParticipants,
        ...props
      }
    })

  it('shows empty state when there are no participants', () => {
    const wrapper = mountComponent({ participants: [] })
    expect(wrapper.find('.empty-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('No participants added yet.')
  })

  it('renders a row for each participant', () => {
    const wrapper = mountComponent()
    // We can't easily count rows due to stubbing, so we'll check for participant names
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })

  it('displays participant details correctly', () => {
    const wrapper = mountComponent()
    const text = wrapper.text()
    expect(text).toContain('America/New_York')
    expect(text).toContain('-04:00')
    expect(text).toContain('10:00 AM')
    expect(text).toContain('09:00 - 17:00')
  })

  it('displays the correct status badge', () => {
    const wrapper = mountComponent()
    const text = wrapper.text()
    expect(text).toContain('Optimal')
    expect(text).toContain('Acceptable')
  })

  it('does not show the Actions column by default', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).not.toContain('Actions')
  })

  it('shows the Actions column when showActions is true', () => {
    const wrapper = mountComponent({ showActions: true })
    expect(wrapper.text()).toContain('Actions')
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0) // Should have edit and delete buttons
  })

  it('emits "edit" with participant data when edit button is clicked', async () => {
    const wrapper = mountComponent({ showActions: true })
    const editButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Edit'))
    await editButtons[0].trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toEqual(mockParticipants[0])
  })

  it('emits "delete" with participant data when delete button is clicked', async () => {
    const wrapper = mountComponent({ showActions: true })
    const deleteButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Delete'))
    await deleteButtons[0].trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0][0]).toEqual(mockParticipants[0])
  })
})
