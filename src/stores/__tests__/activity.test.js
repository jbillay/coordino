import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useActivityStore } from '../activity'

describe('Activity Store', () => {
  let store
  let originalLocalStorage

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())

    // Mock localStorage
    originalLocalStorage = global.localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    global.localStorage = localStorageMock

    // Initialize store
    store = useActivityStore()
  })

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage
  })

  describe('trackActivity', () => {
    it('should track a new activity', () => {
      store.trackActivity('task', '123', 'Test Task', { priority: 'high' })

      expect(store.recentActivity).toHaveLength(1)
      expect(store.recentActivity[0]).toMatchObject({
        type: 'task',
        id: '123',
        title: 'Test Task',
        metadata: { priority: 'high' }
      })
      expect(store.recentActivity[0].timestamp).toBeDefined()
    })

    it('should add activity to the front of the list', () => {
      store.trackActivity('task', '1', 'First Task')
      store.trackActivity('note', '2', 'Second Note')

      expect(store.recentActivity[0].id).toBe('2')
      expect(store.recentActivity[1].id).toBe('1')
    })

    it('should remove duplicate activity before adding new one', () => {
      store.trackActivity('task', '123', 'Test Task')
      store.trackActivity('note', '456', 'Test Note')
      store.trackActivity('task', '123', 'Test Task Updated')

      expect(store.recentActivity).toHaveLength(2)
      expect(store.recentActivity[0].title).toBe('Test Task Updated')
      expect(store.recentActivity[1].title).toBe('Test Note')
    })

    it('should limit activities to MAX_ACTIVITIES (50)', () => {
      // Add 60 activities
      for (let i = 0; i < 60; i++) {
        store.trackActivity('task', `${i}`, `Task ${i}`)
      }

      expect(store.recentActivity).toHaveLength(50)
      expect(store.recentActivity[0].id).toBe('59')
      expect(store.recentActivity[49].id).toBe('10')
    })

    it('should save to localStorage after tracking', () => {
      store.trackActivity('task', '123', 'Test Task')

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'coordino_recent_activity',
        expect.any(String)
      )
    })

    it('should handle activity with no metadata', () => {
      store.trackActivity('meeting', '789', 'Test Meeting')

      expect(store.recentActivity[0].metadata).toEqual({})
    })

    it('should update timestamp when re-tracking same activity', () => {
      const firstTime = Date.now()
      vi.setSystemTime(firstTime)
      store.trackActivity('task', '123', 'Test Task')
      const firstTimestamp = store.recentActivity[0].timestamp

      vi.setSystemTime(firstTime + 5000)
      store.trackActivity('task', '123', 'Test Task')
      const secondTimestamp = store.recentActivity[0].timestamp

      expect(secondTimestamp).toBeGreaterThan(firstTimestamp)
      vi.useRealTimers()
    })
  })

  describe('getRecentActivities', () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        store.trackActivity('task', `${i}`, `Task ${i}`)
      }
    })

    it('should return limited number of activities (default 5)', () => {
      const recent = store.getRecentActivities()

      expect(recent.value).toHaveLength(5)
    })

    it('should return custom number of activities', () => {
      const recent = store.getRecentActivities(3)

      expect(recent.value).toHaveLength(3)
    })

    it('should return most recent activities first', () => {
      const recent = store.getRecentActivities(3)

      expect(recent.value[0].id).toBe('9')
      expect(recent.value[1].id).toBe('8')
      expect(recent.value[2].id).toBe('7')
    })

    it('should return all activities if limit is greater than count', () => {
      store.clearActivity()
      store.trackActivity('task', '1', 'Task 1')
      store.trackActivity('task', '2', 'Task 2')

      const recent = store.getRecentActivities(10)

      expect(recent.value).toHaveLength(2)
    })

    it('should return reactive computed ref', () => {
      const recent = store.getRecentActivities(3)
      const initialLength = recent.value.length

      store.trackActivity('new', '999', 'New Activity')

      expect(recent.value.length).toBe(initialLength)
      expect(recent.value[0].id).toBe('999')
    })
  })

  describe('clearActivity', () => {
    it('should clear all activities', () => {
      store.trackActivity('task', '1', 'Task 1')
      store.trackActivity('note', '2', 'Note 2')

      store.clearActivity()

      expect(store.recentActivity).toHaveLength(0)
    })

    it('should save to localStorage after clearing', () => {
      store.trackActivity('task', '1', 'Task 1')
      localStorage.setItem.mockClear()

      store.clearActivity()

      expect(localStorage.setItem).toHaveBeenCalledWith('coordino_recent_activity', '[]')
    })

    it('should work when already empty', () => {
      expect(() => store.clearActivity()).not.toThrow()
      expect(store.recentActivity).toHaveLength(0)
    })
  })

  describe('removeActivity', () => {
    beforeEach(() => {
      store.trackActivity('task', '1', 'Task 1')
      store.trackActivity('note', '2', 'Note 2')
      store.trackActivity('meeting', '3', 'Meeting 3')
    })

    it('should remove specific activity by type and id', () => {
      store.removeActivity('note', '2')

      expect(store.recentActivity).toHaveLength(2)
      expect(store.recentActivity.find((a) => a.type === 'note' && a.id === '2')).toBeUndefined()
    })

    it('should only remove exact matches', () => {
      store.removeActivity('task', '2')

      expect(store.recentActivity).toHaveLength(3)
      expect(store.recentActivity.find((a) => a.type === 'note' && a.id === '2')).toBeDefined()
    })

    it('should save to localStorage after removing', () => {
      localStorage.setItem.mockClear()

      store.removeActivity('task', '1')

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'coordino_recent_activity',
        expect.any(String)
      )
    })

    it('should handle removing non-existent activity gracefully', () => {
      expect(() => store.removeActivity('task', '999')).not.toThrow()
      expect(store.recentActivity).toHaveLength(3)
    })

    it('should remove only the specified type even with same id', () => {
      store.trackActivity('task', '100', 'Task 100')
      store.trackActivity('note', '100', 'Note 100')

      store.removeActivity('task', '100')

      expect(store.recentActivity.find((a) => a.type === 'task' && a.id === '100')).toBeUndefined()
      expect(store.recentActivity.find((a) => a.type === 'note' && a.id === '100')).toBeDefined()
    })
  })

  describe('loadActivity', () => {
    it('should load activities from localStorage on init', () => {
      const storedActivities = [
        { type: 'task', id: '1', title: 'Task 1', metadata: {}, timestamp: Date.now() },
        { type: 'note', id: '2', title: 'Note 2', metadata: {}, timestamp: Date.now() }
      ]

      localStorage.getItem.mockReturnValue(JSON.stringify(storedActivities))

      // Create a fresh pinia instance to get a truly new store
      setActivePinia(createPinia())
      const newStore = useActivityStore()

      expect(localStorage.getItem).toHaveBeenCalledWith('coordino_recent_activity')
      expect(newStore.recentActivity).toHaveLength(2)
    })

    it('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null)

      const newStore = useActivityStore()

      expect(newStore.recentActivity).toEqual([])
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json{')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a fresh pinia instance to get a truly new store
      setActivePinia(createPinia())
      const newStore = useActivityStore()

      expect(newStore.recentActivity).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load activity:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('saveActivity', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => store.trackActivity('task', '1', 'Task 1')).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save activity:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should save activities in correct JSON format', () => {
      store.trackActivity('task', '1', 'Task 1', { priority: 'high' })

      const savedData = localStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(savedData)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0]).toMatchObject({
        type: 'task',
        id: '1',
        title: 'Task 1',
        metadata: { priority: 'high' }
      })
    })
  })

  describe('activity types', () => {
    it('should track task activities', () => {
      store.trackActivity('task', '1', 'My Task')

      expect(store.recentActivity[0].type).toBe('task')
    })

    it('should track note activities', () => {
      store.trackActivity('note', '1', 'My Note')

      expect(store.recentActivity[0].type).toBe('note')
    })

    it('should track meeting activities', () => {
      store.trackActivity('meeting', '1', 'My Meeting')

      expect(store.recentActivity[0].type).toBe('meeting')
    })

    it('should preserve metadata for different types', () => {
      store.trackActivity('task', '1', 'Task', { status: 'done' })
      store.trackActivity('note', '2', 'Note', { topic: 'work' })
      store.trackActivity('meeting', '3', 'Meeting', { participants: 5 })

      expect(store.recentActivity[0].metadata.participants).toBe(5)
      expect(store.recentActivity[1].metadata.topic).toBe('work')
      expect(store.recentActivity[2].metadata.status).toBe('done')
    })
  })

  describe('edge cases', () => {
    it('should handle empty title', () => {
      store.trackActivity('task', '1', '')

      expect(store.recentActivity[0].title).toBe('')
    })

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000)
      store.trackActivity('task', '1', longTitle)

      expect(store.recentActivity[0].title).toBe(longTitle)
    })

    it('should handle special characters in title', () => {
      const title = 'Task <script>alert("xss")</script>'
      store.trackActivity('task', '1', title)

      expect(store.recentActivity[0].title).toBe(title)
    })

    it('should handle numeric ids as strings', () => {
      store.trackActivity('task', 123, 'Task')

      expect(store.recentActivity[0].id).toBe(123)
    })

    it('should handle complex metadata objects', () => {
      const metadata = {
        nested: { deeply: { value: 'test' } },
        array: [1, 2, 3],
        null: null,
        undefined
      }

      store.trackActivity('task', '1', 'Task', metadata)

      expect(store.recentActivity[0].metadata).toMatchObject(metadata)
    })
  })
})
