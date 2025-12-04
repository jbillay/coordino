import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAccessibilityAnnouncements } from '../useAccessibilityAnnouncements'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    nextTick: (fn) => fn && fn()
  }
})

describe('useAccessibilityAnnouncements', () => {
  let announcement, announcementPriority, announce

  beforeEach(() => {
    const {
      announcement: a,
      announcementPriority: ap,
      announce: an
    } = useAccessibilityAnnouncements()
    announcement = a
    announcementPriority = ap
    announce = an
  })

  it('should set the announcement message and priority', async () => {
    announce('Test message', 'assertive')
    await new Promise((resolve) => setTimeout(resolve, 105))
    expect(announcement.value).toBe('Test message')
    expect(announcementPriority.value).toBe('assertive')
  })

  it('should default to "polite" priority', async () => {
    announce('Test message')
    await new Promise((resolve) => setTimeout(resolve, 105))
    expect(announcement.value).toBe('Test message')
    expect(announcementPriority.value).toBe('polite')
  })
})
