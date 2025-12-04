import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import TopicDialog from '../TopicDialog.vue'
import { createTestingPinia } from '@pinia/testing'
import { useNotesStore } from '../../store'
import { useToast } from 'primevue/usetoast'

// Mock the toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('TopicDialog.vue', () => {
  let notesStore
  let toast
  let pinia

  const mockTopics = [
    {
      id: '1',
      name: 'Work',
      description: 'Work related notes',
      color: '#3b82f6'
    },
    {
      id: '2',
      name: 'Personal',
      description: 'Personal notes',
      color: '#10b981'
    }
  ]

  beforeEach(() => {
    toast = {
      add: vi.fn()
    }
    vi.mocked(useToast).mockReturnValue(toast)

    pinia = createTestingPinia({
      stubActions: false
    })

    notesStore = useNotesStore(pinia)
    notesStore.topics = [...mockTopics]
    notesStore.createTopic = vi.fn().mockResolvedValue({ success: true, data: { id: '3' } })
    notesStore.updateTopic = vi.fn().mockResolvedValue({ success: true, data: { id: '1' } })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mountComponent = (props = {}) =>
    mount(TopicDialog, {
      props: {
        visible: true,
        topic: null,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          Dialog: {
            template: `
              <div class="dialog" v-if="visible">
                <div class="dialog-header"><slot name="header" /></div>
                <div class="dialog-content"><slot /></div>
                <div class="dialog-footer"><slot name="footer" /></div>
              </div>
            `,
            props: ['visible', 'modal', 'closable', 'style'],
            emits: ['update:visible']
          },
          InputText: {
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'class', 'placeholder'],
            emits: ['update:modelValue', 'input']
          },
          Textarea: {
            template:
              '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
            props: ['modelValue', 'class', 'rows', 'placeholder'],
            emits: ['update:modelValue']
          },
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'icon', 'class', 'loading', 'disabled'],
            emits: ['click']
          }
        }
      }
    })

  describe('Component Rendering', () => {
    it('renders dialog for creating new topic', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.dialog').exists()).toBe(true)
      expect(wrapper.text()).toContain('Create New Topic')
      expect(wrapper.text()).toContain('Topic Name')
      expect(wrapper.text()).toContain('Description')
      expect(wrapper.text()).toContain('Color')
    })

    it('renders dialog for editing existing topic', () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })

      expect(wrapper.text()).toContain('Edit Topic')
      expect(wrapper.text()).toContain('Update')
    })

    it('displays form fields correctly', () => {
      const wrapper = mountComponent()

      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)

      const textareas = wrapper.findAll('textarea')
      expect(textareas.length).toBe(1)
    })

    it('displays action buttons', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      expect(buttons.length).toBe(2)

      const buttonLabels = buttons.map((b) => b.props('label'))
      expect(buttonLabels).toContain('Cancel')
      expect(buttonLabels).toContain('Create')
    })

    it('displays required field indicator', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('*')
    })
  })

  describe('Form Population', () => {
    it('populates form when editing topic', async () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })
      await nextTick()

      expect(wrapper.vm.formData.name).toBe('Work')
      expect(wrapper.vm.formData.description).toBe('Work related notes')
      expect(wrapper.vm.formData.color).toBe('#3b82f6')
    })

    it('resets form when topic becomes null', async () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })
      await nextTick()

      expect(wrapper.vm.formData.name).toBe('Work')

      await wrapper.setProps({ topic: null })
      await nextTick()

      expect(wrapper.vm.formData.name).toBe('')
      expect(wrapper.vm.formData.description).toBe('')
    })

    it('handles missing description when editing', async () => {
      const topicWithoutDescription = { ...mockTopics[0], description: undefined }
      const wrapper = mountComponent({ topic: topicWithoutDescription })
      await nextTick()

      expect(wrapper.vm.formData.description).toBe('')
    })

    it('uses default color when topic color is missing', async () => {
      const topicWithoutColor = { ...mockTopics[0], color: undefined }
      const wrapper = mountComponent({ topic: topicWithoutColor })
      await nextTick()

      expect(wrapper.vm.formData.color).toBeTruthy()
    })
  })

  describe('Form Validation', () => {
    it('shows validation error for empty name', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await nextTick()

      expect(notesStore.createTopic).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('Topic name is required')
    })

    it('shows validation error for duplicate name', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('Work')
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await nextTick()

      expect(notesStore.createTopic).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('already exists')
    })

    it('allows duplicate name when editing same topic', async () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Update')
      await submitButton.trigger('click')
      await flushPromises()

      expect(notesStore.updateTopic).toHaveBeenCalled()
    })

    it('clears error when user starts typing', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await nextTick()

      expect(wrapper.html()).toContain('Topic name is required')
      expect(wrapper.vm.errors.name).toBeDefined()

      // Call clearError directly to simulate the @input event
      wrapper.vm.clearError('name')
      await nextTick()

      expect(wrapper.vm.errors.name).toBeUndefined()
    })
  })

  describe('Creating Topic', () => {
    it('creates new topic with valid data', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('New Topic')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test description')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(notesStore.createTopic).toHaveBeenCalledWith({
        name: 'New Topic',
        description: 'Test description',
        color: expect.any(String)
      })
    })

    it('shows success toast on successful creation', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('New Topic')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Topic Created',
          detail: expect.stringContaining('New Topic'),
          life: 3000
        })
      )
    })

    it('emits saved and update:visible events on success', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('New Topic')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(wrapper.emitted('saved')).toBeTruthy()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')[0]).toEqual([false])
    })

    it('shows error toast on creation failure', async () => {
      notesStore.createTopic.mockResolvedValueOnce({
        success: false,
        error: 'Database error'
      })

      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('New Topic')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Database error',
          life: 5000
        })
      )
    })

    it('resets form after successful creation', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('New Topic')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(wrapper.vm.formData.name).toBe('')
      expect(wrapper.vm.formData.description).toBe('')
    })
  })

  describe('Updating Topic', () => {
    it('updates existing topic with modified data', async () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })
      await nextTick()

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('Updated Work')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Update')
      await submitButton.trigger('click')
      await flushPromises()

      expect(notesStore.updateTopic).toHaveBeenCalledWith('1', {
        name: 'Updated Work',
        description: 'Work related notes',
        color: '#3b82f6'
      })
    })

    it('shows success toast on successful update', async () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Update')
      await submitButton.trigger('click')
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Topic Updated'
        })
      )
    })

    it('shows error toast on update failure', async () => {
      notesStore.updateTopic.mockResolvedValueOnce({
        success: false,
        error: 'Update failed'
      })

      const wrapper = mountComponent({ topic: mockTopics[0] })
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Update')
      await submitButton.trigger('click')
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Update failed'
        })
      )
    })
  })

  describe('Color Selection', () => {
    it('allows selecting preset colors', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const colorButtons = wrapper.findAll('button[type="button"]')
      expect(colorButtons.length).toBeGreaterThan(0)

      await colorButtons[1].trigger('click')
      await nextTick()

      expect(wrapper.vm.formData.color).toBeTruthy()
    })

    it('displays custom color input', () => {
      const wrapper = mountComponent()

      const colorInput = wrapper.find('input[type="color"]')
      expect(colorInput.exists()).toBe(true)
    })

    it('displays current color value', () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })

      expect(wrapper.text()).toContain('#3b82f6')
    })

    it('allows custom color input', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const colorInput = wrapper.find('input[type="color"]')
      await colorInput.setValue('#ff5733')
      await nextTick()

      expect(wrapper.vm.formData.color).toBe('#ff5733')
    })
  })

  describe('Cancel Action', () => {
    it('emits update:visible with false when cancel is clicked', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const cancelButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Cancel')
      await cancelButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')[0]).toEqual([false])
    })

    it('resets form when cancel is clicked', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('Test Topic')
      await nextTick()

      const cancelButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Cancel')
      await cancelButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.formData.name).toBe('')
    })

    it('disables cancel button during submission', async () => {
      const wrapper = mountComponent()
      await nextTick()

      wrapper.vm.loading = true
      await nextTick()

      const cancelButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Cancel')

      expect(cancelButton.props('disabled')).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('shows loading state on submit button during submission', async () => {
      const wrapper = mountComponent()
      await nextTick()

      wrapper.vm.loading = true
      await nextTick()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')

      expect(submitButton.props('loading')).toBe(true)
    })

    it('does not show loading state initially', () => {
      const wrapper = mountComponent()

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')

      expect(submitButton.props('loading')).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('computes isEdit correctly when topic is provided', () => {
      const wrapper = mountComponent({ topic: mockTopics[0] })

      expect(wrapper.vm.isEdit).toBe(true)
    })

    it('computes isEdit correctly when topic is null', () => {
      const wrapper = mountComponent()

      expect(wrapper.vm.isEdit).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty description gracefully', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('New Topic')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(notesStore.createTopic).toHaveBeenCalledWith(
        expect.objectContaining({
          description: ''
        })
      )
    })

    it('handles network errors during submission', async () => {
      notesStore.createTopic.mockRejectedValueOnce(new Error('Network error'))

      const wrapper = mountComponent()
      await nextTick()

      const input = wrapper.find('input')
      await input.setValue('New Topic')

      const submitButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((b) => b.props('label') === 'Create')
      await submitButton.trigger('click')
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error'
        })
      )
    })

    it('handles very long topic names', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const longName = 'A'.repeat(200)
      const input = wrapper.find('input')
      await input.setValue(longName)
      await nextTick()

      expect(wrapper.vm.formData.name).toBe(longName)
    })

    it('handles special characters in topic name', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const specialName = 'Test & Topic <>'
      const input = wrapper.find('input')
      await input.setValue(specialName)
      await nextTick()

      expect(wrapper.vm.formData.name).toBe(specialName)
    })
  })
})
