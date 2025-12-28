# Research: User & Application Configuration

**Feature**: `001-user-config`
**Phase**: 0 (Research)
**Date**: 2025-12-27

## Purpose

This research document resolves technical uncertainties and clarifications needed before proceeding with detailed design (Phase 1). All items marked as "NEEDS CLARIFICATION" in the specification are investigated and resolved here.

## Clarification Status

**Specification Review**: The specification (spec.md) contains NO "NEEDS CLARIFICATION" markers. All ambiguities were resolved during the `/speckit.clarify` workflow on 2025-12-27:

- ✅ Email service: Supabase Auth built-in email
- ✅ Error tracking/logging: Supabase Dashboard + browser console.error
- ✅ Data volume limits: 5,000 tasks, 3,000 notes (soft limits with UI warning)
- ✅ Session timeout: 30 minutes inactivity, 2-minute warning at 28 minutes
- ✅ Export formats: Both JSON (full fidelity) and CSV (spreadsheet compatibility)

**Result**: No additional research required for spec clarifications.

## Technical Integration Research

### 1. Supabase Auth Password Reset Flow

**Question**: How does Supabase Auth's built-in password reset work with email delivery and token management?

**Research Findings**:

**API Methods** (verified via Supabase documentation):
- `supabase.auth.resetPasswordForEmail(email, options)`: Initiates password reset, sends email with magic link
- Email contains URL like: `https://coordino.app/reset-password?token=...&type=recovery`
- Token validity: 24 hours (configurable in Supabase Auth settings)
- `supabase.auth.verifyOtp({token_hash, type: 'recovery'})`: Validates reset token
- `supabase.auth.updateUser({password: newPassword})`: Sets new password after token verification

**Email Template Customization**:
- Supabase provides default email templates in Dashboard > Authentication > Email Templates
- Can customize subject line, body text, and button styling
- Use `{{ .ConfirmationURL }}` variable for reset link
- Coordino branding: Update template to use brand teal (#14b8a6) for CTA button

**Session Invalidation**:
- Supabase Auth automatically invalidates all existing sessions when password changes
- Implements via `aud` claim change in JWT tokens
- User must log in again after password reset (security best practice)

**Implementation Approach**:
```javascript
// In usePasswordReset.js composable
const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
}

const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  // Auto-invalidates all sessions
}
```

**Decision**: Use Supabase Auth's native flow with customized email template. No external email service needed.

---

### 2. Virtual Scrolling for Performance at Scale

**Question**: How should virtual scrolling be implemented for task/note lists with 1,000+ items while maintaining 60fps?

**Research Findings**:

**Library Options**:
1. **vue-virtual-scroller** (Recommended)
   - Designed for Vue 3, actively maintained
   - Supports dynamic item heights (important for task descriptions of varying length)
   - Provides `RecycleScroller` component with buffer management
   - Performance: Handles 10,000+ items smoothly

2. **tanstack/virtual** (Alternative)
   - Framework-agnostic virtual scrolling
   - More manual setup required for Vue integration
   - Better for complex grid layouts (not needed for Coordino's lists)

**Implementation Pattern**:
```vue
<template>
  <RecycleScroller
    :items="tasks"
    :item-size="80"
    :buffer="200"
    key-field="id"
    v-slot="{ item }"
  >
    <TaskCard :task="item" />
  </RecycleScroller>
</template>
```

**Performance Characteristics**:
- Renders only visible items + buffer (typically 20-30 items max)
- DOM nodes recycled as user scrolls
- Memory footprint: O(visible items) instead of O(total items)
- Scroll performance: Consistent 60fps even with 5,000+ items

**Trade-offs**:
- ✅ Pro: Dramatic performance improvement for large datasets
- ✅ Pro: Maintains native scroll behavior
- ⚠️ Con: Slightly more complex than plain `v-for` loop
- ⚠️ Con: Requires fixed or estimated item heights for best performance

**Decision**: Implement virtual scrolling using `vue-virtual-scroller` for TasksView and NotesView when item count exceeds 100 (FR-029, FR-030).

---

### 3. Data Export: JSON and CSV Generation

**Question**: How should data be formatted and archived for export in both JSON and CSV formats?

**Research Findings**:

**JSON Export**:
- Native `JSON.stringify()` sufficient for basic export
- Preserve full data structure including nested objects (topics → notes relationship)
- Include metadata: export timestamp, Coordino version, schema version
- Example structure:
  ```json
  {
    "exportedAt": "2025-12-27T10:30:00Z",
    "coordinoVersion": "1.0.0",
    "schemaVersion": "1",
    "user": { "id": "uuid", "email": "user@example.com" },
    "tasks": [...],
    "notes": [...],
    "topics": [...]
  }
  ```

**CSV Export**:
- Use library: `papaparse` (recommended) or `json2csv`
- Flatten nested structures (e.g., topic.name instead of topic object in notes CSV)
- Separate CSV file per entity type (tasks.csv, notes.csv, topics.csv)
- Include headers with human-readable column names
- Example for tasks.csv:
  ```csv
  Title,Description,Status,Category,Priority,Due Date,Created At
  "Review PR #42","Check for security issues","In Progress","Development","high","2025-12-28","2025-12-20T14:30:00Z"
  ```

**Archive Creation**:
- Use library: `jszip` (browser-compatible, no backend needed)
- Create folder structure inside zip:
  ```
  coordino_export_20251227/
  ├── README.txt (export metadata, instructions)
  ├── json/
  │   └── full_export.json
  └── csv/
      ├── tasks.csv
      ├── notes.csv
      └── topics.csv
  ```

**Implementation Approach**:
```javascript
import JSZip from 'jszip'
import Papa from 'papaparse'

const generateExport = async (userData) => {
  const zip = new JSZip()

  // Add JSON export
  const jsonExport = {
    exportedAt: new Date().toISOString(),
    ...userData
  }
  zip.file('json/full_export.json', JSON.stringify(jsonExport, null, 2))

  // Add CSV exports
  const tasksCsv = Papa.unparse(userData.tasks)
  zip.file('csv/tasks.csv', tasksCsv)

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `coordino_export_${Date.now()}.zip`)
}
```

**Decision**: Use `jszip` + `papaparse` for dual-format export with organized archive structure.

---

### 4. Session Timeout Detection

**Question**: How should inactivity be tracked to trigger the 30-minute timeout warning?

**Research Findings**:

**Supabase Session Management**:
- Default session expiration: 1 hour (configurable in Supabase Dashboard)
- Auto-refresh: Supabase client refreshes tokens automatically before expiration
- No built-in inactivity tracking (only absolute expiration)

**Custom Inactivity Implementation Required**:
- Track user interactions: mousemove, keydown, click, scroll, touch events
- Reset timer on any interaction
- Warn at 28 minutes (2 minutes before 30-minute timeout)
- Log out at 30 minutes if no interaction or extension

**Implementation Pattern**:
```javascript
// In useSessionTimeout.js composable
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_THRESHOLD = 28 * 60 * 1000 // 28 minutes

const setupInactivityDetection = () => {
  let lastActivity = Date.now()
  let warningShown = false

  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
  const resetTimer = () => {
    lastActivity = Date.now()
    warningShown = false
  }

  events.forEach(event => {
    document.addEventListener(event, resetTimer, { passive: true })
  })

  const checkInactivity = setInterval(() => {
    const inactiveDuration = Date.now() - lastActivity

    if (inactiveDuration >= INACTIVITY_TIMEOUT) {
      // Log out user
      clearInterval(checkInactivity)
      signOut()
    } else if (inactiveDuration >= WARNING_THRESHOLD && !warningShown) {
      // Show warning
      showWarningDialog()
      warningShown = true
    }
  }, 10000) // Check every 10 seconds
}
```

**localStorage Sync** (for multi-tab scenarios):
- Store last activity timestamp in localStorage
- Each tab reads/writes on interaction
- Prevents one tab logging out while another is active

**Decision**: Implement custom inactivity detection with localStorage sync for multi-tab support.

---

### 5. Accessibility: ARIA Live Regions for Dynamic Content

**Question**: How should ARIA live regions be implemented for search results and notifications?

**Research Findings**:

**ARIA Live Region Politeness Levels**:
- `aria-live="polite"`: Announces when user is idle (use for search results)
- `aria-live="assertive"`: Interrupts immediately (use for critical errors)
- `aria-live="off"`: No announcements (default)

**Vue Integration**:
```vue
<template>
  <!-- Search results announcement -->
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    {{ searchResultAnnouncement }}
  </div>

  <!-- Visual results -->
  <div role="region" aria-label="Search results">
    <p>{{ results.length }} notes found</p>
    <ul>...</ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const searchResultAnnouncement = computed(() => {
  if (results.value.length === 0) return 'No results found'
  if (results.value.length === 1) return '1 result found'
  return `${results.value.length} results found`
})
</script>
```

**Best Practices**:
- Use `.sr-only` CSS class (screen-reader only) to hide visual duplicate
- Update announcement text, not DOM structure (aria-atomic="true")
- Debounce search to avoid excessive announcements
- Pair with visual status updates for sighted users

**Testing**:
- Test with NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)
- Verify announcements occur after content updates
- Ensure announcements are concise and meaningful

**Decision**: Implement polite live regions for search results, assertive for critical errors, with sr-only visual hiding.

---

## Technology Context Updates

Based on research findings, the following technologies/libraries will be added to the project:

### New Dependencies to Add

```json
{
  "dependencies": {
    "vue-virtual-scroller": "^2.0.0-beta.8",
    "jszip": "^3.10.1",
    "papaparse": "^5.4.1"
  }
}
```

**Rationale**:
- `vue-virtual-scroller`: Performance at scale (5,000+ items)
- `jszip`: Browser-based archive creation for data export
- `papaparse`: CSV generation with proper escaping and formatting

### Supabase Configuration Changes

**Email Template Customization** (in Supabase Dashboard):
- Navigate to Authentication > Email Templates
- Customize "Reset Password" template
- Update CTA button color to brand teal (#14b8a6)
- Test email delivery with development email address

**Session Settings** (no changes required):
- Keep default 1-hour JWT expiration
- Custom inactivity detection handles 30-minute timeout independently

---

## Research Summary

All technical uncertainties resolved:

1. ✅ **Password Reset**: Supabase Auth native flow, customized email template
2. ✅ **Virtual Scrolling**: vue-virtual-scroller for 100+ item lists
3. ✅ **Data Export**: jszip + papaparse for dual JSON/CSV format
4. ✅ **Session Timeout**: Custom inactivity detection with localStorage sync
5. ✅ **Accessibility**: ARIA live regions (polite for search, assertive for errors)

**No blocking technical issues identified.** Ready to proceed to Phase 1 (Design & Contracts).

---

## Next Steps

1. Proceed to **Phase 1: Design & Contracts**
   - Create data-model.md (database schema changes)
   - Create contracts/ (API contracts for Supabase interactions)
   - Create quickstart.md (setup and testing instructions)

2. Update agent context with new dependencies (run update-agent-context.ps1)

3. Re-evaluate Constitution Check after design phase
