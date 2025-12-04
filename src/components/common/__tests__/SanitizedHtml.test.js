import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SanitizedHtml from '../SanitizedHtml.vue'

describe('SanitizedHtml.vue', () => {
  it('renders with empty HTML by default', () => {
    const wrapper = mount(SanitizedHtml)
    expect(wrapper.html()).toContain('<span></span>')
    expect(wrapper.find('span').html()).toBe('<span></span>')
  })

  it('renders with provided HTML', () => {
    const htmlContent = '<div><h1>Test Heading</h1><p>Test Paragraph</p></div>'
    const wrapper = mount(SanitizedHtml, {
      props: {
        html: htmlContent
      }
    })
    expect(wrapper.find('span').html()).toBe(`<span>${htmlContent}</span>`)
  })

  it('updates its innerHTML when the html prop changes', async () => {
    const wrapper = mount(SanitizedHtml)
    expect(wrapper.find('span').html()).toBe('<span></span>')

    await wrapper.setProps({ html: '<p>New Content</p>' })
    expect(wrapper.find('span').html()).toBe('<span><p>New Content</p></span>')

    await wrapper.setProps({ html: '<span>Another change</span>' })
    expect(wrapper.find('span').html()).toBe('<span><span>Another change</span></span>')
  })

  it('correctly sets initial innerHTML when component is mounted', () => {
    const htmlContent = '<b>Bold text</b>'
    const wrapper = mount(SanitizedHtml, {
      props: {
        html: htmlContent
      }
    })
    // The immediate watcher and onMounted should both set the initial HTML
    expect(wrapper.find('span').html()).toBe(`<span>${htmlContent}</span>`)
  })

  it('does not sanitize HTML content (demonstrates direct innerHTML setting)', () => {
    const maliciousHtml = '<img src="x" onerror="alert(\'XSS\')">'
    const wrapper = mount(SanitizedHtml, {
      props: {
        html: maliciousHtml
      }
    })
    // Expect the malicious script to be present, as this component simply sets innerHTML
    expect(wrapper.find('span').html()).toContain(maliciousHtml)
  })
})
