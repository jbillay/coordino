import { useSupabase } from '../useSupabase'
import { describe, it, expect, vi } from 'vitest'

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
      }))
    }))
  }))
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

describe('useSupabase', () => {
  it('returns a Supabase client instance', () => {
    const { supabase } = useSupabase()
    expect(supabase).toBe(mockSupabase)
  })
})
