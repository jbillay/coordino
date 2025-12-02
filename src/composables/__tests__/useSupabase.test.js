import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Unmock the useSupabase composable for this test file (it's mocked globally in setup.js)
vi.unmock('@/composables/useSupabase')

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

  it('returns a Supabase client instance', async () => {
    // Dynamic import to ensure environment variables are set before the module is loaded
    const { useSupabase } = await import('../useSupabase')
    const { supabase } = useSupabase()
    expect(supabase).toBe(mockSupabase)
  })
})
