# Phase 3 Implementation Plan: Notes System

## Document Version
- **Version:** 1.0
- **Date:** December 2, 2025
- **Status:** Ready for Implementation
- **Author:** Claude Code

## Table of Contents
1. [Overview](#overview)
2. [Feature Requirements](#feature-requirements)
3. [Database Schema Review](#database-schema-review)
4. [Technical Architecture](#technical-architecture)
5. [Component Architecture](#component-architecture)
6. [Implementation Steps](#implementation-steps)
7. [Testing Strategy](#testing-strategy)
8. [Success Criteria](#success-criteria)
9. [Dependencies and Risks](#dependencies-and-risks)

---

## Overview

### Phase 3 Objectives

Phase 3 implements a comprehensive notes system that allows users to organize their thoughts, meeting minutes, project documentation, and other written content in a structured, searchable format. The notes system complements the task management feature by providing a place for detailed information that doesn't fit the task format.

By the end of Phase 3, users will be able to:
- Create and organize topics (categories for notes)
- Write rich-formatted notes with bold, italic, lists, and other formatting
- Search across all notes with full-text search
- Pin important notes for quick access
- Archive old notes to reduce clutter
- Reorder topics with drag-and-drop
- See recent and pinned notes on the dashboard
- Benefit from real-time synchronization across tabs/devices

### Key Success Metrics
- Users can create and manage topics in under 5 seconds
- Note creation and editing feels instant (< 200ms response time)
- Search returns results in under 500ms for 1000+ notes
- Rich text editor is intuitive and doesn't require documentation
- Zero data loss with real-time sync across multiple tabs

---

## Feature Requirements

### 1. Topic Management

**Topics** are organizational containers for notes, similar to folders or notebooks. Each user can create multiple topics to organize their notes by project, subject, or any other taxonomy that makes sense for their work.

#### Topic Features:
- **Create Topic**: Users can create new topics with:
  - Name (required, unique per user)
  - Description (optional, explains what belongs in this topic)
  - Color (optional, for visual distinction)
  - Display order (automatic, but user-adjustable via drag-and-drop)

- **Edit Topic**: Users can modify name, description, and color
- **Delete Topic**: Deleting a topic also deletes all notes within it (with confirmation)
- **Reorder Topics**: Drag-and-drop interface to rearrange topic display order
- **Topic List View**: Shows all topics with:
  - Topic name and color indicator
  - Note count per topic
  - Last updated timestamp
  - Quick actions (edit, delete)

#### UI/UX Considerations:
- Topics appear in a sidebar on the Notes view for easy navigation
- Active topic is highlighted
- Empty topics show a helpful message encouraging note creation
- Drag handles are visible on hover for reordering
- Confirmation dialog when deleting topics with notes

### 2. Note Management

**Notes** are rich-text documents that belong to a specific topic. Each note has a title and formatted content.

#### Note Features:
- **Create Note**:
  - Must belong to a topic (no orphan notes)
  - Title (required)
  - Rich-text content (required, supports formatting)
  - Automatically captures created_at timestamp
  - Starts in unpinned, unarchived state

- **Edit Note**:
  - Modify title and content
  - Automatically updates updated_at timestamp
  - Real-time autosave (debounced to avoid excessive API calls)
  - Optimistic UI updates for instant feedback

- **Pin/Unpin Note**:
  - Pinned notes appear at top of topic and on dashboard
  - Visual indicator (pin icon) shows pinned status
  - Toggle pinning with single click

- **Archive/Unarchive Note**:
  - Archived notes are hidden from default view but not deleted
  - Can view archived notes via filter toggle
  - Useful for completed projects or old meeting notes

- **Delete Note**:
  - Soft delete with confirmation
  - Consider adding "trash" concept for recovery (optional for future)

- **Note Metadata Display**:
  - Shows relative timestamps ("2 minutes ago", "3 days ago")
  - Updates to absolute dates after 7 days
  - Displays author (for future multi-user support)

#### Rich Text Editor Requirements:
- **Formatting Options**:
  - Bold, italic, underline
  - Headings (H1, H2, H3)
  - Bullet lists and numbered lists
  - Links (with URL input dialog)
  - Block quotes
  - Code blocks (for technical notes)
  - Horizontal rules/dividers

- **Editor Behavior**:
  - WYSIWYG (What You See Is What You Get) editing
  - Keyboard shortcuts for common formatting (Ctrl+B for bold, etc.)
  - Markdown shortcuts support (e.g., "# " for heading, "- " for list)
  - Paste plain text option to strip formatting
  - Auto-focus on title when creating new note
  - Mobile-responsive with touch-friendly controls

- **Technical Implementation**:
  - Use **Tiptap** editor (Vue 3 compatible, extensible, well-documented)
  - Store content as HTML or ProseMirror JSON
  - Sanitize HTML on save to prevent XSS attacks
  - Graceful fallback if editor fails to load

### 3. Search Functionality

Full-text search across all notes (title and content) with instant results as users type.

#### Search Features:
- **Search Input**:
  - Prominent search bar at top of notes view
  - Placeholder text: "Search notes..."
  - Clear button (X) to reset search
  - Debounced to avoid excessive queries (300ms delay)

- **Search Behavior**:
  - Searches across note titles and content
  - Case-insensitive matching
  - Highlights matching terms in results
  - Shows matching snippet with context
  - Groups results by topic
  - Shows count of matching notes

- **Search Results Display**:
  - Note title (with search term highlighted)
  - Topic name and color
  - Content snippet showing match context
  - Timestamp
  - Click to open full note

- **No Results State**:
  - Friendly message: "No notes found matching '[query]'"
  - Suggestions: "Try different keywords or browse topics"

#### Technical Implementation:
- PostgreSQL full-text search using `ts_vector` columns
- Create GIN index on search columns for performance
- Frontend debouncing to reduce API calls
- Limit results to top 50 matches initially
- "Load more" for additional results if needed

### 4. Pinning and Archiving

#### Pinning:
- **Purpose**: Keep important notes easily accessible
- **Implementation**:
  - Add `is_pinned` boolean column to notes table
  - Pinned notes appear first in topic list (sorted by updated_at)
  - Pin icon in note card and note editor
  - Toggle with single click (optimistic UI update)
  - No limit on number of pinned notes per topic
  - Dashboard shows 5 most recent pinned notes across all topics

#### Archiving:
- **Purpose**: Hide old/completed notes without deleting
- **Implementation**:
  - Add `archived_at` timestamp column to notes table
  - Archived notes excluded from default queries (WHERE archived_at IS NULL)
  - "Show Archived" toggle filter in UI
  - Archived notes appear grayed out when visible
  - Can unarchive with single click
  - Archive action shows toast: "Note archived. Undo?"
  - Undo functionality available for 5 seconds

### 5. Real-time Synchronization

Real-time updates ensure consistency when users have multiple tabs open or work across devices.

#### Real-time Features:
- **Topic Changes**:
  - New topics appear immediately in all tabs
  - Topic edits update in real-time
  - Topic deletions remove from all tabs
  - Topic reordering syncs across tabs

- **Note Changes**:
  - New notes appear in topic immediately
  - Note edits update in all tabs (except currently editing note)
  - Pin/archive status syncs instantly
  - Note deletions remove from all tabs

- **Conflict Resolution**:
  - Last-write-wins for note content
  - Show warning if user is editing note that was just updated elsewhere
  - "Reload to see latest version" banner with option to keep local changes

#### Technical Implementation:
- Supabase Realtime subscriptions on `topics` and `notes` tables
- Filter subscriptions to current user's data
- Update Pinia store state when changes received
- Avoid updating note being actively edited (check local editing state)
- Unsubscribe on component unmount to prevent memory leaks

### 6. Dashboard Integration

The dashboard provides quick access to recent and important notes without navigating to the full notes view.

#### Dashboard Features:
- **Recent Notes Widget**:
  - Shows 5 most recently updated notes
  - Displays: title, topic (with color), timestamp
  - Click to open note in notes view
  - "View All" link to notes view

- **Pinned Notes Widget**:
  - Shows 5 most recently pinned notes
  - Same display format as recent notes
  - Pin icon indicator
  - "View All Pinned" link

- **Widget Behavior**:
  - Updates in real-time as notes change
  - Shows empty state if no notes: "Create your first note"
  - Responsive layout (stacks on mobile)

---

## Database Schema Review

The database schema for topics and notes was already created in Phase 1. Let's review and identify any modifications needed for Phase 3 features.

### Existing Schema (from Phase 1)

```sql
-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Required Schema Modifications

We need to add columns for pinning, archiving, and search functionality:

```sql
-- Add new columns to notes table
ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN archived_at TIMESTAMPTZ;

-- Add full-text search columns and index
ALTER TABLE notes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);

-- Add index for pinned notes (to query efficiently)
CREATE INDEX idx_notes_pinned ON notes(user_id, is_pinned, updated_at DESC)
  WHERE is_pinned = TRUE;

-- Add index for archived notes (to filter efficiently)
CREATE INDEX idx_notes_active ON notes(user_id, topic_id, archived_at)
  WHERE archived_at IS NULL;

-- Existing indexes from Phase 1
-- CREATE INDEX idx_notes_topic_id ON notes(topic_id);
-- CREATE INDEX idx_notes_created_at ON notes(topic_id, created_at DESC);
```

### Migration Script

Create a new migration file: `20251202000000_add_notes_features.sql`

```sql
-- Migration: Add pinning, archiving, and search to notes
-- Date: 2025-12-02

BEGIN;

-- Add new columns
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add full-text search
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(user_id, is_pinned, updated_at DESC)
  WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_active ON notes(user_id, topic_id, archived_at)
  WHERE archived_at IS NULL;

COMMIT;
```

### Row Level Security

The RLS policies from Phase 1 already cover notes and topics correctly:

```sql
-- Already exists from Phase 1
CREATE POLICY "Users can manage own topics"
  ON topics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);
```

No modifications needed for RLS.

---

## Technical Architecture

### Technology Choices

#### Rich Text Editor: Tiptap

**Why Tiptap?**
- Built specifically for Vue 3 with excellent Composition API support
- Headless (no default UI) allowing full customization to match Coordino's design
- Extensible with modular extensions for each formatting feature
- Active development and strong community
- Excellent documentation with Vue examples
- ProseMirror-based (robust, proven technology)
- Supports collaborative editing (useful if we add multi-user features later)

**Installation:**
```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
```

**Basic Setup Example:**
```vue
<template>
  <div class="editor">
    <EditorToolbar :editor="editor" />
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const editor = useEditor({
  extensions: [
    StarterKit,
    Link,
    Placeholder.configure({
      placeholder: 'Start writing your note...'
    })
  ],
  content: '<p>Note content here</p>',
  onUpdate: ({ editor }) => {
    // Handle content changes (debounced autosave)
    handleContentChange(editor.getHTML())
  }
})
</script>
```

#### State Management: Pinia Store

Following the same pattern as tasks, we'll create a notes store at `src/features/notes/store.js`.

**Store Structure:**
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'

export const useNotesStore = defineStore('notes', () => {
  // State
  const topics = ref([])
  const notes = ref([])
  const selectedTopicId = ref(null)
  const searchQuery = ref('')
  const showArchived = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const selectedTopic = computed(() =>
    topics.value.find(t => t.id === selectedTopicId.value)
  )

  const filteredNotes = computed(() => {
    let filtered = notes.value

    // Filter by topic
    if (selectedTopicId.value) {
      filtered = filtered.filter(n => n.topic_id === selectedTopicId.value)
    }

    // Filter archived
    if (!showArchived.value) {
      filtered = filtered.filter(n => !n.archived_at)
    }

    // Search filter
    if (searchQuery.value) {
      // This is client-side filtering; actual search uses database
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      )
    }

    return filtered
  })

  const pinnedNotes = computed(() =>
    notes.value
      .filter(n => n.is_pinned && !n.archived_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  )

  const recentNotes = computed(() =>
    notes.value
      .filter(n => !n.archived_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
  )

  // Actions
  // ... CRUD operations for topics and notes
  // ... Search functionality
  // ... Real-time subscription setup

  return {
    topics,
    notes,
    selectedTopicId,
    searchQuery,
    showArchived,
    loading,
    error,
    selectedTopic,
    filteredNotes,
    pinnedNotes,
    recentNotes,
    // ... methods
  }
})
```

#### Search Implementation

**Database-side Search (Primary):**
```javascript
async function searchNotes(query) {
  const { data, error } = await supabase
    .from('notes')
    .select('*, topic:topics(id, name, color)')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    })
    .eq('user_id', authStore.user.id)
    .is('archived_at', null)
    .limit(50)

  if (error) throw error
  return data
}
```

**Client-side Filtering (Fallback):**
For immediate feedback while typing, use client-side filtering on already-loaded notes, then fetch full search results from database.

#### Real-time Subscriptions

```javascript
const setupRealtimeSubscriptions = () => {
  // Topics subscription
  const topicsChannel = supabase
    .channel('topics_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'topics',
      filter: `user_id=eq.${authStore.user.id}`
    }, handleTopicChange)
    .subscribe()

  // Notes subscription
  const notesChannel = supabase
    .channel('notes_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notes',
      filter: `user_id=eq.${authStore.user.id}`
    }, handleNoteChange)
    .subscribe()

  return { topicsChannel, notesChannel }
}
```

---

## Component Architecture

### Directory Structure

```
src/features/notes/
├── store.js                          # Pinia store
├── utils.js                          # Utility functions
├── composables/
│   ├── useNoteEditor.js             # Tiptap editor composable
│   ├── useNoteAutosave.js           # Autosave logic
│   └── useNoteSearch.js             # Search functionality
├── components/
│   ├── TopicList.vue                # List of topics in sidebar
│   ├── TopicCard.vue                # Individual topic item
│   ├── TopicDialog.vue              # Create/edit topic modal
│   ├── NoteList.vue                 # List of notes in selected topic
│   ├── NoteCard.vue                 # Individual note item
│   ├── NoteEditor.vue               # Rich text editor for notes
│   ├── NoteSearchBar.vue            # Search input component
│   ├── NoteSearchResults.vue        # Search results display
│   ├── EditorToolbar.vue            # Rich text formatting toolbar
│   ├── DashboardNotesWidget.vue     # Recent notes widget
│   └── DashboardPinnedWidget.vue    # Pinned notes widget
└── __tests__/
    ├── store.test.js
    ├── store.topics.test.js
    ├── store.notes.test.js
    ├── components/
    │   ├── TopicList.test.js
    │   ├── TopicCard.test.js
    │   ├── TopicDialog.test.js
    │   ├── NoteList.test.js
    │   ├── NoteCard.test.js
    │   ├── NoteEditor.test.js
    │   ├── NoteSearchBar.test.js
    │   └── EditorToolbar.test.js
    └── composables/
        ├── useNoteEditor.test.js
        ├── useNoteAutosave.test.js
        └── useNoteSearch.test.js
```

### Component Specifications

#### 1. TopicList.vue

**Purpose:** Displays all topics in a sidebar with drag-and-drop reordering.

**Props:**
- None (uses store)

**Emits:**
- `topic-selected` - when user clicks a topic

**Features:**
- Lists all topics sorted by display_order
- Shows note count per topic
- Highlights selected topic
- Drag-and-drop to reorder
- Quick actions menu (edit, delete)
- "Add Topic" button at bottom

**Key Implementation Details:**
```vue
<template>
  <div class="topic-list">
    <div class="topic-list-header">
      <h2>Topics</h2>
      <Button
        icon="pi pi-plus"
        class="p-button-rounded p-button-text"
        @click="showTopicDialog = true"
      />
    </div>

    <draggable
      v-model="sortedTopics"
      @end="handleReorder"
      item-key="id"
      handle=".drag-handle"
    >
      <template #item="{ element: topic }">
        <TopicCard
          :topic="topic"
          :selected="topic.id === selectedTopicId"
          @click="selectTopic(topic.id)"
          @edit="handleEditTopic(topic)"
          @delete="handleDeleteTopic(topic)"
        />
      </template>
    </draggable>

    <TopicDialog
      v-model:visible="showTopicDialog"
      :topic="selectedTopic"
      @saved="handleTopicSaved"
    />
  </div>
</template>
```

#### 2. TopicCard.vue

**Purpose:** Individual topic item in the list.

**Props:**
- `topic` - Topic object
- `selected` - Boolean for active state

**Emits:**
- `edit` - Edit topic
- `delete` - Delete topic

**Features:**
- Shows topic name with color indicator
- Displays note count
- Drag handle icon
- Edit/delete menu (shown on hover)
- Active state styling

#### 3. TopicDialog.vue

**Purpose:** Modal dialog for creating or editing topics.

**Props:**
- `visible` - Boolean
- `topic` - Topic object (null for create, object for edit)

**Emits:**
- `update:visible` - Close dialog
- `saved` - Topic was saved

**Features:**
- Form fields: name (required), description, color picker
- Validation: unique name, required fields
- Color picker with preset colors
- Cancel/Save buttons
- Loading state during save

#### 4. NoteList.vue

**Purpose:** Displays notes for selected topic in a grid or list view.

**Props:**
- None (uses store)

**Features:**
- Shows filtered notes (by topic, search, archived)
- Grid or list view toggle
- Sort options (updated date, created date, title)
- Empty state for no notes
- "Add Note" button
- Infinite scroll for large note collections

**Key Implementation:**
```vue
<template>
  <div class="note-list">
    <div class="note-list-header">
      <h2>{{ selectedTopic?.name || 'All Notes' }}</h2>
      <div class="note-list-actions">
        <Button
          icon="pi pi-th-large"
          :class="{ 'p-button-primary': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        />
        <Button
          icon="pi pi-list"
          :class="{ 'p-button-primary': viewMode === 'list' }"
          @click="viewMode = 'list'"
        />
        <Button
          label="New Note"
          icon="pi pi-plus"
          @click="createNote"
        />
      </div>
    </div>

    <div :class="['note-list-content', `note-list-${viewMode}`]">
      <NoteCard
        v-for="note in filteredNotes"
        :key="note.id"
        :note="note"
        @click="openNote(note)"
        @pin="togglePin(note)"
        @archive="toggleArchive(note)"
        @delete="deleteNote(note)"
      />
    </div>

    <div v-if="filteredNotes.length === 0" class="empty-state">
      <i class="pi pi-file text-6xl text-gray-400"></i>
      <p>No notes yet. Create your first note!</p>
      <Button label="Create Note" @click="createNote" />
    </div>
  </div>
</template>
```

#### 5. NoteCard.vue

**Purpose:** Individual note preview in list/grid.

**Props:**
- `note` - Note object

**Emits:**
- `pin` - Toggle pin status
- `archive` - Toggle archive status
- `delete` - Delete note

**Features:**
- Shows title and content preview (first 150 chars)
- Topic color indicator
- Timestamp (relative)
- Pin icon if pinned
- Archived badge if archived
- Hover actions menu
- Click to open full note

#### 6. NoteEditor.vue

**Purpose:** Full-screen or modal editor for creating/editing notes.

**Props:**
- `note` - Note object (null for create, object for edit)
- `topicId` - Topic ID for new notes

**Emits:**
- `saved` - Note was saved
- `closed` - Editor closed without saving

**Features:**
- Title input (auto-focus)
- Tiptap rich text editor with toolbar
- Autosave every 3 seconds (debounced)
- Save indicator (saving, saved, error)
- Close button with unsaved changes warning
- Pin/archive/delete actions in toolbar
- Full-screen mode toggle

**Key Implementation:**
```vue
<template>
  <div class="note-editor">
    <div class="note-editor-header">
      <input
        v-model="noteTitle"
        class="note-title-input"
        placeholder="Note title..."
        @input="handleTitleChange"
      />
      <div class="note-editor-actions">
        <span v-if="saveStatus" class="save-status">
          {{ saveStatus }}
        </span>
        <Button
          :icon="note?.is_pinned ? 'pi pi-star-fill' : 'pi pi-star'"
          class="p-button-rounded p-button-text"
          @click="togglePin"
        />
        <Button
          icon="pi pi-times"
          class="p-button-rounded p-button-text"
          @click="close"
        />
      </div>
    </div>

    <EditorToolbar :editor="editor" />

    <EditorContent :editor="editor" class="note-editor-content" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useNoteAutosave } from '../composables/useNoteAutosave'

const props = defineProps({
  note: Object,
  topicId: String
})

const emit = defineEmits(['saved', 'closed'])

const noteTitle = ref(props.note?.title || '')
const saveStatus = ref('')

const editor = useEditor({
  extensions: [StarterKit, Link],
  content: props.note?.content || '',
  onUpdate: ({ editor }) => {
    handleContentChange(editor.getHTML())
  }
})

// Autosave composable handles debounced saving
const { startAutosave, stopAutosave } = useNoteAutosave({
  noteId: props.note?.id,
  topicId: props.topicId,
  onSave: (status) => {
    saveStatus.value = status
  }
})

watch([noteTitle, () => editor.value?.getHTML()], () => {
  startAutosave({
    title: noteTitle.value,
    content: editor.value?.getHTML()
  })
})

onUnmounted(() => {
  stopAutosave()
  editor.value?.destroy()
})
</script>
```

#### 7. EditorToolbar.vue

**Purpose:** Formatting toolbar for Tiptap editor.

**Props:**
- `editor` - Tiptap editor instance

**Features:**
- Formatting buttons (bold, italic, underline, etc.)
- Heading dropdowns (H1, H2, H3)
- List buttons (bullet, numbered)
- Link button (opens URL input dialog)
- Code block button
- Clear formatting button
- Keyboard shortcut tooltips
- Disabled state when no editor

**Key Implementation:**
```vue
<template>
  <div v-if="editor" class="editor-toolbar">
    <div class="editor-toolbar-group">
      <Button
        :class="{ 'is-active': editor.isActive('bold') }"
        icon="pi pi-bold"
        class="p-button-text p-button-sm"
        @click="editor.chain().focus().toggleBold().run()"
        v-tooltip="'Bold (Ctrl+B)'"
      />
      <Button
        :class="{ 'is-active': editor.isActive('italic') }"
        icon="pi pi-italic"
        class="p-button-text p-button-sm"
        @click="editor.chain().focus().toggleItalic().run()"
        v-tooltip="'Italic (Ctrl+I)'"
      />
      <!-- More formatting buttons -->
    </div>

    <div class="editor-toolbar-group">
      <Dropdown
        :options="headingOptions"
        placeholder="Normal"
        @change="setHeading"
      />
    </div>

    <div class="editor-toolbar-group">
      <Button
        :class="{ 'is-active': editor.isActive('bulletList') }"
        icon="pi pi-list"
        @click="editor.chain().focus().toggleBulletList().run()"
      />
      <Button
        :class="{ 'is-active': editor.isActive('orderedList') }"
        icon="pi pi-sort-numeric-down"
        @click="editor.chain().focus().toggleOrderedList().run()"
      />
    </div>

    <div class="editor-toolbar-group">
      <Button
        icon="pi pi-link"
        @click="showLinkDialog = true"
      />
    </div>
  </div>
</template>
```

#### 8. NoteSearchBar.vue

**Purpose:** Search input with results dropdown.

**Props:**
- None (uses store)

**Features:**
- Search input with debounce
- Clear button
- Shows search results dropdown
- Highlights matching terms
- Keyboard navigation (arrow keys, Enter)

#### 9. Dashboard Widgets

**DashboardNotesWidget.vue** and **DashboardPinnedWidget.vue**:
- Compact note list (5 items)
- Shows title, topic, timestamp
- Click to open note
- "View All" link
- Empty state handling

---

## Implementation Steps

This section breaks down Phase 3 into manageable steps with dependencies and estimated effort.

### Step 1: Database Migration (Estimated: 30 minutes)

**Tasks:**
1. Create migration SQL file with new columns and indexes
2. Test migration on local Supabase instance
3. Verify indexes are created correctly
4. Test full-text search queries
5. Apply migration to production database (after local testing)

**Validation:**
- Migration runs without errors
- New columns have correct types and defaults
- Indexes are created and improve query performance
- Full-text search returns relevant results

**Dependencies:** None

---

### Step 2: Install Tiptap Dependencies (Estimated: 15 minutes)

**Tasks:**
1. Install Tiptap core packages:
   ```bash
   npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
   ```
2. Install drag-and-drop library for topic reordering:
   ```bash
   npm install vuedraggable@next
   ```
3. Verify installations work in development

**Validation:**
- Packages install without peer dependency warnings
- Can import Tiptap in a test component
- Vuedraggable works with Vue 3

**Dependencies:** None

---

### Step 3: Create Notes Store (Estimated: 4 hours)

**Tasks:**
1. Create `src/features/notes/store.js`
2. Implement state: topics, notes, loading, error, filters
3. Implement computed properties: filteredNotes, pinnedNotes, recentNotes
4. Implement topic CRUD operations:
   - `fetchTopics()`
   - `createTopic(data)`
   - `updateTopic(id, data)`
   - `deleteTopic(id)`
   - `reorderTopics(newOrder)`
5. Implement note CRUD operations:
   - `fetchNotes(topicId?)`
   - `createNote(data)`
   - `updateNote(id, data)`
   - `deleteNote(id)`
6. Implement pin/archive operations:
   - `togglePin(noteId)`
   - `toggleArchive(noteId)`
7. Implement search:
   - `searchNotes(query)`
8. Setup real-time subscriptions:
   - `setupRealtimeSubscriptions()`
9. Write comprehensive unit tests

**Validation:**
- All CRUD operations work with Supabase
- Computed properties return correct data
- Real-time updates trigger store updates
- Error handling works correctly
- Tests achieve >80% coverage

**Dependencies:** Database migration complete

---

### Step 4: Create Utility Functions and Composables (Estimated: 3 hours)

**Tasks:**
1. Create `src/features/notes/utils.js`:
   - `sanitizeHTML(html)` - Clean user-generated HTML
   - `truncateText(text, maxLength)` - For note previews
   - `formatNoteTimestamp(date)` - Relative/absolute dates
   - `stripHTMLTags(html)` - Convert HTML to plain text for search

2. Create `src/features/notes/composables/useNoteEditor.js`:
   - Initialize Tiptap editor with extensions
   - Handle editor lifecycle
   - Provide helper methods for formatting

3. Create `src/features/notes/composables/useNoteAutosave.js`:
   - Debounced autosave logic (3 second delay)
   - Track save status (saving, saved, error)
   - Handle optimistic updates

4. Create `src/features/notes/composables/useNoteSearch.js`:
   - Debounced search (300ms)
   - Manage search state
   - Highlight search terms in results

5. Write unit tests for all utilities and composables

**Validation:**
- All utility functions handle edge cases
- Composables work in test components
- HTML sanitization prevents XSS
- Autosave works reliably without data loss
- Tests pass with good coverage

**Dependencies:** Notes store created

---

### Step 5: Build Topic Management Components (Estimated: 4 hours)

**Tasks:**
1. Create `TopicList.vue`:
   - Integrate vuedraggable for reordering
   - Show all topics with note counts
   - Handle topic selection
   - Add "Create Topic" button

2. Create `TopicCard.vue`:
   - Display topic with color indicator
   - Show note count
   - Drag handle and actions menu
   - Selected state styling

3. Create `TopicDialog.vue`:
   - Form with name, description, color picker
   - Validation (unique name, required fields)
   - Create/Edit modes
   - Integration with store

4. Style components following design system
5. Write component tests

**Validation:**
- Topics display correctly
- Drag-and-drop reordering works smoothly
- Topic CRUD operations work from UI
- Form validation prevents invalid data
- Components are responsive
- Tests cover user interactions

**Dependencies:** Notes store, utilities/composables

---

### Step 6: Build Note Management Components (Estimated: 6 hours)

**Tasks:**
1. Create `NoteList.vue`:
   - Display notes in grid/list view
   - View toggle buttons
   - Empty state
   - Infinite scroll (if needed)

2. Create `NoteCard.vue`:
   - Show title, preview, timestamp
   - Topic color indicator
   - Pin/archive icons
   - Hover actions menu

3. Create `EditorToolbar.vue`:
   - All formatting buttons
   - Active state styling
   - Tooltips with keyboard shortcuts
   - Responsive layout

4. Create `NoteEditor.vue`:
   - Title input with autofocus
   - Integrate Tiptap editor
   - Integrate EditorToolbar
   - Autosave functionality
   - Save status indicator
   - Pin/archive/delete actions
   - Close with unsaved changes warning

5. Style components with rich text editor styling
6. Write comprehensive component tests

**Validation:**
- Notes display correctly in both views
- Editor formatting works perfectly
- Autosave doesn't lose data
- Rich text renders correctly
- Mobile-responsive editor
- Keyboard shortcuts work
- Tests cover all interactions

**Dependencies:** Topic components, editor composable, autosave composable

---

### Step 7: Implement Search Functionality (Estimated: 3 hours)

**Tasks:**
1. Create `NoteSearchBar.vue`:
   - Search input with debounce
   - Clear button
   - Integration with store

2. Create `NoteSearchResults.vue`:
   - Display search results grouped by topic
   - Highlight matching terms
   - Show content snippets
   - Click to open note

3. Add search to notes view
4. Test search with various queries
5. Write component tests

**Validation:**
- Search returns results quickly (< 500ms)
- Matching terms are highlighted
- Results are relevant
- Empty state for no results
- Search works with special characters
- Tests cover search scenarios

**Dependencies:** Notes store with search implementation

---

### Step 8: Implement Real-time Synchronization (Estimated: 2 hours)

**Tasks:**
1. Add real-time subscription setup to store
2. Implement handlers for topic changes (INSERT, UPDATE, DELETE)
3. Implement handlers for note changes
4. Add conflict detection for concurrent edits
5. Test multi-tab synchronization
6. Test across different devices (if possible)

**Validation:**
- Changes appear immediately in all tabs
- No race conditions or data loss
- Conflict warnings appear when appropriate
- Subscriptions clean up properly
- Performance remains good with many updates

**Dependencies:** Notes store, all components

---

### Step 9: Build Dashboard Widgets (Estimated: 2 hours)

**Tasks:**
1. Create `DashboardNotesWidget.vue`:
   - Fetch and display 5 recent notes
   - Compact note display
   - "View All" link

2. Create `DashboardPinnedWidget.vue`:
   - Fetch and display 5 pinned notes
   - Same compact display format
   - Empty state handling

3. Integrate widgets into `DashboardView.vue`
4. Style widgets consistently with other dashboard cards
5. Write component tests

**Validation:**
- Widgets show correct notes
- Click navigation works
- Empty states are helpful
- Widgets update in real-time
- Responsive layout
- Tests pass

**Dependencies:** Notes store, note components

---

### Step 10: Create Notes View (Estimated: 3 hours)

**Tasks:**
1. Create `src/views/NotesView.vue`:
   - Layout with sidebar (topics) and main area (notes)
   - Integrate TopicList and NoteList
   - Add NoteSearchBar at top
   - Show archived filter toggle
   - Integrate NoteEditor (modal or split view)

2. Add route to router configuration
3. Update navigation in AppLayout
4. Style the complete view
5. Test all interactions and flows

**Validation:**
- Layout works on all screen sizes
- All components integrate smoothly
- Navigation between topics works
- Opening/closing editor works
- Archived filter works correctly
- Overall UX feels polished

**Dependencies:** All components complete

---

### Step 11: Add Keyboard Shortcuts (Estimated: 2 hours)

**Tasks:**
1. Implement global keyboard shortcuts:
   - `Ctrl+N` or `Cmd+N` - Create new note
   - `Ctrl+K` or `Cmd+K` - Focus search
   - `Esc` - Close dialogs/editor
   - Arrow keys - Navigate notes

2. Add shortcuts to editor:
   - Standard text formatting (Ctrl+B, Ctrl+I, etc.)
   - `Ctrl+S` or `Cmd+S` - Manual save
   - `Ctrl+Enter` or `Cmd+Enter` - Close and save

3. Display shortcut hints in tooltips
4. Test shortcuts on Windows, Mac, Linux

**Validation:**
- All shortcuts work correctly
- No conflicts with browser shortcuts
- Tooltips show correct keys for OS
- Shortcuts work in all contexts

**Dependencies:** Complete notes view

---

### Step 12: Polish and Accessibility (Estimated: 3 hours)

**Tasks:**
1. Accessibility audit:
   - All interactive elements keyboard accessible
   - Proper ARIA labels
   - Focus indicators visible
   - Screen reader testing

2. Visual polish:
   - Smooth transitions and animations
   - Loading states for all async operations
   - Error states with helpful messages
   - Empty states with clear CTAs

3. Performance optimization:
   - Debounce/throttle expensive operations
   - Lazy load large note lists
   - Optimize re-renders

4. Browser testing:
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome)

**Validation:**
- Passes WCAG 2.1 Level AA
- Works smoothly on all browsers
- No performance issues with 100+ notes
- Beautiful animations and transitions

**Dependencies:** Complete feature implementation

---

### Step 13: Comprehensive Testing (Estimated: 4 hours)

**Tasks:**
1. Write integration tests:
   - Complete user flows (create topic → create note → edit → search)
   - Multi-user scenarios (real-time sync)
   - Error scenarios (network failures, validation errors)

2. Manual testing scenarios:
   - Create, edit, delete topics
   - Create, edit, delete notes
   - Rich text formatting
   - Search functionality
   - Pin/archive operations
   - Real-time sync across tabs
   - Mobile device testing

3. Performance testing:
   - Load 100+ notes
   - Search with many results
   - Rapid topic switching

4. Fix any bugs found during testing

**Validation:**
- All automated tests pass
- Manual testing checklist complete
- No critical bugs
- Performance meets targets
- Ready for production

**Dependencies:** All implementation complete

---

### Step 14: Documentation and Deployment (Estimated: 2 hours)

**Tasks:**
1. Update README with notes feature documentation
2. Create user guide for notes feature
3. Document keyboard shortcuts
4. Update ARCHITECTURE.md with notes implementation details
5. Create release notes for Phase 3
6. Deploy to production:
   - Run database migration
   - Deploy frontend code
   - Monitor for errors
   - Verify everything works in production

**Validation:**
- Documentation is clear and helpful
- Migration runs successfully in production
- No errors in production logs
- Users can access and use notes feature

**Dependencies:** All testing complete and passing

---

## Testing Strategy

### Unit Tests

Each component, composable, utility function, and store method should have unit tests covering:
- Happy path functionality
- Edge cases and error conditions
- Input validation
- Computed properties and reactivity
- Event emissions

**Target Coverage:** 80% minimum

**Tools:**
- Vitest for test runner
- @vue/test-utils for component testing
- @pinia/testing for store testing

**Example Test Structure:**
```javascript
// src/features/notes/__tests__/store.topics.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../store'

describe('Notes Store - Topics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetches topics successfully', async () => {
    const store = useNotesStore()
    await store.fetchTopics()
    expect(store.topics.length).toBeGreaterThan(0)
  })

  it('creates a new topic', async () => {
    const store = useNotesStore()
    const result = await store.createTopic({
      name: 'Test Topic',
      description: 'Test description',
      color: '#3b82f6'
    })
    expect(result.success).toBe(true)
    expect(store.topics).toContainEqual(
      expect.objectContaining({ name: 'Test Topic' })
    )
  })

  it('prevents duplicate topic names', async () => {
    const store = useNotesStore()
    await store.createTopic({ name: 'Duplicate' })
    const result = await store.createTopic({ name: 'Duplicate' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('already exists')
  })

  // More tests...
})
```

### Integration Tests

Test complete user flows:
1. **Topic Management Flow:**
   - Create topic → Verify it appears → Edit topic → Delete topic

2. **Note Creation Flow:**
   - Select topic → Create note → Add content → Save → Verify note exists

3. **Search Flow:**
   - Create multiple notes → Search by title → Search by content → Verify results

4. **Pin/Archive Flow:**
   - Create note → Pin it → Verify it appears in pinned list → Archive it → Verify it's hidden

5. **Real-time Sync Flow:**
   - Open two browser tabs → Create note in tab 1 → Verify it appears in tab 2

### End-to-End Tests

Consider adding E2E tests with Playwright for critical user journeys:
- User can create and manage topics
- User can write and save notes with formatting
- Search returns correct results
- Real-time updates work across tabs

### Performance Testing

Test with realistic data volumes:
- 50 topics with 20 notes each (1000 notes total)
- Search across 1000 notes completes in < 500ms
- Rendering 100 notes in list view is smooth (60fps)
- Editor handles large notes (10,000+ words) without lag

### Accessibility Testing

- Keyboard-only navigation through entire notes feature
- Screen reader testing with NVDA/JAWS
- Color contrast meets WCAG AA standards
- Focus indicators are visible and clear

---

## Success Criteria

Phase 3 is complete when all of the following are true:

### Functional Requirements ✅
- [ ] Users can create, edit, delete topics
- [ ] Topics can be reordered with drag-and-drop
- [ ] Users can create notes with rich formatting (bold, italic, lists, links, etc.)
- [ ] Notes autosave reliably without data loss
- [ ] Users can pin/unpin notes
- [ ] Users can archive/unarchive notes
- [ ] Full-text search returns relevant results quickly
- [ ] Search highlights matching terms
- [ ] Dashboard shows 5 recent notes and 5 pinned notes
- [ ] Real-time sync works across multiple tabs
- [ ] All CRUD operations work correctly

### Technical Requirements ✅
- [ ] Database migration runs successfully
- [ ] All unit tests pass with >80% coverage
- [ ] Integration tests cover critical user flows
- [ ] No console errors or warnings
- [ ] Performance targets met (search < 500ms, smooth scrolling)
- [ ] Code follows existing patterns and conventions

### UX/Design Requirements ✅
- [ ] UI is consistent with existing Coordino design
- [ ] Responsive on mobile, tablet, desktop
- [ ] Smooth transitions and animations
- [ ] Loading states for all async operations
- [ ] Error messages are helpful and actionable
- [ ] Empty states guide users to next action
- [ ] Keyboard shortcuts work correctly

### Accessibility Requirements ✅
- [ ] Passes WCAG 2.1 Level AA
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces changes appropriately
- [ ] Focus indicators visible
- [ ] Color contrast meets standards

### Documentation Requirements ✅
- [ ] User-facing documentation complete
- [ ] Developer documentation updated
- [ ] Code comments explain complex logic
- [ ] README updated with notes feature info

---

## Dependencies and Risks

### External Dependencies

1. **Tiptap Editor:**
   - **Risk:** Library updates could break compatibility
   - **Mitigation:** Lock version in package.json, test thoroughly before upgrading

2. **Vuedraggable:**
   - **Risk:** Touch device support might have issues
   - **Mitigation:** Test on actual mobile devices, have fallback for non-drag environments

3. **Supabase Realtime:**
   - **Risk:** Realtime subscriptions could have latency or reliability issues
   - **Mitigation:** Implement optimistic updates, handle subscription failures gracefully

### Technical Risks

1. **Rich Text Editor Complexity:**
   - **Risk:** Tiptap configuration and customization could be time-consuming
   - **Mitigation:** Start with starter kit, add extensions incrementally, allocate extra time

2. **Search Performance:**
   - **Risk:** Full-text search could be slow with large datasets
   - **Mitigation:** Use PostgreSQL GIN indexes, implement pagination, client-side caching

3. **Real-time Sync Conflicts:**
   - **Risk:** Concurrent edits could cause data loss
   - **Mitigation:** Implement last-write-wins with warnings, consider operational transformation for future

4. **Autosave Data Loss:**
   - **Risk:** Autosave could fail silently, losing user work
   - **Mitigation:** Clear save status indicator, localStorage backup, retry failed saves

### Time Estimates

**Total Estimated Time: 40 hours**

Breakdown by phase:
- Database Migration: 0.5 hours
- Dependencies Installation: 0.25 hours
- Store Implementation: 4 hours
- Utilities/Composables: 3 hours
- Topic Components: 4 hours
- Note Components: 6 hours
- Search Implementation: 3 hours
- Real-time Sync: 2 hours
- Dashboard Widgets: 2 hours
- Notes View: 3 hours
- Keyboard Shortcuts: 2 hours
- Polish/Accessibility: 3 hours
- Testing: 4 hours
- Documentation/Deployment: 2 hours

**Buffer:** Add 25% buffer for unexpected issues = 10 hours

**Total with buffer: 50 hours (~1.5-2 weeks for one developer)**

### Blocking Issues

None identified. Phase 3 can proceed immediately as Phase 1 and 2 are complete.

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building the Notes System (Phase 3) of Coordino. The plan:

✅ Defines clear feature requirements based on user specifications
✅ Provides detailed technical architecture decisions
✅ Breaks implementation into manageable, testable steps
✅ Includes comprehensive testing strategy
✅ Identifies risks and mitigation strategies
✅ Sets clear success criteria

**Next Steps:**
1. Review and approve this implementation plan
2. Create GitHub issues/tasks for each implementation step
3. Begin with Step 1: Database Migration
4. Follow steps sequentially, testing thoroughly at each stage
5. Iterate based on feedback and testing results

**Questions or Concerns?**
Please review this plan thoroughly and raise any questions, concerns, or suggested modifications before we begin implementation. It's much easier to adjust the plan now than to course-correct during development.

---

**Document Status:** Ready for review and approval
**Last Updated:** December 2, 2025
