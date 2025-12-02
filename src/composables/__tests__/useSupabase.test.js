import { useSupabase } from '../useSupabase'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
  beforeEach(() => {
    // Mock environment variables
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    // Clean up environment variables
    vi.unstubAllEnvs()
  })

  it('returns a Supabase client instance', () => {
    const { supabase } = useSupabase()
    expect(supabase).toBe(mockSupabase)
  })
})
