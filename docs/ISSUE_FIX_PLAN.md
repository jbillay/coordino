# GitHub Issues - Fix Plan

**Created:** December 22, 2025
**Total Issues:** 7
**Status:** All issues analyzed and prioritized

---

## 📊 Issues Summary

| Priority | Issue # | Module | Title | Complexity |
|----------|---------|--------|-------|------------|
| 🔴 CRITICAL | #25 | Meeting | Database schema error | Medium |
| 🔴 HIGH | #27 | FAB | Actions don't work | Low |
| 🟡 HIGH | #23 | Notes | UI not usable | High |
| 🟡 HIGH | #24 | Notes | Cannot assign topics | Medium |
| 🟢 MEDIUM | #26 | Meeting | Improve UI layout | Medium |
| 🟢 MEDIUM | #22 | Dashboard | Connect meetings | Low |
| 🟢 MEDIUM | #21 | Dashboard | Connect notes | Low |

---

## 🔴 CRITICAL PRIORITY

### Issue #25: Meeting Module - Database Schema Error

**Status:** BLOCKING
**Impact:** Cannot create custom working hours
**Error:** `Could not find the 'orange_evening_end' column`

#### Root Cause Analysis
The database schema for `country_configurations` table doesn't match the code expectations. The column naming convention is inconsistent:
- Code expects: `orange_evening_end`
- Database might have: Different column name or missing column

#### Fix Plan

**Step 1: Investigate Database Schema**
```sql
-- Check current schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'country_configurations';
```

**Step 2: Identify Column Mismatch**
- Review the store.js file for scheduling feature
- Check what columns are being referenced
- Compare with actual database schema

**Step 3: Fix Options**

**Option A: Update Database Schema (Recommended)**
```sql
-- Create migration to add missing columns or rename them
ALTER TABLE country_configurations
ADD COLUMN IF NOT EXISTS orange_evening_end TIME;
```

**Option B: Update Code**
- Modify the store to match existing database schema
- Update variable names to match database columns

**Files to Modify:**
- `src/features/scheduling/store.js` - Update column references
- Database migration file - Add/rename columns

**Estimated Time:** 1-2 hours
**Testing Required:** Create custom working hours for multiple countries

---

### Issue #27: FAB - Actions Don't Work

**Status:** HIGH PRIORITY
**Impact:** Cannot create tasks/notes/meetings from FAB
**User Experience:** Broken core navigation feature

#### Root Cause Analysis
FAB buttons trigger action but don't open creation dialogs or navigate to creation pages.

#### Fix Plan

**Step 1: Locate FAB Component**
- File: `src/components/global/FAB.vue` or similar
- Check button click handlers

**Step 2: Investigate Issues**
Potential problems:
- Missing event handlers
- Incorrect router navigation paths
- Dialog refs not properly connected
- Event emitters not working

**Step 3: Fix Implementation**

```javascript
// Expected behavior for each button:

// Create Task
const createTask = () => {
  router.push({ name: 'tasks', query: { action: 'create' } })
  // OR emit event to parent
  // OR open TaskDialog directly
}

// Create Note
const createNote = () => {
  router.push({ name: 'notes', query: { action: 'create' } })
}

// Create Meeting
const createMeeting = () => {
  router.push({ name: 'scheduling-create' })
}
```

**Files to Modify:**
- `src/components/global/FAB.vue` or `AppLayout.vue` (wherever FAB is)
- Ensure proper event handling and navigation

**Estimated Time:** 1 hour
**Testing Required:** Test all 3 FAB actions from different pages

---

## 🟡 HIGH PRIORITY

### Issue #23: Notes UI Not Usable

**Status:** HIGH PRIORITY
**Impact:** Major UX problem - too much on one page
**User Feedback:** Current 3-column layout is confusing

#### Current State
- Single page with: Topics sidebar, Notes list, Note editor
- Everything visible at once - overwhelming
- Hard to focus on note creation/editing

#### Proposed Solution

**New Architecture: Two-Page Approach**

**Page 1: Notes List View** (`/notes`)
- Left sidebar: Topics list with drag-drop reordering
- Main area: Notes list (filtered by selected topic)
- Actions: "New Note" button, search bar, filters
- Click note → Navigate to edit page

**Page 2: Note Editor View** (`/notes/:id/edit` or `/notes/new`)
- Full-screen editor for focused writing
- Breadcrumb: Notes > [Topic] > [Note Title]
- Save button, topic selector dropdown, back button
- Editor toolbar at top

#### Implementation Plan

**Step 1: Create New Route Structure**
```javascript
// router/index.js
{
  path: '/notes',
  name: 'notes',
  component: NotesListView
},
{
  path: '/notes/new',
  name: 'notes-create',
  component: NoteEditorView
},
{
  path: '/notes/:id/edit',
  name: 'notes-edit',
  component: NoteEditorView
}
```

**Step 2: Create NotesListView Component**
- Move topic sidebar from NotesView
- Move notes list from NotesView
- Remove editor panel
- Add navigation to edit view on note click

**Step 3: Create NoteEditorView Component**
- Full-page note editor
- Topic selector dropdown at top
- Save/Cancel actions
- Breadcrumb navigation

**Step 4: Update Navigation**
- Update FAB to navigate to `/notes/new`
- Update note cards to navigate to `/notes/:id/edit`
- Add "Back to Notes" button in editor

**Files to Create:**
- `src/views/NotesListView.vue` (new)
- `src/views/NoteEditorView.vue` (new)

**Files to Modify:**
- `src/router/index.js` - Add new routes
- `src/views/NotesView.vue` - Can be deprecated or refactored
- `src/components/global/FAB.vue` - Update note creation route

**Estimated Time:** 4-6 hours
**Testing Required:** Full notes workflow (create, edit, topic assignment, search)

---

### Issue #24: Note Module - Cannot Assign Topic

**Status:** HIGH PRIORITY
**Impact:** Missing core functionality
**Related:** Should be fixed with Issue #23

#### Current Problem
- No UI to assign/change topic after note creation
- Topics can only be set during creation (if at all)

#### Fix Plan

**Integrated with Issue #23 Solution:**

In the new NoteEditorView:
```vue
<template>
  <div class="note-editor">
    <!-- Topic Selector -->
    <div class="topic-selector">
      <label for="topic">Topic</label>
      <Select
        v-model="selectedTopicId"
        :options="topics"
        optionLabel="name"
        optionValue="id"
        placeholder="Select a topic (optional)"
        showClear
      />
    </div>

    <!-- Note Title -->
    <input v-model="noteTitle" placeholder="Note title" />

    <!-- Rich Text Editor -->
    <NoteEditor v-model="noteContent" />

    <!-- Actions -->
    <Button @click="saveNote">Save</Button>
    <Button @click="cancel" severity="secondary">Cancel</Button>
  </div>
</template>
```

**Implementation Steps:**
1. Add topic selector dropdown to NoteEditorView
2. Load all topics from store
3. Allow null/empty topic (notes without topics)
4. Update note on topic change
5. Show current topic when editing existing note

**Files to Modify:**
- `src/views/NoteEditorView.vue` - Add topic selector
- `src/features/notes/store.js` - Ensure updateNote supports topic_id changes

**Estimated Time:** 1 hour (included in Issue #23 fix)
**Testing Required:** Create note without topic, assign topic, change topic, remove topic

---

## 🟢 MEDIUM PRIORITY

### Issue #26: Meeting Module - Improve UI Layout

**Status:** MEDIUM PRIORITY
**Impact:** UX enhancement, not blocking functionality

#### Current Layout
Likely vertical stacking of all components

#### Proposed Layout

```
┌─────────────────────────────────────────────────────┐
│ Meeting Title                              [Actions] │
├──────────────────────┬──────────────────────────────┤
│ Meeting Equity Score │ Participant Breakdown        │
│ (Gauge: 0-100)       │ • Optimal: X                 │
│                      │ • Acceptable: Y              │
│                      │ • Poor: Z                    │
│                      │ • Critical: W                │
├──────────────────────┴──────────────────────────────┤
│ Participant Details (Table)                         │
│ Name | Timezone | Local Time | Status | Working Hrs │
├─────────────────────────────────────────────────────┤
│ Optimal Time Suggestions                            │
│ 1. 11:00 PM UTC - Score: 48                        │
│ 2. 10:00 PM UTC - Score: 40                        │
│ 3. 9:00 PM UTC - Score: 38                         │
├─────────────────────────────────────────────────────┤
│ 24-Hour Heatmap                                     │
│ [Interactive heatmap visualization]                 │
└─────────────────────────────────────────────────────┘
```

#### Implementation Plan

**Step 1: Update Meeting Detail Component Structure**
```vue
<template>
  <div class="meeting-detail">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1>{{ meeting.title }}</h1>
      <div class="actions">
        <Button @click="editMeeting">Edit</Button>
        <Button @click="deleteMeeting">Delete</Button>
      </div>
    </div>

    <!-- Equity Score & Breakdown Row -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <MeetingEquityScore :score="equityScore" />
      <ParticipantBreakdown :breakdown="breakdown" />
    </div>

    <!-- Participant Details Table -->
    <ParticipantDetails :participants="participants" class="mb-6" />

    <!-- Optimal Time Suggestions -->
    <OptimalTimeSuggestions :suggestions="suggestions" class="mb-6" />

    <!-- Heatmap -->
    <MeetingHeatmap :meeting="meeting" :participants="participants" />
  </div>
</template>
```

**Step 2: Update CSS for Grid Layout**
- Use Tailwind grid classes
- Ensure responsive behavior (stack on mobile)

**Files to Modify:**
- `src/features/scheduling/views/MeetingDetail.vue` or similar
- Extract components if they're inline

**Estimated Time:** 2-3 hours
**Testing Required:** View on desktop, tablet, mobile sizes

---

### Issue #22: Dashboard - Connect Meetings

**Status:** MEDIUM PRIORITY
**Impact:** Dashboard integration

#### Current State
Dashboard has a meetings card but shows sample/static data

#### Proposed Solution

**Display:** Last 5 modified meetings
**Click behavior:** Navigate to meeting detail
**"See All" button:** Navigate to meetings list

#### Implementation Plan

**Step 1: Update Dashboard Store**
```javascript
// src/stores/dashboard.js or similar
import { useSchedulingStore } from '@/features/scheduling/store'

const schedulingStore = useSchedulingStore()

const recentMeetings = computed(() => {
  return schedulingStore.meetings
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
})
```

**Step 2: Update Meetings Widget Component**
```vue
<template>
  <DashboardCard title="Upcoming Meetings">
    <div v-if="recentMeetings.length === 0" class="empty-state">
      <p>No meetings yet</p>
      <Button @click="createMeeting">Schedule Meeting</Button>
    </div>

    <div v-else>
      <div
        v-for="meeting in recentMeetings"
        :key="meeting.id"
        class="meeting-item"
        @click="navigateToMeeting(meeting.id)"
      >
        <h4>{{ meeting.title }}</h4>
        <p>{{ formatDate(meeting.meeting_time) }}</p>
        <p>{{ meeting.participants?.length || 0 }} participants</p>
      </div>

      <Button @click="viewAllMeetings" text>See All</Button>
    </div>
  </DashboardCard>
</template>

<script setup>
const router = useRouter()
const schedulingStore = useSchedulingStore()

const recentMeetings = computed(() => {
  return schedulingStore.meetings
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
})

const navigateToMeeting = (id) => {
  router.push({ name: 'meeting-detail', params: { id } })
}

const viewAllMeetings = () => {
  router.push({ name: 'scheduling' })
}
</script>
```

**Files to Modify:**
- `src/components/dashboard/UpcomingMeetings.vue` or similar
- `src/views/DashboardView.vue`

**Estimated Time:** 1-2 hours
**Testing Required:** Create meetings, verify they appear, test navigation

---

### Issue #21: Dashboard - Connect Notes

**Status:** MEDIUM PRIORITY
**Impact:** Dashboard integration
**Note:** Description seems swapped with #22 (says meetings, should be notes)

#### Current State
Dashboard has a notes card but shows sample/static data

#### Proposed Solution

**Display:** Last 5 modified notes
**Click behavior:** Navigate to note edit page
**"See All" button:** Navigate to notes list

#### Implementation Plan

**Step 1: Update Dashboard Store**
```javascript
import { useNotesStore } from '@/features/notes/store'

const notesStore = useNotesStore()

const recentNotes = computed(() => {
  return notesStore.notes
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
})
```

**Step 2: Update Recent Notes Widget**
```vue
<template>
  <DashboardCard title="Recent Notes">
    <div v-if="recentNotes.length === 0" class="empty-state">
      <p>No notes yet</p>
      <Button @click="createNote">Create Note</Button>
    </div>

    <div v-else>
      <div
        v-for="note in recentNotes"
        :key="note.id"
        class="note-item"
        @click="navigateToNote(note.id)"
      >
        <h4>{{ note.title }}</h4>
        <p>{{ note.preview }}</p>
        <span v-if="note.topic" class="topic-badge">
          {{ note.topic.name }}
        </span>
        <p class="text-sm text-gray-500">
          {{ formatDate(note.updated_at) }}
        </p>
      </div>

      <Button @click="viewAllNotes" text>See All</Button>
    </div>
  </DashboardCard>
</template>

<script setup>
const router = useRouter()
const notesStore = useNotesStore()

const recentNotes = computed(() => {
  return notesStore.notes
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
})

const navigateToNote = (id) => {
  router.push({ name: 'notes-edit', params: { id } })
}

const viewAllNotes = () => {
  router.push({ name: 'notes' })
}
</script>
```

**Files to Modify:**
- `src/components/dashboard/RecentNotes.vue` or similar
- `src/views/DashboardView.vue`

**Estimated Time:** 1-2 hours
**Testing Required:** Create notes, verify they appear, test navigation

---

## 📋 Implementation Roadmap

### Phase 1: Critical Fixes (Priority 1)
**Estimated Time: 2-3 hours**

1. **Fix Issue #25** - Database schema error (1-2 hours)
   - Investigate schema mismatch
   - Create migration or update code
   - Test custom working hours creation

2. **Fix Issue #27** - FAB actions (1 hour)
   - Fix event handlers
   - Test all 3 FAB actions

### Phase 2: Notes Module Overhaul (Priority 2)
**Estimated Time: 5-7 hours**

3. **Fix Issue #23** - Redesign Notes UI (4-6 hours)
   - Create NotesListView
   - Create NoteEditorView
   - Update routing
   - Update navigation

4. **Fix Issue #24** - Topic assignment (included in #23)
   - Add topic selector to editor
   - Test topic CRUD in notes

### Phase 3: UI Improvements (Priority 3)
**Estimated Time: 2-3 hours**

5. **Fix Issue #26** - Meeting UI layout (2-3 hours)
   - Redesign meeting detail layout
   - Test responsive behavior

### Phase 4: Dashboard Integration (Priority 4)
**Estimated Time: 2-4 hours**

6. **Fix Issue #22** - Connect meetings to dashboard (1-2 hours)
7. **Fix Issue #21** - Connect notes to dashboard (1-2 hours)

---

## 📊 Total Estimated Time

- **Phase 1 (Critical):** 2-3 hours
- **Phase 2 (Notes):** 5-7 hours
- **Phase 3 (UI):** 2-3 hours
- **Phase 4 (Dashboard):** 2-4 hours

**Total:** 11-17 hours of development time

---

## 🧪 Testing Checklist

After each fix:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No breaking changes to other features
- [ ] Mobile responsive (if UI change)
- [ ] Accessibility maintained

---

## 📝 Recommended Order of Execution

1. **Issue #25** - Fix blocking database error FIRST
2. **Issue #27** - Fix FAB (quick win, improves UX immediately)
3. **Issue #23 + #24** - Notes UI overhaul (big improvement, tackles 2 issues)
4. **Issue #26** - Meeting UI improvements
5. **Issue #22 + #21** - Dashboard integration (polish)

---

**Next Steps:**
1. Review this plan
2. Confirm approach for each issue
3. Start with Phase 1 (Critical fixes)
4. Test thoroughly after each fix
5. Move to next phase

Would you like me to start implementing any of these fixes?
