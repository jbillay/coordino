# QUICK_REFERENCE.md - Developer Quick Reference

## Common Tasks Reference

This guide provides quick commands and code snippets for common development tasks while building Coordino.

## Project Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Format code (if using Prettier)
npm run format
```

### Database Management
```bash
# Connect to Supabase CLI (if installed)
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --project-id your-project-ref > src/types/supabase.ts
```

## Creating New Features

### Adding a New Store (Pinia)

```javascript
// src/stores/yourFeature.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'

export const useYourFeatureStore = defineStore('yourFeature', () => {
  const { supabase } = useSupabase()
  const authStore = useAuthStore()
  
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const fetchItems = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('your_table')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      items.value = data
    } catch (e) {
      error.value = e.message
      console.error('Error fetching items:', e)
    } finally {
      loading.value = false
    }
  }
  
  const createItem = async (itemData) => {
    try {
      const { data, error: createError } = await supabase
        .from('your_table')
        .insert({
          user_id: authStore.user.id,
          ...itemData
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      items.value.unshift(data)
      return { success: true, data }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
  
  return {
    items,
    loading,
    error,
    fetchItems,
    createItem
  }
})
```

### Adding a New Route

```javascript
// In src/router/index.js
{
  path: '/your-feature',
  name: 'your-feature',
  component: () => import('@/views/YourFeatureView.vue'),
  meta: { requiresAuth: true }
}
```

### Creating a Component

```vue
<!-- src/components/YourComponent.vue -->
<template>
  <div class="your-component">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <p class="text-secondary">{{ description }}</p>
    
    <Button 
      :label="buttonLabel" 
      :loading="loading"
      @click="handleAction"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: String,
  buttonLabel: {
    type: String,
    default: 'Submit'
  }
})

const emit = defineEmits(['action'])

const loading = ref(false)

const handleAction = async () => {
  loading.value = true
  // Do something
  emit('action')
  loading.value = false
}
</script>

<style scoped>
.your-component {
  /* Component-specific styles using Tailwind or custom CSS */
}
</style>
```

## Database Operations

### Querying Data with Filters

```javascript
// Simple select with filter
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'open')

// Select with join
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    category:task_categories(id, name, color),
    status:task_statuses(id, name, color)
  `)
  .eq('user_id', userId)

// Select with multiple filters
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .in('priority', ['high', 'urgent'])
  .is('completed_at', null)
  .order('due_date', { ascending: true })

// Select with date range
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .gte('due_date', '2024-01-01')
  .lte('due_date', '2024-12-31')
```

### Inserting Data

```javascript
// Insert single record
const { data, error } = await supabase
  .from('tasks')
  .insert({
    user_id: authStore.user.id,
    title: 'New Task',
    description: 'Task description',
    status_id: statusId
  })
  .select()
  .single()

// Insert multiple records
const { data, error } = await supabase
  .from('tasks')
  .insert([
    { title: 'Task 1', user_id: userId },
    { title: 'Task 2', user_id: userId }
  ])
  .select()
```

### Updating Data

```javascript
// Update single record
const { data, error } = await supabase
  .from('tasks')
  .update({ 
    title: 'Updated Title',
    updated_at: new Date().toISOString()
  })
  .eq('id', taskId)
  .select()
  .single()

// Update with conditions
const { data, error } = await supabase
  .from('tasks')
  .update({ completed_at: new Date().toISOString() })
  .eq('status', 'open')
  .eq('user_id', userId)
  .select()
```

### Deleting Data

```javascript
// Delete single record
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId)

// Delete with conditions
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('user_id', userId)
  .lt('created_at', '2023-01-01')
```

## Real-time Subscriptions

```javascript
// Subscribe to table changes
const channel = supabase
  .channel('table_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received:', payload)
      // Update local state based on payload
      if (payload.eventType === 'INSERT') {
        items.value.unshift(payload.new)
      } else if (payload.eventType === 'UPDATE') {
        const index = items.value.findIndex(item => item.id === payload.new.id)
        if (index !== -1) {
          items.value[index] = payload.new
        }
      } else if (payload.eventType === 'DELETE') {
        items.value = items.value.filter(item => item.id !== payload.old.id)
      }
    }
  )
  .subscribe()

// Unsubscribe when component unmounts
onUnmounted(() => {
  supabase.removeChannel(channel)
})
```

## Authentication

### Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})
```

### Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})
```

### Magic Link

```javascript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### OAuth

```javascript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### Sign Out

```javascript
const { error } = await supabase.auth.signOut()
```

### Get Current User

```javascript
const { data: { user } } = await supabase.auth.getUser()
```

## Common Utility Functions

### Date Formatting

```javascript
import { format, parseISO, differenceInDays } from 'date-fns'

// Format date
const formatted = format(new Date(), 'MMM d, yyyy') // "Nov 25, 2024"

// Parse ISO string
const date = parseISO('2024-11-25')

// Calculate days difference
const days = differenceInDays(new Date(), parseISO(task.created_at))
```

### Timezone Conversion

```javascript
// Convert to specific timezone (requires date-fns-tz)
import { formatInTimeZone } from 'date-fns-tz'

const timeInTokyo = formatInTimeZone(
  new Date(),
  'Asia/Tokyo',
  'yyyy-MM-dd HH:mm:ss zzz'
)
```

### CSV Export

```javascript
const exportToCSV = (data, filename) => {
  // Convert array of objects to CSV
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val}"` : val
    ).join(',')
  )
  
  const csv = [headers, ...rows].join('\n')
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

// Usage
exportToCSV(tasks.value, 'tasks-export.csv')
```

## Component Composition Patterns

### Using Composables

```javascript
// src/composables/useTaskFilters.js
import { ref, computed } from 'vue'

export function useTaskFilters(tasks) {
  const statusFilter = ref(null)
  const categoryFilter = ref(null)
  const searchQuery = ref('')
  
  const filteredTasks = computed(() => {
    let result = tasks.value
    
    if (statusFilter.value) {
      result = result.filter(t => t.status_id === statusFilter.value)
    }
    
    if (categoryFilter.value) {
      result = result.filter(t => t.category_id === categoryFilter.value)
    }
    
    if (searchQuery.value) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }
    
    return result
  })
  
  return {
    statusFilter,
    categoryFilter,
    searchQuery,
    filteredTasks
  }
}

// Usage in component
import { useTaskFilters } from '@/composables/useTaskFilters'

const { statusFilter, categoryFilter, filteredTasks } = useTaskFilters(tasks)
```

## Debugging Tips

### Vue DevTools
Install Vue DevTools browser extension to inspect component state, Pinia stores, and router information.

### Supabase Logs
Check Supabase dashboard > Logs > API for failed queries and authentication issues.

### Console Logging
Use structured console logs:
```javascript
console.log('Task created:', { taskId, title, timestamp: Date.now() })
```

### Error Boundaries
Wrap error-prone code in try-catch:
```javascript
try {
  const result = await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  // Show user-friendly error message
  toast.add({
    severity: 'error',
    summary: 'Operation failed',
    detail: 'Please try again',
    life: 3000
  })
}
```

## Performance Tips

### Lazy Load Routes
```javascript
// Instead of: import TasksView from '@/views/TasksView.vue'
// Use: component: () => import('@/views/TasksView.vue')
```

### Virtual Scrolling
For long lists, use PrimeVue's VirtualScroller:
```vue
<VirtualScroller :items="tasks" :itemSize="100">
  <template v-slot:item="{ item }">
    <TaskCard :task="item" />
  </template>
</VirtualScroller>
```

### Debounce Search
```javascript
import { ref, watch } from 'vue'
import { debounce } from 'lodash-es'

const searchQuery = ref('')
const debouncedSearch = debounce((query) => {
  // Perform search
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})
```

## Testing Checklist

Before committing code:
- [ ] Test in both light and dark themes
- [ ] Test keyboard navigation
- [ ] Test on mobile viewport
- [ ] Verify error states display correctly
- [ ] Check loading states
- [ ] Ensure RLS policies work (can't access other users' data)
- [ ] Test with slow network (Chrome DevTools Network throttling)

## Environment Variables

Development (.env):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Production (Vercel):
Add the same variables in Vercel dashboard under Project Settings > Environment Variables.

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add feature: description"

# Push to GitHub
git push origin feature/your-feature-name

# Create pull request on GitHub
# After merge, Vercel automatically deploys
```

## Common Issues and Solutions

**Issue**: RLS policies blocking legitimate queries
**Solution**: Check that auth.uid() returns expected user ID. Verify policies in Supabase dashboard.

**Issue**: Dark mode colors not updating
**Solution**: Ensure theme classes applied to document root. Check CSS variable definitions for .dark selector.

**Issue**: PrimeVue components not styled
**Solution**: Verify PrimeVue CSS imported in main.js. Check that custom theme variables are defined.

**Issue**: Real-time subscriptions not working
**Solution**: Enable realtime in Supabase dashboard. Check that publication includes your table.

**Issue**: Vercel deployment fails
**Solution**: Check build logs. Ensure environment variables set in Vercel dashboard. Verify build command in vercel.json.

## Getting Help

- Check existing documentation files
- Review PrimeVue documentation: https://primevue.org/
- Review Supabase documentation: https://supabase.com/docs
- Review Vue 3 documentation: https://vuejs.org/
- Check Tailwind CSS documentation: https://tailwindcss.com/
