import { config } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import { vi } from 'vitest'

// Mock Supabase client for all tests
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: vi.fn(() => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            order: vi.fn(),
            range: vi.fn()
          })),
          order: vi.fn(),
          range: vi.fn()
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn()
        }))
      })),
      auth: {
        getSession: vi.fn(),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signInWithOtp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } }
        }))
      },
      channel: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn()
        }))
      })),
      removeChannel: vi.fn()
    }
  }))
}))

config.global.plugins = [PrimeVue]
