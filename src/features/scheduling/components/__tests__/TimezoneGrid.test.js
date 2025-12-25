import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TimezoneGrid from '../TimezoneGrid.vue'

describe('TimezoneGrid.vue', () => {
  let wrapper

  const mockParticipants = [
    {
      id: 1,
      name: 'Alice Johnson',
      timezone: 'America/New_York',
      status: 'green',
      formattedTime: '9:00 AM',
      offset: 'UTC-5',
      config: {
        green_start: '09:00',
        green_end: '17:00'
      }
    },
    {
      id: 2,
      name: 'Bob Smith',
      timezone: 'Europe/London',
      status: 'orange',
      formattedTime: '2:00 PM',
      offset: 'UTC+0',
      config: {
        green_start: '08:00',
        green_end: '16:00'
      }
    },
    {
      id: 3,
      name: 'Charlie Lee',
      timezone: 'Asia/Tokyo',
      status: 'red',
      formattedTime: '11:00 PM',
      offset: 'UTC+9',
      config: null // Should use default config
    },
    {
      id: 4,
      name: 'Diana Prince',
      timezone: 'Australia/Sydney',
      status: 'critical',
      formattedTime: '1:00 AM',
      offset: 'UTC+11',
      config: {
        green_start: '09:00',
        green_end: '17:00'
      }
    }
  ]

  const mountComponent = (props = {}) =>
    mount(TimezoneGrid, {
      props,
      global: {
        stubs: {
          Badge: {
            name: 'Badge',
            template: '<span class="badge" :data-severity="severity">{{ value }}</span>',
            props: ['value', 'severity']
          }
        }
      }
    })

  beforeEach(() => {
    wrapper = null
  })

  describe('Empty State', () => {
    it('should render empty state when no participants provided', () => {
      wrapper = mountComponent()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No participants added yet')
      expect(wrapper.text()).toContain('Add participants to see timezone impact analysis')
      expect(wrapper.find('.pi-users').exists()).toBe(true)
    })

    it('should render empty state when participants array is empty', () => {
      wrapper = mountComponent({ participants: [] })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.grid-container').exists()).toBe(false)
    })
  })

  describe('Grid Rendering', () => {
    beforeEach(() => {
      wrapper = mountComponent({ participants: mockParticipants })
    })

    it('should render grid title', () => {
      expect(wrapper.find('.grid-title').text()).toBe('Timezone Impact')
    })

    it('should render grid container when participants exist', () => {
      expect(wrapper.find('.grid-container').exists()).toBe(true)
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('should render correct number of participant cards', () => {
      const cards = wrapper.findAll('.participant-card')
      expect(cards.length).toBe(mockParticipants.length)
    })

    it('should render each participant name correctly', () => {
      mockParticipants.forEach((participant) => {
        expect(wrapper.text()).toContain(participant.name)
      })
    })

    it('should render participant timezone', () => {
      expect(wrapper.text()).toContain('America/New_York')
      expect(wrapper.text()).toContain('Europe/London')
      expect(wrapper.text()).toContain('Asia/Tokyo')
    })

    it('should render participant local time', () => {
      expect(wrapper.text()).toContain('9:00 AM')
      expect(wrapper.text()).toContain('2:00 PM')
      expect(wrapper.text()).toContain('11:00 PM')
    })

    it('should render participant offset', () => {
      expect(wrapper.text()).toContain('UTC-5')
      expect(wrapper.text()).toContain('UTC+0')
      expect(wrapper.text()).toContain('UTC+9')
    })
  })

  describe('Status Display', () => {
    beforeEach(() => {
      wrapper = mountComponent({ participants: mockParticipants })
    })

    it('should apply correct status class to each card', () => {
      const cards = wrapper.findAll('.participant-card')

      expect(cards[0].classes()).toContain('status-green')
      expect(cards[1].classes()).toContain('status-orange')
      expect(cards[2].classes()).toContain('status-red')
      expect(cards[3].classes()).toContain('status-critical')
    })

    it('should display correct status badge for green status', () => {
      const badges = wrapper.findAllComponents({ name: 'Badge' })
      const greenBadge = badges[0]

      expect(greenBadge.props('value')).toBe('Optimal')
      expect(greenBadge.props('severity')).toBe('success')
    })

    it('should display correct status badge for orange status', () => {
      const badges = wrapper.findAllComponents({ name: 'Badge' })
      const orangeBadge = badges[1]

      expect(orangeBadge.props('value')).toBe('Acceptable')
      expect(orangeBadge.props('severity')).toBe('warn')
    })

    it('should display correct status badge for red status', () => {
      const badges = wrapper.findAllComponents({ name: 'Badge' })
      const redBadge = badges[2]

      expect(redBadge.props('value')).toBe('Poor')
      expect(redBadge.props('severity')).toBe('danger')
    })

    it('should display correct status badge for critical status', () => {
      const badges = wrapper.findAllComponents({ name: 'Badge' })
      const criticalBadge = badges[3]

      expect(criticalBadge.props('value')).toBe('Critical')
      expect(criticalBadge.props('severity')).toBe('danger')
    })
  })

  describe('Helper Functions', () => {
    beforeEach(() => {
      wrapper = mountComponent({ participants: mockParticipants })
    })

    it('should format working hours correctly with participant config', () => {
      const workingHoursText = wrapper.text()
      expect(workingHoursText).toContain('09:00 - 17:00')
      expect(workingHoursText).toContain('08:00 - 16:00')
    })

    it('should use default config when participant config is null', () => {
      // Charlie Lee has null config, should use default
      const cards = wrapper.findAll('.participant-card')
      const charlieCard = cards[2]

      // Default config is 09:00 - 17:00
      expect(charlieCard.text()).toContain('09:00 - 17:00')
    })

    it('should return correct status label for all status types', () => {
      const { vm } = wrapper

      expect(vm.getStatusLabel('green')).toBe('Optimal')
      expect(vm.getStatusLabel('orange')).toBe('Acceptable')
      expect(vm.getStatusLabel('red')).toBe('Poor')
      expect(vm.getStatusLabel('critical')).toBe('Critical')
    })

    it('should return original status for unknown status types', () => {
      const { vm } = wrapper

      expect(vm.getStatusLabel('unknown')).toBe('unknown')
      expect(vm.getStatusLabel('custom')).toBe('custom')
    })

    it('should return correct severity for all status types', () => {
      const { vm } = wrapper

      expect(vm.getStatusSeverity('green')).toBe('success')
      expect(vm.getStatusSeverity('orange')).toBe('warn')
      expect(vm.getStatusSeverity('red')).toBe('danger')
      expect(vm.getStatusSeverity('critical')).toBe('danger')
    })

    it('should return secondary severity for unknown status types', () => {
      const { vm } = wrapper

      expect(vm.getStatusSeverity('unknown')).toBe('secondary')
      expect(vm.getStatusSeverity('')).toBe('secondary')
    })

    it('should format working hours correctly', () => {
      const { vm } = wrapper

      const config1 = { green_start: '09:00', green_end: '17:00' }
      expect(vm.formatWorkingHours(config1)).toBe('09:00 - 17:00')

      const config2 = { green_start: '08:00', green_end: '16:00' }
      expect(vm.formatWorkingHours(config2)).toBe('08:00 - 16:00')
    })
  })

  describe('Icons and Labels', () => {
    beforeEach(() => {
      wrapper = mountComponent({ participants: mockParticipants })
    })

    it('should render location icon', () => {
      expect(wrapper.find('.pi-map-marker').exists()).toBe(true)
    })

    it('should render clock icon', () => {
      expect(wrapper.find('.pi-clock').exists()).toBe(true)
    })

    it('should render globe icon for offset', () => {
      expect(wrapper.find('.pi-globe').exists()).toBe(true)
    })

    it('should render calendar icon for working hours', () => {
      expect(wrapper.find('.pi-calendar').exists()).toBe(true)
    })

    it('should render all info labels', () => {
      expect(wrapper.text()).toContain('Location')
      expect(wrapper.text()).toContain('Local Time')
      expect(wrapper.text()).toContain('Offset')
      expect(wrapper.text()).toContain('Working Hours')
    })
  })

  describe('Responsive Grid Layout', () => {
    it('should apply grid-container class for responsive layout', () => {
      wrapper = mountComponent({ participants: mockParticipants })

      const gridContainer = wrapper.find('.grid-container')
      expect(gridContainer.exists()).toBe(true)
    })

    it('should render all cards within grid container', () => {
      wrapper = mountComponent({ participants: mockParticipants })

      const gridContainer = wrapper.find('.grid-container')
      const cards = gridContainer.findAll('.participant-card')

      expect(cards.length).toBe(mockParticipants.length)
    })
  })

  describe('Card Structure', () => {
    beforeEach(() => {
      wrapper = mountComponent({ participants: [mockParticipants[0]] })
    })

    it('should render card header with name and badge', () => {
      const header = wrapper.find('.card-header')

      expect(header.exists()).toBe(true)
      expect(header.find('.participant-name').exists()).toBe(true)
      expect(header.findComponent({ name: 'Badge' }).exists()).toBe(true)
    })

    it('should render card body with all info rows', () => {
      const body = wrapper.find('.card-body')
      const infoRows = body.findAll('.info-row')

      expect(infoRows.length).toBe(4) // Location, Local Time, Offset, Working Hours
    })

    it('should render info labels and values correctly', () => {
      const infoRows = wrapper.findAll('.info-row')

      infoRows.forEach((row) => {
        expect(row.find('.info-label').exists()).toBe(true)
        expect(row.find('.info-value').exists()).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle single participant', () => {
      wrapper = mountComponent({ participants: [mockParticipants[0]] })

      expect(wrapper.findAll('.participant-card').length).toBe(1)
      expect(wrapper.text()).toContain('Alice Johnson')
    })

    it('should handle participant with missing data gracefully', () => {
      const incompleteParticipant = {
        id: 5,
        name: 'Test User',
        timezone: '',
        status: 'green',
        formattedTime: '',
        offset: '',
        config: null
      }

      wrapper = mountComponent({ participants: [incompleteParticipant] })

      expect(wrapper.find('.participant-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test User')
    })

    it('should handle null participants prop', () => {
      wrapper = mountComponent({ participants: null })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('should handle undefined participants prop', () => {
      wrapper = mountComponent({ participants: undefined })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountComponent({ participants: mockParticipants })
    })

    it('should have proper heading hierarchy', () => {
      expect(wrapper.find('.grid-title').element.tagName).toBe('H3')
      expect(wrapper.find('.participant-name').element.tagName).toBe('H4')
    })

    it('should use semantic HTML for info sections', () => {
      const infoLabels = wrapper.findAll('.info-label')
      const infoValues = wrapper.findAll('.info-value')

      expect(infoLabels.length).toBeGreaterThan(0)
      expect(infoValues.length).toBeGreaterThan(0)
    })
  })

  describe('Reactivity', () => {
    it('should update when participants prop changes', async () => {
      wrapper = mountComponent({ participants: [mockParticipants[0]] })

      expect(wrapper.findAll('.participant-card').length).toBe(1)

      await wrapper.setProps({ participants: mockParticipants })

      expect(wrapper.findAll('.participant-card').length).toBe(4)
    })

    it('should toggle between empty state and grid when participants change', async () => {
      wrapper = mountComponent({ participants: mockParticipants })

      expect(wrapper.find('.grid-container').exists()).toBe(true)
      expect(wrapper.find('.empty-state').exists()).toBe(false)

      await wrapper.setProps({ participants: [] })

      expect(wrapper.find('.grid-container').exists()).toBe(false)
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })
})
