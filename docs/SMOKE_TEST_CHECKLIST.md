# Coordino - Smoke Test Checklist

## Test Environment Setup

**Application URL:** `http://localhost:5173`

**Test Account Credentials:**
- **Email:** `test@playwright.com`
- **Password:** `test@playwright2025`

**Prerequisites:**
- Application dev server must be running (`npm run dev`)
- Database must be seeded with test data
- Use chrome-devtools to execute the following tests
- Browser console should be monitored throughout testing for errors/warnings

---

## Test Execution Instructions

### Console Monitoring
Before each test section, verify:
- [ ] Open browser DevTools (F12)
- [ ] Navigate to Console tab
- [ ] Clear console
- [ ] Monitor for any errors (red) or warnings (yellow) during test execution

---

## 1. Authentication & Onboarding

### 1.1 Login Flow
- [ ] **Navigate** to `http://localhost:5173`
- [ ] **Verify** you are redirected to login page if not authenticated
- [ ] **Enter** email: `test@playwright.com`
- [ ] **Enter** password: `test@playwright2025`
- [ ] **Click** "Sign In" button
- [ ] **Wait** for authentication (loading spinner should appear)
- [ ] **Verify** successful redirect to `/dashboard` route
- [ ] **Check Console** - No errors or warnings should appear

**Expected Result:** User is logged in and sees the dashboard with their name in the greeting

---

## 2. Dashboard Tests

### 2.1 Header & Greeting
- [ ] **Verify** personalized greeting appears: "Good [Morning/Afternoon/Evening], [FirstName]"
- [ ] **Verify** correct time of day is shown based on current time

### 2.2 Continue Where You Left Off Section
- [ ] **Verify** "Continue where you left off" section is visible (if user has recent activity)
- [ ] **Verify** shows up to 5 recent activities with icons, titles, and timestamps
- [ ] **Click** on a recent activity item
- [ ] **Verify** navigation to the correct item detail page
- [ ] **Navigate** back to dashboard
- [ ] **Check Console** - No errors

### 2.3 Interactive Stat Cards
- [ ] **Verify** 3 stat cards are displayed:
  - Urgent Tasks (with count)
  - High Priority Tasks (with count)
  - Overdue Tasks (with count and red styling)
- [ ] **Hover** over first stat card (Urgent)
- [ ] **Verify** hover effect: scale increase, arrow appears
- [ ] **Click** on "Urgent Tasks" card
- [ ] **Verify** navigation to Tasks page with "urgent" filter applied
- [ ] **Navigate** back to dashboard
- [ ] **Click** on "High Priority" card
- [ ] **Verify** navigation to Tasks page with "high-priority" filter applied
- [ ] **Navigate** back to dashboard
- [ ] **Click** on "Overdue" card
- [ ] **Verify** navigation to Tasks page with "overdue" filter applied
- [ ] **Navigate** back to dashboard
- [ ] **Check Console** - No errors

### 2.4 My Tasks Section
- [ ] **Verify** "My Tasks" section displays up to 5 active tasks
- [ ] **Verify** each task card shows:
  - Checkbox
  - Task title
  - Priority badge (if set)
  - Status badge
  - Due date (if set)
- [ ] **Hover** over a task card
- [ ] **Verify** action buttons appear (edit, delete)
- [ ] **Click** on a task card
- [ ] **Verify** task detail dialog opens
- [ ] **Close** dialog
- [ ] **Check Console** - No errors

### 2.5 Skeleton Loading (if loading state can be triggered)
- [ ] **Refresh** the page
- [ ] **Verify** stat card skeletons appear briefly during loading
- [ ] **Verify** shimmer animation on skeletons
- [ ] **Verify** smooth transition from skeleton to actual content
- [ ] **Check Console** - No errors

---

## 3. Tasks Module Tests

### 3.1 Navigation to Tasks
- [ ] **Click** "Tasks" in the navigation menu
- [ ] **Verify** navigation to `/tasks` route
- [ ] **Verify** page title shows "Tasks"
- [ ] **Check Console** - No errors

### 3.2 Task Filters - Chip-Based (US-006)
- [ ] **Verify** prominent search bar is displayed with "⌘K" hint
- [ ] **Verify** filter chips are displayed:
  - All Tasks (active by default)
  - Today
  - High Priority
  - In Progress
  - Completed
- [ ] **Verify** each chip shows a count badge
- [ ] **Click** "Today" chip
- [ ] **Verify** chip becomes active (teal background)
- [ ] **Verify** task list filters to show only today's tasks
- [ ] **Click** "High Priority" chip
- [ ] **Verify** task list updates to show only high priority tasks
- [ ] **Click** "All Tasks" chip
- [ ] **Verify** all tasks are shown again
- [ ] **Check Console** - No errors

### 3.3 Task Search
- [ ] **Type** "test" in the search bar
- [ ] **Verify** task list filters in real-time
- [ ] **Verify** only tasks matching "test" are shown
- [ ] **Clear** search input
- [ ] **Verify** all tasks are shown again
- [ ] **Check Console** - No errors

### 3.4 Compact Task Cards (US-005)
- [ ] **Verify** tasks are displayed in a compact list format
- [ ] **Verify** each task shows:
  - Checkbox on the left
  - Task title
  - Metadata badges (priority, status, category)
  - Hover-only action buttons (edit, delete)
- [ ] **Measure** vertical spacing - should be ~10px (0.625rem) between tasks
- [ ] **Hover** over a task
- [ ] **Verify** action buttons (edit, delete) become visible
- [ ] **Move mouse away**
- [ ] **Verify** action buttons fade out
- [ ] **Check Console** - No errors

### 3.5 Create New Task
- [ ] **Click** "New Task" button (top right)
- [ ] **Verify** task dialog opens with fade-in animation
- [ ] **Enter** task title: "Test Task - Smoke Test"
- [ ] **Select** priority: "High"
- [ ] **Select** status: "In Progress"
- [ ] **Enter** description: "This is a test task for smoke testing"
- [ ] **Select** due date: tomorrow's date
- [ ] **Click** "Save" button
- [ ] **Verify** success toast notification appears (slide-in from top-right)
- [ ] **Verify** toast shows: "Task Created - Test Task - Smoke Test"
- [ ] **Verify** new task appears in the task list
- [ ] **Check Console** - No errors

### 3.6 Edit Task
- [ ] **Click** on the "Test Task - Smoke Test" task
- [ ] **Verify** task dialog opens with task details populated
- [ ] **Update** title to: "Test Task - Updated"
- [ ] **Change** priority to: "Urgent"
- [ ] **Click** "Save" button
- [ ] **Verify** success toast notification appears
- [ ] **Verify** task is updated in the list with new title and priority badge
- [ ] **Check Console** - No errors

### 3.7 Complete Task with Checkmark Animation (US-011)
- [ ] **Click** checkbox on "Test Task - Updated"
- [ ] **Verify** checkmark-pop animation plays (scale effect)
- [ ] **Verify** task gets strikethrough styling
- [ ] **Verify** success toast: "Task Completed"
- [ ] **Verify** task moves to completed section or gets filtered based on current filter
- [ ] **Click** checkbox again to uncomplete
- [ ] **Verify** task returns to active state
- [ ] **Verify** success toast: "Task Reopened"
- [ ] **Check Console** - No errors

### 3.8 Delete Task
- [ ] **Hover** over "Test Task - Updated"
- [ ] **Click** delete button (trash icon)
- [ ] **Verify** confirmation dialog appears with warning message
- [ ] **Verify** dialog has fade-in animation
- [ ] **Click** "Delete" button
- [ ] **Verify** success toast: "Task Deleted"
- [ ] **Verify** task is removed from the list
- [ ] **Check Console** - No errors

### 3.9 Manage Statuses
- [ ] **Click** "Manage Statuses" button (top right)
- [ ] **Verify** Status Manager dialog opens
- [ ] **Verify** existing statuses are displayed (To Do, In Progress, Done, etc.)
- [ ] **Click** "Add Status" button
- [ ] **Enter** status name: "Testing"
- [ ] **Select** color: Blue
- [ ] **Click** "Save"
- [ ] **Verify** new status appears in the list
- [ ] **Close** Status Manager dialog
- [ ] **Check Console** - No errors

### 3.10 Manage Categories
- [ ] **Click** "Manage Categories" button (top right)
- [ ] **Verify** Category Manager dialog opens
- [ ] **Verify** existing categories are displayed
- [ ] **Click** "Add Category" button
- [ ] **Enter** category name: "Test Category"
- [ ] **Select** color: Green
- [ ] **Click** "Save"
- [ ] **Verify** new category appears in the list
- [ ] **Close** Category Manager dialog
- [ ] **Check Console** - No errors

### 3.11 Skeleton Loading
- [ ] **Refresh** the tasks page
- [ ] **Verify** task skeleton components appear briefly
- [ ] **Verify** skeletons match task card layout (checkbox, title bars, badges)
- [ ] **Verify** shimmer animation plays (1.5s loop)
- [ ] **Verify** smooth transition from skeleton to actual tasks
- [ ] **Check Console** - No errors

---

## 4. Notes Module Tests

### 4.1 Navigation to Notes
- [ ] **Click** "Notes" in the navigation menu
- [ ] **Verify** navigation to `/notes` route
- [ ] **Verify** side-by-side layout is displayed (US-009)
- [ ] **Check Console** - No errors

### 4.2 Side-by-Side Layout (US-009)
- [ ] **Verify** 3-column grid layout:
  - Left: Topic sidebar (~240px)
  - Center: Notes list (~380px)
  - Right: Editor panel (fills remaining space)
- [ ] **Verify** editor panel shows empty state with:
  - File icon
  - "No note selected" heading
  - Descriptive text
- [ ] **Check Console** - No errors

### 4.3 Topic Management
- [ ] **Verify** topic list is visible in left sidebar
- [ ] **Click** on a topic (e.g., "Personal" or "Work")
- [ ] **Verify** notes list updates to show notes for that topic
- [ ] **Verify** topic is highlighted/selected
- [ ] **Check Console** - No errors

### 4.4 Create Note
- [ ] **Click** "New Note" button (top right in notes list panel)
- [ ] **Verify** editor panel activates on the right
- [ ] **Verify** notes list remains visible (side-by-side)
- [ ] **Enter** note title: "Smoke Test Note"
- [ ] **Enter** note content: "This is a test note for smoke testing the side-by-side view."
- [ ] **Click** "Save" button
- [ ] **Verify** success toast notification appears
- [ ] **Verify** new note appears in the notes list
- [ ] **Verify** editor remains open with the saved note
- [ ] **Check Console** - No errors

### 4.5 Edit Note
- [ ] **Click** on "Smoke Test Note" in the notes list
- [ ] **Verify** note content loads in the editor (right panel)
- [ ] **Verify** notes list stays visible (not replaced by editor)
- [ ] **Append** to content: "\n\nUpdated during smoke testing."
- [ ] **Wait** for autosave (should see saving indicator)
- [ ] **Verify** note is saved automatically
- [ ] **Check Console** - No errors

### 4.6 Switch Between Notes
- [ ] **Click** on a different note in the notes list
- [ ] **Verify** editor updates to show the new note
- [ ] **Verify** notes list remains visible
- [ ] **Verify** previous note is deselected, new note is highlighted
- [ ] **Check Console** - No errors

### 4.7 Note Search
- [ ] **Type** "test" in the search bar
- [ ] **Verify** notes list filters to show matching notes
- [ ] **Verify** search results are displayed
- [ ] **Click** on a search result
- [ ] **Verify** note opens in the editor
- [ ] **Clear** search
- [ ] **Verify** all notes for the selected topic are shown again
- [ ] **Check Console** - No errors

### 4.8 Close Editor
- [ ] **Click** the close button (X) in the editor header
- [ ] **Verify** editor returns to empty state
- [ ] **Verify** notes list remains visible
- [ ] **Check Console** - No errors

### 4.9 Pin/Unpin Note
- [ ] **Open** a note in the editor
- [ ] **Click** pin icon/button
- [ ] **Verify** success toast: "Note Pinned"
- [ ] **Verify** note shows pin indicator in the list
- [ ] **Click** pin icon again
- [ ] **Verify** success toast: "Note Unpinned"
- [ ] **Check Console** - No errors

### 4.10 Delete Note
- [ ] **Open** "Smoke Test Note" in the editor
- [ ] **Click** delete button
- [ ] **Verify** confirmation dialog appears
- [ ] **Click** "Delete" to confirm
- [ ] **Verify** success toast: "Note Deleted"
- [ ] **Verify** note is removed from the list
- [ ] **Verify** editor shows empty state
- [ ] **Check Console** - No errors

---

## 5. Scheduling Module Tests

### 5.1 Navigation to Scheduling
- [ ] **Click** "Scheduling" in the navigation menu
- [ ] **Verify** navigation to `/scheduling` route
- [ ] **Verify** meeting list page is displayed
- [ ] **Check Console** - No errors

### 5.2 Participant Management
- [ ] **Navigate** to Participants section (if separate) or click "Manage Participants"
- [ ] **Click** "Add Participant" button
- [ ] **Enter** participant name: "John Doe"
- [ ] **Select** timezone: "America/New_York"
- [ ] **Enter** email: "john.doe@example.com"
- [ ] **Select** working hours: 9:00 AM - 5:00 PM
- [ ] **Click** "Save"
- [ ] **Verify** success toast notification
- [ ] **Verify** participant appears in the list
- [ ] **Check Console** - No errors

### 5.3 Create Meeting
- [ ] **Click** "New Meeting" or "Schedule Meeting" button
- [ ] **Enter** meeting title: "Smoke Test Meeting"
- [ ] **Select** date: tomorrow
- [ ] **Select** time: 10:00 AM
- [ ] **Select** duration: 60 minutes
- [ ] **Add** participant: "John Doe"
- [ ] **Enter** notes: "Testing meeting scheduler"
- [ ] **Click** "Create Meeting"
- [ ] **Verify** success toast notification
- [ ] **Verify** navigation to meeting detail page
- [ ] **Check Console** - No errors

### 5.4 Optimized Heatmap Visualization (US-012)
- [ ] **Verify** heatmap section is displayed on meeting detail page
- [ ] **Verify** heatmap legend shows:
  - Excellent (80-100) - Green
  - Good (60-79) - Yellow
  - Fair (40-59) - Orange
  - Poor (0-39) - Red
- [ ] **Verify** heatmap grid uses 6-column layout (not 12)
- [ ] **Verify** each time slot is larger and more readable
- [ ] **Verify** each slot displays:
  - Time (e.g., "10:00 AM")
  - Equity score (large number, e.g., "85")
  - Participant breakdown badges (green, orange, red counts)
- [ ] **Measure** slot size - should be approximately 2x larger than before
- [ ] **Check Console** - No errors

### 5.5 Heatmap Interactions
- [ ] **Hover** over a time slot
- [ ] **Verify** hover effect: scale increase, shadow appears
- [ ] **Verify** tooltip shows full details
- [ ] **Click** on a time slot with good score (green/yellow)
- [ ] **Verify** slot gets 3px teal border (selected state)
- [ ] **Verify** "Selected Slot Details" panel appears below heatmap
- [ ] **Verify** details panel shows:
  - Selected time
  - Equity score out of 100
  - Participant breakdown with colored badges
  - Critical conflicts warning (if any)
- [ ] **Check Console** - No errors

### 5.6 Keyboard Navigation (US-012)
- [ ] **Click** on a time slot to focus it
- [ ] **Press** Right Arrow key
- [ ] **Verify** focus moves to the next slot (one to the right)
- [ ] **Verify** selected slot details update
- [ ] **Press** Left Arrow key
- [ ] **Verify** focus moves back one slot
- [ ] **Press** Down Arrow key
- [ ] **Verify** focus moves down 6 slots (next row in 6-column grid)
- [ ] **Press** Up Arrow key
- [ ] **Verify** focus moves up 6 slots
- [ ] **Press** Enter or Space
- [ ] **Verify** slot is selected and details are shown
- [ ] **Check Console** - No errors

### 5.7 Optimal Time Suggestions
- [ ] **Verify** "Optimal Time Suggestions" section is displayed
- [ ] **Verify** shows top 3-5 best meeting times
- [ ] **Verify** each suggestion shows time and equity score
- [ ] **Click** on an optimal time suggestion
- [ ] **Verify** meeting time updates to the selected time
- [ ] **Verify** heatmap highlights the selected hour
- [ ] **Verify** success toast notification
- [ ] **Check Console** - No errors

### 5.8 Edit Meeting Time
- [ ] **Click** "Edit" button
- [ ] **Verify** time adjustment panel appears
- [ ] **Change** meeting date
- [ ] **Change** meeting time
- [ ] **Verify** heatmap recalculates in real-time (instant updates)
- [ ] **Click** "Save Changes"
- [ ] **Verify** success toast: "Meeting time updated"
- [ ] **Check Console** - No errors

### 5.9 Responsive Heatmap
- [ ] **Resize** browser window to tablet size (~900px width)
- [ ] **Verify** heatmap switches to 4-column layout
- [ ] **Resize** to mobile size (~600px width)
- [ ] **Verify** heatmap switches to 2-column layout
- [ ] **Verify** legend stacks vertically
- [ ] **Verify** slots remain readable and interactive
- [ ] **Restore** browser to full size
- [ ] **Check Console** - No errors

---

## 6. Global Features

### 6.1 Global FAB (Floating Action Button) - US-003
- [ ] **Verify** FAB is visible in the bottom-right corner (circular button with plus icon)
- [ ] **Verify** FAB is 56px x 56px with teal background
- [ ] **Verify** FAB has shadow and hover effect
- [ ] **Click** FAB
- [ ] **Verify** menu expands showing 3 options:
  - New Task
  - New Note
  - New Meeting
- [ ] **Verify** backdrop appears behind menu
- [ ] **Hover** over each option
- [ ] **Verify** hover effects work
- [ ] **Click** backdrop or press ESC
- [ ] **Verify** menu closes
- [ ] **Click** FAB again
- [ ] **Click** "New Task" option
- [ ] **Verify** navigation to tasks page with create dialog open
- [ ] **Close** dialog
- [ ] **Check Console** - No errors

### 6.2 Command Palette - US-004
- [ ] **Press** Ctrl+K (or Cmd+K on Mac)
- [ ] **Verify** Command Palette opens with overlay
- [ ] **Verify** search input is focused
- [ ] **Type** "dashboard"
- [ ] **Verify** commands filter to show matching items
- [ ] **Verify** "Go to Dashboard" appears in results
- [ ] **Press** Down Arrow to navigate
- [ ] **Verify** selection moves down the list
- [ ] **Press** Enter
- [ ] **Verify** navigation to dashboard occurs
- [ ] **Press** Ctrl+K again
- [ ] **Type** "task"
- [ ] **Verify** shows:
  - "Create New Task" in Actions category
  - Recent tasks in Recent Tasks category
- [ ] **Press** ESC
- [ ] **Verify** Command Palette closes
- [ ] **Check Console** - No errors

### 6.3 Theme Switching (Dark Mode - US-001)
- [ ] **Locate** theme toggle button (usually in header/settings)
- [ ] **Verify** current theme (light or dark)
- [ ] **Click** theme toggle
- [ ] **Verify** smooth transition to opposite theme
- [ ] **Verify** dark mode uses Netflix-style #141414 (not pure black)
- [ ] **Verify** all components update colors correctly:
  - Background: #141414
  - Surface: #1f1f1f
  - Elevated: #2a2a2a
  - Text is readable
  - Brand teal colors show correct contrast
- [ ] **Toggle** back to light mode
- [ ] **Verify** smooth transition
- [ ] **Check Console** - No errors

### 6.4 Micro-Interactions (US-011)
- [ ] **Hover** over any button
- [ ] **Verify** button scales to 1.02x
- [ ] **Click and hold** button
- [ ] **Verify** button scales to 0.98x
- [ ] **Release** button
- [ ] **Verify** button returns to normal scale
- [ ] **Tab** through interactive elements
- [ ] **Verify** focus indicators are always visible (2px teal outline)
- [ ] **Open** any dialog
- [ ] **Verify** dialog content fades in with stagger effect (children appear with delay)
- [ ] **Trigger** a toast notification (e.g., complete a task)
- [ ] **Verify** toast slides in from top-right
- [ ] **Hover** over a stat card
- [ ] **Verify** card lifts slightly (translateY -2px)
- [ ] **Check Console** - No errors

---

## 7. Accessibility Tests

### 7.1 Keyboard Navigation
- [ ] **Press** Tab key repeatedly
- [ ] **Verify** focus moves through all interactive elements in logical order
- [ ] **Verify** focus indicator (2px teal outline) is always visible
- [ ] **Navigate** to a button using Tab
- [ ] **Press** Enter or Space
- [ ] **Verify** button activates correctly
- [ ] **Check Console** - No errors

### 7.2 ARIA Labels
- [ ] **Open** browser accessibility inspector
- [ ] **Verify** interactive elements have appropriate ARIA labels
- [ ] **Verify** stat cards have aria-label describing their purpose
- [ ] **Verify** heatmap slots have aria-label with time and score
- [ ] **Verify** skeleton loaders have aria-busy="true"
- [ ] **Check Console** - No errors

### 7.3 Reduced Motion
- [ ] **Enable** "prefers-reduced-motion" in browser settings
- [ ] **Refresh** the page
- [ ] **Verify** animations are disabled or significantly reduced
- [ ] **Verify** application remains functional
- [ ] **Disable** "prefers-reduced-motion"
- [ ] **Check Console** - No errors

---

## 8. Responsive Design Tests

### 8.1 Desktop (1920x1080)
- [ ] **Set** browser window to 1920x1080
- [ ] **Navigate** through all main pages
- [ ] **Verify** layouts look correct and spacious
- [ ] **Verify** heatmap shows 6 columns
- [ ] **Verify** notes show 3-column layout
- [ ] **Check Console** - No errors

### 8.2 Tablet (768x1024)
- [ ] **Resize** browser to tablet size
- [ ] **Navigate** through all main pages
- [ ] **Verify** layouts adapt correctly
- [ ] **Verify** heatmap shows 4 columns
- [ ] **Verify** notes show 2-column layout (topics hidden)
- [ ] **Verify** all buttons and interactions still work
- [ ] **Check Console** - No errors

### 8.3 Mobile (375x667)
- [ ] **Resize** browser to mobile size
- [ ] **Navigate** through all main pages
- [ ] **Verify** layouts stack vertically
- [ ] **Verify** heatmap shows 2 columns
- [ ] **Verify** notes stack vertically (list above editor)
- [ ] **Verify** FAB remains accessible
- [ ] **Verify** touch targets are appropriately sized
- [ ] **Check Console** - No errors

---

## 9. Performance Tests

### 9.1 Page Load Times
- [ ] **Open** DevTools Performance tab
- [ ] **Record** page load for Dashboard
- [ ] **Verify** page loads in < 2 seconds
- [ ] **Verify** First Contentful Paint < 1 second
- [ ] **Verify** Time to Interactive < 2 seconds
- [ ] **Check Console** - No errors

### 9.2 Navigation Performance
- [ ] **Navigate** between pages (Dashboard → Tasks → Notes → Scheduling)
- [ ] **Verify** navigation is smooth without flickering
- [ ] **Verify** skeleton loaders appear briefly during data fetching
- [ ] **Verify** transitions feel snappy (< 500ms)
- [ ] **Check Console** - No errors

---

## 10. Data Persistence

### 10.1 Activity Tracking
- [ ] **Click** on several tasks, notes, and meetings
- [ ] **Navigate** back to Dashboard
- [ ] **Verify** "Continue where you left off" shows your recent activities
- [ ] **Refresh** the page
- [ ] **Verify** recent activities persist (stored in localStorage)
- [ ] **Check Console** - No errors

### 10.2 Theme Preference
- [ ] **Switch** to dark mode
- [ ] **Refresh** the page
- [ ] **Verify** dark mode persists after refresh
- [ ] **Switch** back to light mode
- [ ] **Refresh** the page
- [ ] **Verify** light mode persists
- [ ] **Check Console** - No errors

---

## 11. Error Handling

### 11.1 Network Errors
- [ ] **Open** DevTools Network tab
- [ ] **Enable** offline mode
- [ ] **Try** to create a task
- [ ] **Verify** error toast appears with friendly message
- [ ] **Verify** user is not blocked from interacting with the app
- [ ] **Disable** offline mode
- [ ] **Check Console** - Verify only expected network errors appear

### 11.2 Invalid Data
- [ ] **Try** to create a task with empty title
- [ ] **Verify** validation error message appears
- [ ] **Verify** form does not submit
- [ ] **Enter** valid title
- [ ] **Verify** form submits successfully
- [ ] **Check Console** - No errors

---

## 12. Logout

### 12.1 Logout Flow
- [ ] **Click** on user profile/menu (usually top-right)
- [ ] **Click** "Logout" or "Sign Out"
- [ ] **Verify** user is logged out
- [ ] **Verify** redirect to login page
- [ ] **Verify** session is cleared
- [ ] **Try** to navigate to `/dashboard` directly
- [ ] **Verify** redirect back to login page (authentication guard works)
- [ ] **Check Console** - No errors

---

## Test Summary Report Template

After completing all tests, document results:

### Execution Summary
- **Test Date:** [Date]
- **Tested By:** [Name/AI Agent]
- **Environment:** [Browser, OS]
- **Application Version:** [Commit Hash]

### Results
- **Total Tests:** [Number]
- **Passed:** [Number]
- **Failed:** [Number]
- **Skipped:** [Number]

### Console Errors Found
List any errors or warnings found in the console:
1. [Error description, page, steps to reproduce]
2. [Error description, page, steps to reproduce]

### Failed Tests
List any failed tests with details:
1. **Test ID:** [e.g., 3.4]
   - **Description:** [What was being tested]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Console Output:** [Any relevant errors]

### Performance Issues
List any performance concerns:
1. [Description of slow operation, timing measurements]

### Recommendations
List any recommended fixes or improvements:
1. [Recommendation]

---

## Notes for AI Automation

### Selenium/Playwright Script Hints

**Selectors to Use:**
- FAB: `.fab-main` or `button` with class containing `fab`
- Command Palette: `.command-palette` or press Ctrl+K
- Stat Cards: `.stat-card.interactive`
- Task Cards: `.task-item`
- Filter Chips: `.filter-chip`
- Heatmap Slots: `.slot` within `.heatmap-grid`
- Toast Notifications: `.p-toast`
- Skeleton Loaders: `[aria-busy="true"]`

**Wait Strategies:**
- Wait for navigation: `waitForURL()`
- Wait for elements: `waitForSelector()`
- Wait for API responses: `waitForResponse()`
- Wait for animations: `setTimeout(300)` after interactions

**Console Monitoring:**
```javascript
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  }
});
```

**Screenshot Strategy:**
- Take screenshot after each major section
- Take screenshot of any errors
- Compare screenshots for visual regression testing

---

**End of Smoke Test Checklist**
