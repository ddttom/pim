# PIM User Manual

## Interface Overview

### Views

The application provides two main views for managing your entries:

#### List View

![Main Interface](images/main app screen.png)

The list view displays your entries in a table format with sortable columns:

- Content: First part of the entry text (hover to see full content)
- Type: Entry type (Note/Document/Template/HTML/Record/Task/Event)
- Date: Creation date of the entry
- Project: Associated project name
- Priority: Entry priority level (high/normal/low)
- Tags: Associated tags shown as pills
- Deadline: Due date if set

Click any column header to sort entries. Click again to reverse sort order.

#### Calendar View

The calendar view provides three different ways to view your entries:

- Month View: Traditional calendar grid showing entries per day
- Week View: Detailed view of a single week with hourly slots
- Day View: Full day view with detailed entry information

Navigation controls include:

- Year and month dropdown selectors
- Previous/Next month buttons
- Day/Week/Month view mode toggles

Each day shows:

- Date number
- Entry count badge
- Entry previews
- Visual indicators for today/selected

### Entry Interactions

You can interact with entries in both list and calendar views:

1. Preview Entry
   - Single click an entry to show preview
   - Preview shows:
     - Entry type with color badge
     - Creation and update dates
     - Full entry content
     - All metadata fields organized in sections
   - Available actions:
     - Edit (opens editor)
     - Copy to clipboard
     - Delete (with confirmation)
     - Close preview
   - Preview closes automatically when editing

2. Edit Entry
   - Double click an entry to edit directly
   - Click Edit button in preview
   - Full editor opens with all capabilities
   - Changes saved automatically

3. Quick Actions
   - Copy entry text to clipboard
   - Delete entry with confirmation
   - Edit in full editor
   - All actions available in preview modal

### Sidebar Navigation

![Sidebar](images/sidebar showing on main.png)

The sidebar provides quick access to filtered views:

- All Entries: Show all entries
- Overdue: Show entries past their deadline
- Priority:
  - High Priority
  - Normal Priority
  - Low Priority
- Type:
  - Note: General text entries
  - Document: Formatted documents
  - Template: Reusable templates
  - HTML: HTML content
  - Record: Data records
  - Task: Action items or to-dos
  - Event: Calendar events or meetings
- Categories:
  - Projects: Show entries with projects
  - Tags: Show entries with tags
- Status:
  - Archived: Show archived entries

### Toolbar

- New Entry: Create a new document
- Copy DB: Copy database contents to clipboard
- Settings: Access application settings

### Search

The search bar at the top allows you to:

- Search across all fields (content, projects, tags, etc.)
- Clear search with the (×) button or Escape key
- See results update in real-time as you type

## Text Parsing

The application automatically extracts metadata from your text using various parsers. Each parser looks for specific patterns and returns structured data.

### Available Parsers

1. Action Parser
   - Matches: "todo", "task", "action", "do"
   - Example: "todo: Review document"

2. Attendees/Participants
   - Matches: "with: John, Mary" or "participants: Team Alpha"
   - Example: "Meeting with John, Mary and Team Alpha"

3. Categories & Tags
   - Matches: "category: Work" or "#project"
   - Example: "category: Personal #health #exercise"

4. Complexity & Priority
   - Matches: "complexity: high" or "priority: p1"
   - Example: "complexity: medium priority: high"

5. Contact Information
   - Matches: email addresses and phone numbers
   - Example: "contact: <john@example.com> (123) 456-7890"

6. Dates & Times
   - Matches: "due: tomorrow" or "at: 3pm"
   - Example: "due: next Friday at 2:30pm"

7. Dependencies
   - Matches: "depends on: #123" or "after: #456"
   - Example: "depends on: #123, #456"

8. Duration
   - Matches: "duration: 2h 30m" or "takes: 45m"
   - Example: "duration: 1h 30m"

9. Links
   - Matches: URLs and web references
   - Example: "see: <https://example.com>"

10. Location
    - Matches: "at: Office" or "location: Room 101"
    - Example: "meeting in Conference Room A"

11. Project
    - Matches: "project: ProjectName" or "for: TeamAlpha"
    - Example: "project: Website Redesign"

12. Recurring
    - Matches: "repeat: daily" or "every: 2 weeks"
    - Example: "recurring: weekly"

13. Reminders
    - Matches: "remind: 30 minutes before"
    - Example: "reminder: 1 hour before"

14. Status
    - Matches: "status: in progress" or "state: completed"
    - Example: "status: pending"

15. Subject
    - Matches: "subject: Topic" or first line of text
    - Example: "subject: Team Meeting Notes"

16. Time of Day
    - Matches: "in the morning" or "during afternoon"
    - Example: "meeting in the afternoon"

17. Urgency
    - Matches: "urgent" or "urgency: high"
    - Example: "urgency: high ASAP"

### Parser Behavior

- Parsers silently handle errors and continue processing
- Failed matches return no results without affecting other parsers
- Debug logs are available for troubleshooting
- Multiple parsers can match in the same text
- Results are combined into structured metadata

### Examples

1. Meeting Entry:

   ```bash
   Team Sync Meeting
   with: John, Mary, Team Alpha
   at: Conference Room B
   time: 2pm
   duration: 1h
   recurring: weekly
   project: Website Redesign
   #meeting #sync
   ```

2. Task Entry:

   ```bash
   Review Documentation
   priority: high
   due: tomorrow at 5pm
   status: in progress
   depends on: #123
   project: Documentation
   remind: 1 hour before
   #docs #review
   ```

3. Contact Entry:

   ```bash
   John Smith Contact Info
   email: john@example.com
   phone: (123) 456-7890
   location: New York Office
   category: Business
   #contact
   ```

## Tips & Tricks

- Use the sidebar filters to quickly find entries
- Sort columns to organize your view
- Use tags to categorize entries
- Hover over truncated content to see full text
- Use keyboard shortcuts for common actions
- Collapse the sidebar to maximize workspace
- Use Copy DB to backup or share your data
- Archive old entries to keep your main view clean
- Use appropriate entry types for better organization:
  - Notes for general text and thoughts
  - Documents for formatted content
  - Templates for reusable structures
  - HTML for web content
  - Records for structured data
  - Tasks for action items
  - Events for calendar entries

## Keyboard Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save current entry
- `Ctrl+F`: Focus search
- `Ctrl+,`: Open settings
- `Ctrl+\`: Toggle sidebar
- `Esc`: Clear search (when search is focused)

## Troubleshooting

If you encounter issues:

1. Check settings configuration
2. Ensure entries are saved properly
3. Verify search/filter combinations
4. Clear search and filters to reset view
5. Restart the application if needed
6. Contact support with error details

## Data Management

- Entries are saved automatically
- Regular backups recommended (use Copy DB)
- Use projects and tags for organization
- Sort and filter to manage large sets of entries
- Search across all fields to find specific entries
