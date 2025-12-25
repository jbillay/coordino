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

const createClientMock = vi.fn(() => mockSupabase)

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock
}))

describe('useSupabase', () => {
  let originalURL
  let originalKey

  beforeEach(() => {
    // Save original values
    originalURL = import.meta.env.VITE_SUPABASE_URL
    originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Mock environment variables
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    // Reset module cache to clear singleton
    vi.resetModules()
    createClientMock.mockClear()
  })

  afterEach(() => {
    // Clean up environment variables
    vi.unstubAllEnvs()

    // Restore original values
    import.meta.env.VITE_SUPABASE_URL = originalURL
    import.meta.env.VITE_SUPABASE_ANON_KEY = originalKey
  })

  it('returns a Supabase client instance', async () => {
    vi.resetModules()
    const { useSupabase } = await import('../useSupabase.js')
    const { supabase } = useSupabase()
    expect(supabase).toBe(mockSupabase)
  })

  it('returns the same client instance on subsequent calls (singleton pattern)', async () => {
    vi.resetModules()
    const { useSupabase } = await import('../useSupabase.js')
    const { supabase: client1 } = useSupabase()
    const { supabase: client2 } = useSupabase()

    expect(client1).toBe(client2)
    expect(createClientMock).toHaveBeenCalledTimes(1)
  })

  it('throws error when VITE_SUPABASE_URL is missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow('Missing required environment variables: VITE_SUPABASE_URL')
  })

  it('throws error when VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow(
      'Missing required environment variables: VITE_SUPABASE_ANON_KEY'
    )
  })

  it('throws error when both environment variables are missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow(
      'Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY'
    )
  })

  it('throws error when VITE_SUPABASE_URL is not a valid URL', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-valid-url')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow('VITE_SUPABASE_URL is not a valid URL')
  })

  it('includes helpful error message for missing variables', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow(
      'Please copy .env.example to .env and add your Supabase credentials'
    )
  })

  it('includes helpful error message for invalid URL format', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'invalid')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow('Expected format: https://your-project-ref.supabase.co')
  })

  it('accepts valid https URL', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://myproject.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const { useSupabase } = await import('../useSupabase.js')
    const { supabase } = useSupabase()

    expect(supabase).toBeDefined()
  })

  it('accepts valid http URL (for local development)', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const { useSupabase } = await import('../useSupabase.js')
    const { supabase } = useSupabase()

    expect(supabase).toBeDefined()
  })

  it('validates URL format before creating client', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'just-a-string')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const { useSupabase } = await import('../useSupabase.js')

    expect(() => useSupabase()).toThrow()
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('creates client with correct parameters', async () => {
    vi.resetModules()
    const testUrl = 'https://test-project.supabase.co'
    const testKey = 'test-anon-key-123'

    vi.stubEnv('VITE_SUPABASE_URL', testUrl)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', testKey)

    const { useSupabase } = await import('../useSupabase.js')
    useSupabase()

    expect(createClientMock).toHaveBeenCalledWith(testUrl, testKey)
  })
})
