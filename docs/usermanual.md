# PIM User Manual

## Interface Overview

### Main Interface

The main interface consists of:

- Ribbon toolbar at the top
- Collapsible sidebar for navigation
- Main content area showing entries
- Status bar at the bottom

### Key Areas

1. Ribbon Toolbar
   - New Entry button
   - Filters toggle
   - Settings access
   - Copy DB function

2. Sidebar Navigation
   - All Entries view
   - Priority filters
   - Type filters
   - Category filters
   - Status filters

3. Main Content
   - Entries list with sortable columns
   - Search functionality
   - Entry preview and editing

## Configuration Guide

### Settings Overview

PIM uses a layered configuration system to manage your preferences and settings:

1. Environment Variables (highest priority)
2. Settings File (settings.json)
3. User Config File (config.json)
4. Default Values (lowest priority)

### Basic Settings

Access settings through:

- Click the Settings button in the toolbar
- Use the keyboard shortcut `Ctrl+,`

Common settings include:

- Theme (light/dark)
- Font size
- Autosave preferences
- Keyboard shortcuts
- Sync preferences

### Settings Files

Your settings are stored in these locations:

```bash
data/
├── settings.json     # User preferences
└── config.json      # Application configuration
```

#### Settings File (settings.json)

- Contains your personal preferences
- Automatically saved when you change settings
- Can be backed up and restored

Example settings:

```json
{
  "theme": {
    "name": "light",
    "custom": {
      "primary": "#3498db",
      "background": "#f5f5f5"
    }
  },
  "dateFormat": "EU-medium",
  "shortcuts": {
    "enabled": true,
    "custom": {
      "newEntry": "ctrl+n",
      "save": "ctrl+s"
    }
  }
}
```

#### Advanced Configuration

For advanced users, you can use environment variables to temporarily override settings:

- Format: `pim.category.setting=value`
- Examples:

  ```bash
  pim.parser.maxDepth=5
  pim.reminders.defaultMinutes=30
  ```

### Database Management

PIM stores your entries in a JSON database (pim.db). Important features:

1. Backup and Restore
   - Use "Copy DB" button to copy database to clipboard
   - Save regular backups
   - Restore from backup file when needed

2. Data Organization
   - Entries stored with metadata
   - Images stored in media directory
   - Automatic timestamps
   - Batch operations supported

### Sync Configuration

Configure sync settings in the Settings menu:

1. Enable/disable sync
2. Choose sync provider:
   - Dropbox
   - Google Drive
   - OneDrive
3. Set sync interval:
   - Hourly
   - Daily
   - Weekly
4. Configure auto-sync
5. View last sync status

### Plugin Management

Access plugin settings through Settings > Plugins:

1. Enable/disable plugins
2. Configure plugin settings
3. View plugin status
4. Import new plugins
5. Update existing plugins

### Error Handling

Common error situations and solutions:

1. Settings Issues
   - Check settings file permissions
   - Reset to defaults if needed
   - Verify environment variables

2. Database Issues
   - Use Copy DB for backup
   - Check file permissions
   - Verify data integrity

3. Sync Issues
   - Check internet connection
   - Verify provider settings
   - Review sync logs

### Performance Tips

1. Database Optimization
   - Regular backups
   - Archive old entries
   - Clean up unused media

2. Settings Optimization
   - Use appropriate sync intervals
   - Configure auto-save wisely
   - Manage plugin load

## Working with Entries

### Entry Types

- Notes: General text entries
- Documents: Long-form content
- Templates: Reusable structures
- HTML: Web content
- Records: Structured data
- Tasks: Action items
- Events: Calendar entries

### Editor Tips

- Use keyboard shortcuts for common actions
- Heading buttons skip empty lines
- Table grid shows live preview
- Size indicator helps with table creation
- Smooth transitions track cell selection

### Organization Tips

- Use the sidebar filters for quick access
- Sort columns to organize your view
- Use tags for categorization
- Hover for full content preview
- Archive old entries to maintain clarity

## Keyboard Shortcuts

### Global Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save current entry
- `Ctrl+F`: Focus search
- `Ctrl+,`: Open settings
- `Ctrl+\`: Toggle sidebar
- `Ctrl+B`: Toggle sidebar
- `Ctrl+R`: Refresh view
- `Ctrl+Alt+S`: Force sync
- `Esc`: Clear search/close modals

### Editor Shortcuts

- `Ctrl+B`: Bold
- `Ctrl+I`: Italic
- `Ctrl+U`: Underline
- `Ctrl+K`: Insert link
- `Ctrl+L`: Create list
- `Ctrl+1-3`: Heading levels
- `Tab/Shift+Tab`: Indent/outdent

## Troubleshooting

### Settings Issues

1. Check settings file integrity
   - Verify file exists
   - Check permissions
   - Validate JSON format

2. Environment Variables
   - Check variable format
   - Verify values
   - Confirm priorities

3. Reset to Defaults
   - Backup current settings
   - Use reset option
   - Reconfigure preferences

### Database Issues

1. Backup Procedures
   - Regular backups
   - Before major changes
   - After significant updates

2. File System
   - Check permissions
   - Verify storage space
   - Monitor file access

3. Data Integrity
   - Validate structures
   - Check relationships
   - Verify timestamps

### Sync Problems

1. Connection Issues
   - Internet connectivity
   - Provider status
   - Authentication

2. Configuration
   - Provider settings
   - Sync intervals
   - Permissions

3. Conflict Resolution
   - Review changes
   - Choose versions
   - Merge data

### Plugin Issues

1. Compatibility
   - Version check
   - Dependencies
   - System requirements

2. Performance
   - Resource usage
   - Load times
   - Memory impact

3. Updates
   - Version management
   - Change logs
   - Rollback options

### Configuration Recovery

1. Backup Usage
   - Restore settings
   - Apply selectively
   - Verify changes

2. Reset Process
   - Clean reset
   - Partial reset
   - Configuration rebuild

3. System Checks
   - Log review
   - Permissions
   - File integrity

## Data Management

### Entry Management

- Entries save automatically
- Use regular backups
- Organize with projects and tags
- Sort and filter effectively
- Search across all fields

### Batch Operations

1. Multiple Updates
   - Select entries
   - Choose action
   - Apply changes

2. Data Import/Export
   - File formats
   - Field mapping
   - Validation rules

3. Archive Management
   - Archive criteria
   - Storage options
   - Retrieval process

### Configuration Management

1. Settings Backup
   - Regular exports
   - Version control
   - Recovery points

2. Sync Settings
   - Provider setup
   - Schedule configuration
   - Conflict handling

3. Plugin Data
   - Storage location
   - Cleanup procedures
   - Backup inclusion

## Security Considerations

### Data Protection

1. Backups
   - Regular schedule
   - Secure storage
   - Encryption options

2. Access Control
   - File permissions
   - User settings
   - Plugin access

### Configuration Security

1. Settings Protection
   - File security
   - Environment variables
   - Access controls

2. Plugin Safety
   - Isolation
   - Resource limits
   - Update verification

## Advanced Features

### Environment Variables

1. Override Settings
   - Temporary changes
   - Testing configurations
   - Development use

2. Debug Options
   - Logging levels
   - Performance monitoring
   - Error tracking

### Batch Operations 2

1. Multi-Entry Updates
   - Selection criteria
   - Bulk actions
   - Validation rules

2. Configuration Changes
   - Mass updates
   - Rollback support
   - Audit logging

### Plugin Development

1. Integration
   - API access
   - Event handling
   - Resource management

2. Configuration
   - Settings structure
   - User options
   - Default values

### Custom Configurations

1. Environment Profiles
   - Development
   - Testing
   - Production

2. User Preferences
   - Personal settings
   - Override rules
   - Persistence options
   -
