# PIM User Manual

## Introduction

PIM (Personal Information Management System) is a powerful desktop application designed to help you manage personal tasks, meetings, and information using natural language processing. This manual will guide you through all features and functionalities of the application.

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ddttom/pim.git
cd pim
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

## Core Features

### 1. Natural Language Input

PIM understands natural language, allowing you to enter tasks and information as you would speak or write them naturally.

#### Supported Input Patterns

- **Actions**: call, email, meet, review, etc.
- **Contacts**: Use @ to mention contacts (e.g., @John)
- **Dates and Times**: "tomorrow", "next week", "at 2pm"
- **Priorities**: urgent, high, medium, low
- **Categories**: Use # for tags (e.g., #work)
- **Duration**: "for 1 hour", "30 minutes"
- **Location**: "at office", "in conference room"
- **Project References**: "for Project X", "about Project Y"
- **Status Updates**: "- complete", "- blocked"

#### Examples

```bash
Call @John about Project Alpha tomorrow at 2pm #work
Meet with team next week in conference room - high priority
Review documentation for 30 minutes - complete
Email @Sarah about project status - blocked by pending approval
```

### 2. Entry Management

#### Creating Entries

1. Click "New Entry" button
2. Type your task using natural language
3. The system will automatically parse and categorize your entry
4. Review the parsed information
5. Click "Save" to store the entry

#### Editing Entries

1. Find the entry in the main view
2. Click the edit icon
3. Modify the entry text or individual fields
4. Click "Save" to update

#### Deleting Entries

1. Locate the entry you want to remove
2. Click the delete icon
3. Confirm deletion when prompted

#### Viewing Entry Details

1. Click the expand icon on any entry
2. View complete parsed information and metadata
3. See related entries and dependencies if any

### 3. Status Management

Entries can have the following statuses:

- **None**: Default status for new entries
- **Blocked**: Task is blocked by dependencies or issues
- **Started**: Work has begun on the task
- **Complete**: Task is finished
- **Closed**: Task is no longer active
- **Abandoned**: Task has been cancelled or dropped

To update status:

1. Edit the entry
2. Either:
   - Add status in text (e.g., "- complete")
   - Use the status dropdown in the edit form

### 4. Categories and Tags

Use hashtags (#) to categorize entries:

- #work
- #personal
- #urgent
- #meeting
- Custom categories as needed

### 5. Priority Management

Priorities can be set through:

- Natural language ("high priority", "urgent")
- Priority field in edit form

Available priorities:

- Urgent
- High
- Medium
- Low

### 6. Time Management

#### Date Formats

- Relative: "tomorrow", "next week"
- Specific: "on July 1st"
- Time of day: "at 2pm", "morning"
- Immediate: "now"

#### Default Times

- Morning: 9:00 AM
- Afternoon: 2:00 PM
- Evening: 6:00 PM

## Settings Management

### Accessing Settings

1. Click the settings icon
2. Navigate through different setting categories

### Available Settings

#### Parser Settings

- Default times for different periods
- Custom pattern definitions
- Status configurations

#### UI Preferences

- Theme selection
- Display density
- Column visibility
- Sort preferences

#### Time Preferences

- Working hours
- Default meeting duration
- Reminder intervals

#### Data Management

- Backup settings
- Import/Export options
- Data cleanup rules

### Saving Settings

1. Make desired changes
2. Click "Save" to apply
3. Restart application if prompted

## Tips and Best Practices

1. **Natural Language Input**
   - Be specific but natural in your entries
   - Include key information in a logical order
   - Use consistent formatting for similar types of entries

2. **Organization**
   - Use categories consistently
   - Maintain clear status updates
   - Regular cleanup of completed items

3. **Time Management**
   - Set realistic deadlines
   - Include duration for time-bound tasks
   - Use recurring patterns for regular tasks

4. **Project Management**
   - Group related tasks under projects
   - Use consistent project naming
   - Track dependencies between tasks

## Troubleshooting

### Common Issues

1. **Parser Not Recognizing Input**
   - Check input format
   - Verify parser settings
   - Review pattern configurations

2. **Performance Issues**
   - Check data file size
   - Run cleanup routines
   - Verify system resources

3. **Settings Not Saving**
   - Check file permissions
   - Verify configuration file integrity
   - Restart application

### Getting Help

- Check documentation in README.md
- Review technical details in projectstate.md
- Submit issues on GitHub repository

## Data

### Backup and Restore

1. Regular backups are automatic
2. Manual backup through settings
3. Restore from backup file

### Import/Export

- JSON data export
- Bulk operations available

## Keyboard Shortcuts

- New Entry: Ctrl/Cmd + N
- Save: Ctrl/Cmd + S
- Delete: Delete key
- Settings: Ctrl/Cmd + ,
- Refresh: F5
- Search: Ctrl/Cmd + F

## Security and Privacy

- Local data storage (JSON file)
- No cloud sync by default
- Regular backup recommendations

## Data Structure

Your data is stored in a JSON file with the following structure:

```javascript
{
  "entries": [
    {
      "id": "unique-identifier",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "raw_content": "your input text",
      "parsed": {
        "action": "type of action",
        "contact": "person name",
        "project": {
          "project": "project name"
        },
        "final_deadline": "date/time",
        "status": "current status",
        "categories": ["list", "of", "categories"]
      },
      "plugins": {}
    }
  ],
  "settings": {
    "your-setting-key": "setting-value"
  }
}
```

This structure preserves all parsed information exactly as interpreted by the system.
