# Notes Feature Documentation

## Overview

The Notes feature provides a comprehensive note-taking system with rich text editing, topic-based organization, full-text search, and real-time synchronization. Users can capture, organize, and retrieve their thoughts, ideas, and important information efficiently.

## Features

### Core Functionality
- **Rich Text Editing**: Full-featured editor powered by Tiptap with support for:
  - Text formatting (bold, italic, underline)
  - Headings (H1, H2, H3)
  - Lists (bullet, numbered)
  - Links with custom URLs
  - Code blocks and blockquotes
  - Horizontal rules

- **Topic Organization**: Organize notes into color-coded topics
  - Drag-and-drop reordering
  - Custom colors for visual identification
  - Topic-based filtering

- **Note Management**:
  - Pin important notes for quick access
  - Archive notes to reduce clutter
  - Soft delete with recovery option
  - Autosave with 3-second debounce
  - Word count and reading time estimates

- **Full-Text Search**: PostgreSQL-powered search with:
  - GIN indexes for performance
  - Highlighting of search terms
  - Contextual snippets
  - Topic and date range filters

- **Real-Time Sync**: Changes synchronized across tabs/devices using Supabase subscriptions

### User Experience
- **Keyboard Shortcuts**: Efficient navigation and editing
  - `Ctrl/Cmd+N` - New note
  - `Ctrl/Cmd+K` - Search
  - `Ctrl/Cmd+S` - Save
  - `Ctrl/Cmd+P` - Toggle pin
  - `Escape` - Close/go back

- **Accessibility**: WCAG 2.1 Level AA compliant
  - ARIA live regions for screen readers
  - Keyboard navigation
  - Proper focus management
  - Screen reader announcements

- **Dark Mode**: Full dark mode support throughout

## Architecture

### Database Schema

```sql
-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);
CREATE INDEX idx_notes_pinned ON notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_active ON notes(user_id, archived_at) WHERE archived_at IS NULL;
```

### Component Structure

```
src/features/notes/
├── components/
│   ├── TopicCard.vue           # Individual topic display
│   ├── TopicDialog.vue          # Create/edit topic modal
│   ├── TopicList.vue            # Sidebar with draggable topics
│   ├── NoteCard.vue             # Note preview card
│   ├── NoteList.vue             # Grid/list of notes
│   ├── NoteEditor.vue           # Main editor with autosave
│   ├── EditorToolbar.vue        # Rich text toolbar
│   ├── NoteSearchBar.vue        # Search input with filters
│   ├── NoteSearchResults.vue    # Search results display
│   ├── SearchResultCard.vue     # Individual search result
│   ├── RecentNotesWidget.vue    # Dashboard widget
│   ├── NoteStatsWidget.vue      # Statistics widget
│   ├── KeyboardShortcutsHelp.vue # Shortcuts modal
│   └── ShortcutItem.vue         # Individual shortcut display
├── composables/
│   ├── useNoteEditor.js         # Tiptap editor integration
│   ├── useNoteAutosave.js       # Autosave with debounce
│   ├── useNoteSearch.js         # Search functionality
│   ├── useNoteKeyboardShortcuts.js # Keyboard shortcuts
│   └── useAccessibilityAnnouncements.js # Screen reader support
├── store.js                     # Pinia store
└── utils.js                     # Utility functions
```

### State Management

The notes feature uses Pinia for state management:

```javascript
const notesStore = useNotesStore()

// State
notesStore.notes          // All notes
notesStore.topics         // All topics
notesStore.selectedTopicId // Currently selected topic
notesStore.loading        // Loading state
notesStore.error          // Error state

// Computed
notesStore.filteredNotes  // Notes filtered by topic/archived
notesStore.pinnedNotes    // Pinned notes only
notesStore.recentNotes    // Recent notes sorted by update time
notesStore.activeNotesCount // Count of active notes

// Actions
notesStore.fetchNotes()
notesStore.createNote(data)
notesStore.updateNote(id, data)
notesStore.deleteNote(id)
notesStore.togglePin(id)
notesStore.toggleArchive(id)
notesStore.searchNotes(query)
notesStore.fetchTopics()
notesStore.createTopic(data)
notesStore.updateTopic(id, data)
notesStore.deleteTopic(id)
notesStore.reorderTopics(topics)
```

## Security

### XSS Prevention

HTML content is sanitized using DOMPurify with a strict allow-list:

```javascript
const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
                   'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a',
                   'blockquote', 'code', 'pre', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  })
}
```

All user-generated content is sanitized before storage and display.

### Row Level Security

Database access is protected by Supabase RLS policies:

```sql
-- Users can only access their own notes
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
```

## Performance

### Optimization Strategies

1. **Database Indexes**: GIN index on search_vector for fast full-text search
2. **Partial Indexes**: Indexes on pinned and active notes for common queries
3. **Debounced Autosave**: 3-second debounce to minimize database writes
4. **Optimistic Updates**: Immediate UI updates with rollback on error
5. **Virtual Scrolling**: (Future) For large note lists
6. **Lazy Loading**: Components loaded on-demand

### Search Performance

Full-text search uses PostgreSQL's built-in text search capabilities:

```javascript
// Example search query
const { data } = await supabase
  .from('notes')
  .select('*, topic:topics(id, name, color)')
  .textSearch('search_vector', query, {
    type: 'websearch',
    config: 'english'
  })
  .is('archived_at', null)
  .limit(50)
```

## Testing

### Test Coverage

- **Store Tests**: 15+ tests covering state, computed properties, and actions
- **Utils Tests**: 30+ tests covering sanitization, validation, and text manipulation
- **Component Tests**: 15+ tests for rendering, interactions, and events

### Running Tests

```bash
# Run all tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test:unit src/features/notes/__tests__/store.test.js
```

## Future Enhancements

### Planned Features
- [ ] Note templates
- [ ] Markdown support
- [ ] Image upload and embedding
- [ ] Note linking (backlinks)
- [ ] Export to PDF/Markdown
- [ ] Collaborative editing
- [ ] Version history
- [ ] Tags (in addition to topics)
- [ ] Note sharing with permissions

### Performance Improvements
- [ ] Virtual scrolling for large lists
- [ ] Incremental search results
- [ ] Offline support with service worker
- [ ] Image optimization and lazy loading

## Troubleshooting

### Common Issues

**Search not returning results:**
- Check that search_vector column exists in database
- Verify GIN index is created
- Ensure notes contain searchable content

**Autosave not working:**
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies allow updates

**Real-time sync not working:**
- Verify Supabase Realtime is enabled for notes table
- Check browser supports WebSockets
- Verify user permissions

### Debug Mode

Enable debug logging in the notes store:

```javascript
// In store.js
const DEBUG = true // Set to true for verbose logging
```

## Contributing

### Adding a New Feature

1. Update database schema if needed (create migration)
2. Add store actions and state
3. Create/update components
4. Write tests
5. Update documentation
6. Test accessibility
7. Submit PR

### Code Style

- Use Composition API for Vue components
- Follow existing patterns for consistency
- Add JSDoc comments to functions
- Write tests for new functionality
- Ensure accessibility compliance

## Support

For issues or questions:
- Check existing issues on GitHub
- Review this documentation
- Check browser console for errors
- Verify Supabase connection and policies
