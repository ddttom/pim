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

PIM understands natural language input with the following features:

#### Action Recognition

- Basic actions: call, meet, email, review, write
- Variations: phone, sync, mail, check, draft
- Context-aware detection

#### Time Understanding

- Dates with common misspellings
- Time of day references
- Specific times (2pm, 15:30)
- Default times for different periods
- Relative dates (tomorrow, next week)

#### Location Detection

- "at [location]" format
- "in [location]" format
- "location: [place]" format
- Multi-word location support

#### Duration Parsing

- Hour-based durations
- Minute-based durations
- Formatted output (1h30m)
- Unit variations (hour, hr, minute, min)

#### Recurrence Patterns

- Daily ("every day")
- Weekly ("every week")
- Monthly ("every month")
- Weekday-specific ("every Monday")
- Interval support

#### Context Detection

Automatically categorizes into contexts:

- Work: meeting, project, deadline, client, report
- Personal: family, home, shopping, birthday, holiday
- Health: doctor, dentist, gym, workout, medicine
- Finance: bank, payment, invoice, budget, tax

#### Examples

```bash
# Basic Task with Time
Call John tomorrow at 2pm

# Location and Duration
Meet team in conference room for 2 hours

# Recurring Meeting
Team sync every Monday morning

# Context and Priority
Doctor appointment next week #health #urgent

# Project with Location
Project Alpha review at client office tomorrow
```

### 2. Rich Text Editor

#### Using the Editor

The application features a full rich text editor with markdown support:

- Text Formatting
  - Headers (H1-H3)
  - Bold, italic, underline, strike-through
  - Blockquotes and code blocks
  - Ordered and unordered lists

#### Working with Images

To add images to your entries:

1. Create or select an entry
2. Click the "Add Images" button
3. Select one or more images
4. Images will be:
   - Stored in the media directory
   - Added to the entry content
   - Displayed in the editor
   - Included in markdown export

#### Markdown Support

All entries are stored in markdown format:

```markdown
# Meeting Notes

Meeting with @john about **Project Alpha**

Key points:
- Review timeline
- Discuss budget
- Plan next steps

![Project Timeline](media/timeline.png)
```

#### Tips for Rich Text

1. **Images**
   - Use descriptive filenames
   - Keep images under 5MB
   - Supported formats: PNG, JPG, GIF

2. **Formatting**
   - Use headers for structure
   - Apply emphasis sparingly
   - Include links when relevant

3. **Organization**
   - Group related images
   - Use consistent formatting
   - Add captions to images

### 3. Entry Management

#### Creating Entries

1. Click "New Entry" button
2. Type your task using natural language
3. Format text and add images as needed
4. The system will automatically parse and categorize your entry
5. Review the parsed information
6. Click "Save" to store the entry

#### Editing Entries

1. Find the entry in the main view
2. Click the edit icon
3. Modify the entry text or individual fields
4. Update formatting or images
5. Click "Save" to update

#### Deleting Entries

Note: Deleting an entry will also remove its associated images.

1. Find the entry to delete
2. Click the delete icon
3. Confirm deletion

### 4. Status Management

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

### 5. Categories and Tags

Use hashtags (#) to categorize entries:

- #work
- #personal
- #urgent
- #meeting
- Custom categories as needed

### 6. Priority Management

Priorities can be set through:

- Natural language ("high priority", "urgent")
- Priority field in edit form

Available priorities:

- Urgent
- High
- Medium
- Low

### 7. Time Management

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

#### Exporting Content

1. **Markdown Export**

   ```bash
   # Export single entry
   File > Export > Markdown

   # Export multiple entries
   Select entries > Right-click > Export as Markdown
   ```

2. **HTML Export**

   ```bash
   # Export for web viewing
   File > Export > HTML

   # With images
   File > Export > HTML (with media)
   ```

3. **JSON Export**

   ```bash
   # Full data export
   File > Export > JSON

   # Selected entries
   Select entries > Right-click > Export as JSON
   ```

#### Importing Content

1. **Markdown Import**

   ```bash
   # Import markdown file
   File > Import > Markdown

   # With images
   File > Import > Markdown (with media)
   ```

2. **Bulk Import**

   ```bash
   # Import directory of markdown files
   File > Import > Directory

   # Import from backup
   File > Import > From Backup
   ```

#### Import/Export Options

1. **Media Handling**
   - Include images (copies to media directory)
   - Link to external images
   - Skip images

2. **Formatting**
   - Preserve formatting
   - Plain text only
   - Custom templates

3. **Metadata**
   - Include parsed data
   - Include timestamps
   - Include entry IDs

#### Supported Formats

1. **Input Formats**
   - Markdown (.md)
   - HTML (.html)
   - Text (.txt)
   - Rich Text (.rtf)
   - JSON (.json)

2. **Output Formats**
   - Markdown (.md)
   - HTML (.html)
   - PDF (.pdf)
   - JSON (.json)
   - Plain Text (.txt)

#### Import/Export Tips

1. **Best Practices**
   - Verify image paths before import
   - Use relative paths for portability
   - Include metadata when sharing
   - Test import on sample data first

2. **Common Issues**
   - Missing images
   - Broken links
   - Formatting inconsistencies
   - Character encoding problems

3. **Solutions**
   - Check file permissions
   - Verify media directory structure
   - Use UTF-8 encoding
   - Follow naming conventions

## Keyboard Shortcuts

- New Entry: Ctrl/Cmd + N
- Save: Ctrl/Cmd + S
- Delete: Delete key
- Settings: Ctrl/Cmd + ,
- Refresh: F5
- Search: Ctrl/Cmd + F

- ### Rich Text Editor Shortcuts

  - Bold: Ctrl/Cmd + B
  - Italic: Ctrl/Cmd + I
  - Underline: Ctrl/Cmd + U
  - Strikethrough: Ctrl/Cmd + Shift + S
  - Header 1: Ctrl/Cmd + 1
  - Header 2: Ctrl/Cmd + 2
  - Header 3: Ctrl/Cmd + 3
  - Bullet List: Ctrl/Cmd + Shift + 8
  - Numbered List: Ctrl/Cmd + Shift + 7
  - Code Block: Ctrl/Cmd + Shift + C
  - Quote Block: Ctrl/Cmd + Shift + Q
  - Clear Formatting: Ctrl/Cmd + \\

- ### Image Shortcuts

  - Insert Image: Ctrl/Cmd + Shift + I
  - Copy Image: Ctrl/Cmd + C (with image selected)
  - Paste Image: Ctrl/Cmd + V
  - Delete Image: Delete/Backspace (with image selected)

## Security and Privacy

- Local data storage (JSON file)
- No cloud sync by default
- Regular backup recommendations
- Images stored in local media directory
- Automatic image cleanup on entry deletion

## Data Structure

Your data is stored in a JSON file with the following structure:

```javascript
{
  "id": "unique-identifier",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "content": {
    "raw": "your input text",
    "markdown": "# Your formatted text\n\nWith *styling*",
    "images": ["media/image1.png"]
  },
  "parsed": {
    "action": "type of action",
    "contact": "person name",
    "project": {
      "project": "project name"
    },
    "final_deadline": "date/time",
    "status": "current status",
    "categories": ["list", "of", "categories"],
    "images": [
      {
        "id": "image-uuid",
        "filename": "image1.png",
        "path": "media/image1.png",
        "added_at": "timestamp"
      }
    ],
    "links": []
  },
  "plugins": {}
}
```

This structure preserves all parsed information exactly as interpreted by the system.

### Rich Text Formatting Examples

#### Common Use Cases

#### Meeting Notes

```markdown
# Team Meeting - Project Alpha

Date: 2024-01-15
Participants: @john, @sarah, @mike

## Agenda
1. Project Timeline Review
2. Budget Discussion
3. Next Steps

### Key Decisions
- Timeline extended by 2 weeks
- Budget increased by 10%
- New team member joining in February

### Action Items
- [ ] @john: Update project plan
- [ ] @sarah: Revise budget docs
- [ ] @mike: Prepare onboarding

![Updated Timeline](media/timeline-v2.png)
*Project timeline with new milestones*
```

#### Task List

```markdown
# Weekly Tasks

## High Priority
- [x] Submit Q4 report
- [ ] Review team performance
- [ ] Update client presentation

## In Progress
- [ ] Research new tools
- [ ] Document API changes

## Upcoming
- [ ] Team training session
- [ ] Client demo preparation

![Q4 Stats](media/q4-stats.png)
*Q4 Performance Overview*
```

#### Project Documentation

```markdown
# Project Documentation

## System Architecture
![Architecture Diagram](media/architecture.png)

## API Endpoints
```json
{
  "endpoint": "/api/v1/users",
  "method": "GET",
  "response": { ... }
}
```

## Database Schema
>
> Note: Updated as of January 2024

![DB Schema](media/db-schema.png)
*Current database structure*

### Image Management Tips

1. **Organization**
   - Use descriptive filenames (e.g., "q1-2024-timeline.png")
   - Group related images together in content
   - Add captions for context

2. **Best Practices**
   - Compress large images before upload
   - Use appropriate format (PNG for diagrams, JPG for photos)
   - Keep backup copies of important images

3. **Troubleshooting**
   - If images don't load, check file permissions
   - Verify media directory exists
   - Check image paths in markdown

## Import/Export 2

### Exporting Content 2

1. **Markdown Export**

   ```bash
   # Export single entry
   File > Export > Markdown

   # Export multiple entries
   Select entries > Right-click > Export as Markdown
   ```

2. **HTML Export**

   ```bash
   # Export for web viewing
   File > Export > HTML

   # With images
   File > Export > HTML (with media)
   ```

3. **JSON Export**

   ```bash
   # Full data export
   File > Export > JSON

   # Selected entries
   Select entries > Right-click > Export as JSON
   ```

#### Importing Content 2

1. **Markdown Import**

   ```bash
   # Import markdown file
   File > Import > Markdown

   # With images
   File > Import > Markdown (with media)
   ```

2. **Bulk Import**

   ```bash
   # Import directory of markdown files
   File > Import > Directory

   # Import from backup
   File > Import > From Backup
   ```

#### Import/Export Options 3

1. **Media Handling**
   - Include images (copies to media directory)
   - Link to external images
   - Skip images

2. **Formatting**
   - Preserve formatting
   - Plain text only
   - Custom templates

3. **Metadata**
   - Include parsed data
   - Include timestamps
   - Include entry IDs

#### Supported Formats 2

1. **Input Formats**
   - Markdown (.md)
   - HTML (.html)
   - Text (.txt)
   - Rich Text (.rtf)
   - JSON (.json)

2. **Output Formats**
   - Markdown (.md)
   - HTML (.html)
   - PDF (.pdf)
   - JSON (.json)
   - Plain Text (.txt)

#### Import/Export Tips 2

1. **Best Practices**
   - Verify image paths before import
   - Use relative paths for portability
   - Include metadata when sharing
   - Test import on sample data first

2. **Common Issues**
   - Missing images
   - Broken links
   - Formatting inconsistencies
   - Character encoding problems

3. **Solutions**
   - Check file permissions
   - Verify media directory structure
   - Use UTF-8 encoding
   - Follow naming conventions

## Command Line Usage

1. **Export Commands**

   ```bash
   # Export single entry
   pim export entry <entry-id> --format markdown
   
   # Export multiple entries
   pim export entries --ids <id1,id2> --format markdown
   
   # Export all entries
   pim export all --format json --with-media
   
   # Export by date range
   pim export range --from "2024-01-01" --to "2024-01-31"
   
   # Export by category
   pim export category work --format markdown
   ```

2. **Import Commands**

   ```bash
   # Import single file
   pim import file path/to/file.md
   
   # Import directory
   pim import dir path/to/directory --recursive
   
   # Import from backup
   pim import backup path/to/backup.json
   
   # Import with specific options
   pim import file input.md \
     --media-dir path/to/media \
     --format markdown \
     --parse-metadata \
     --preserve-ids
   ```

3. **Batch Operations**

   ```bash
   # Export filtered entries
   pim export filter \
     --status pending \
     --priority high \
     --category work \
     --format markdown
   
   # Import multiple files
   pim import batch \
     --files "file1.md,file2.md" \
     --format markdown \
     --merge-strategy replace
   
   # Export with templates
   pim export template \
     --template meeting-notes \
     --ids <id1,id2> \
     --format html
   ```

4. **Advanced Options**

   ```bash
   # Custom export formatting
   pim export custom \
     --template path/to/template.hbs \
     --data path/to/data.json \
     --format html
   
   # Import with transformations
   pim import transform \
     --input file.md \
     --rules path/to/rules.json \
     --validate
   ```

## Custom Templates

### Template System

PIM uses Handlebars for template processing. Templates can be created for:

- Single entries
- Lists of entries
- Reports and summaries
- Custom exports

### Template Location

Templates are stored in `~/.config/pim/templates/` (Linux/macOS) or `%APPDATA%\pim\templates\` (Windows).

### Template Structure

1. **Single Entry Template**

   ```handlebars
   {{!-- entry-template.hbs --}}
   # {{content.raw}}

   Created: {{formatDate created_at}}
   Status: {{parsed.status}}
   Priority: {{parsed.priority}}

   ## Details
   {{#if parsed.project}}
   Project: {{parsed.project.project}}
   {{/if}}

   {{#if parsed.participants}}
   ### Participants
   {{#each parsed.participants}}
   - {{this}}
   {{/each}}
   {{/if}}

   {{#if content.images}}
   ### Attachments
   {{#each content.images}}
   ![Image {{@index}}]({{this}})
   {{/each}}
   {{/if}}
   ```

2. **List Template**

   ```handlebars
   {{!-- list-template.hbs --}}
   # Entries List

   Generated: {{now}}

   {{#each entries}}
   ## {{content.raw}}
   - Status: {{parsed.status}}
   - Due: {{formatDate parsed.final_deadline}}
   {{#if parsed.links}}
   - Links: {{#each parsed.links}}[Link]({{this}}) {{/each}}
   {{/if}}

   {{/each}}
   ```

3. **Report Template**

   ```handlebars
   {{!-- report-template.hbs --}}
   # Project Status Report

   Period: {{period.start}} to {{period.end}}

   ## Summary
   - Total Entries: {{stats.total}}
   - Completed: {{stats.completed}}
   - Pending: {{stats.pending}}

   ## High Priority Items
   {{#each highPriority}}
   - {{content.raw}} (Due: {{formatDate parsed.final_deadline}})
   {{/each}}

   ## Recent Updates
   {{#each recentUpdates}}
   ### {{formatDate updated_at}}
   {{content.raw}}
   {{/each}}
   ```

### Template Helpers

1. **Date Formatting**

   ```handlebars
   {{formatDate date "YYYY-MM-DD"}}
   {{relativeDate date}}
   {{timeAgo date}}
   ```

2. **Text Processing**

   ```handlebars
   {{markdown content}}
   {{truncate text 100}}
   {{sanitize html}}
   ```

3. **Conditional Helpers**

   ```handlebars
   {{#if (isPending status)}}
   {{#if (isOverdue date)}}
   {{#if (hasImages entry)}}
   ```

### Using Templates

1. **Command Line**

   ```bash
   # Use specific template
   pim export template \
     --template entry-template \
     --id <entry-id> \
     --format html

   # Generate report
   pim report generate \
     --template report-template \
     --from "2024-01-01" \
     --to "2024-01-31"
   ```

2. **GUI**
   - File > Export > With Template
   - Select template from dropdown
   - Choose output format
   - Select entries to export

### Template Variables

1. **Entry Variables**

   ```handlebars
   {{id}}                    // Entry UUID
   {{created_at}}            // Creation timestamp
   {{updated_at}}            // Last update timestamp
   {{content.raw}}           // Raw text content
   {{content.markdown}}      // Markdown content
   {{content.images}}        // Array of image paths
   
   {{parsed.action}}         // Parsed action type
   {{parsed.contact}}        // Primary contact
   {{parsed.project.project}}// Project name
   {{parsed.final_deadline}} // Due date
   {{parsed.participants}}   // Array of participants
   {{parsed.tags}}          // Array of tags
   {{parsed.priority}}      // Priority level
   {{parsed.status}}        // Current status
   {{parsed.location}}      // Location object
   {{parsed.duration}}      // Duration object
   {{parsed.recurrence}}    // Recurrence pattern
   {{parsed.contexts}}      // Array of contexts
   {{parsed.categories}}    // Array of categories
   {{parsed.images}}        // Array of image metadata
   {{parsed.links}}         // Array of links
   ```

2. **Collection Variables**

   ```handlebars
   {{entries}}              // Array of entries
   {{stats}}               // Statistics object
   {{period}}              // Time period object
   {{filters}}             // Applied filters
   {{metadata}}            // Export metadata
   ```

### Additional Template Examples

1. **Weekly Report Template**

   ```handlebars
   {{!-- weekly-report.hbs --}}
   # Weekly Status Report
   Week: {{formatDate period.start "MMM D"}} - {{formatDate period.end "MMM D, YYYY"}}

   ## Overview
   {{> stats-summary}}

   ## By Project
   {{#groupBy entries "parsed.project.project"}}
   ### {{@key}}
   {{#each this}}
   - {{content.raw}} ({{parsed.status}})
   {{/each}}
   {{/groupBy}}

   ## By Priority
   {{#each (groupByPriority entries)}}
   ### {{@key}} Priority
   {{#each this}}
   - {{content.raw}}
   {{/each}}
   {{/each}}
   ```

2. **Calendar Template**

   ```handlebars
   {{!-- calendar.hbs --}}
   # Schedule: {{formatDate period.start "MMMM YYYY"}}

   {{#each (calendarDays period.start period.end)}}
   ## {{formatDate this "dddd, MMM D"}}
   {{#with (entriesForDate ../entries this)}}
   {{#if this}}
   {{#each this}}
   - {{formatTime parsed.final_deadline}} {{content.raw}}
   {{/each}}
   {{else}}
   *No entries*
   {{/if}}
   {{/with}}
   {{/each}}
   ```

3. **Project Dashboard**

   ```handlebars
   {{!-- project-dashboard.hbs --}}
   # {{project.name}} Dashboard

   ## Quick Stats
   - Tasks: {{stats.total}}
   - Progress: {{progressBar stats.completed stats.total}}
   - Next Deadline: {{formatDate nextDeadline}}

   ## Team Activity
   {{#each teamMembers}}
   ### {{name}}
   {{#with (memberTasks ../entries this)}}
   - Assigned: {{total}}
   - Completed: {{completed}}
   {{/with}}
   {{/each}}

   ## Recent Images
   {{#each (recentImages entries 5)}}
   ![{{filename}}]({{path}})
   *Added {{timeAgo added_at}}*
   {{/each}}
   ```

### Troubleshooting Templates

1. **Common Issues**
   - Template not found
   - Invalid helper calls
   - Missing required variables
   - Formatting errors
   - Image path issues

2. **Debugging Tips**

   ```handlebars
   {{!-- Debug output --}}
   {{log "Debug:" variable}}
   {{inspect entry}}
   
   {{!-- Error handling --}}
   {{#if variable}}
     {{variable}}
   {{else}}
     Variable not available
   {{/if}}
   ```

3. **Best Practices**
   - Use partials for reusable components
   - Include error handling
   - Add debug statements
   - Test with sample data
   - Validate output format

### Custom Helpers

1. **Creating Custom Helpers**

   ```javascript
   // helpers/custom.js
   module.exports = {
     // Simple value helper
     formatPriority: (priority) => {
       return priority.toUpperCase();
     },
 
     // Block helper
     withLatestEntries: function(entries, count, options) {
       const sorted = entries
         .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
         .slice(0, count);
       return options.fn(sorted);
     },
 
     // Async helper
     async getRelatedEntries: function(entryId, options) {
       const related = await db.findRelated(entryId);
       return options.fn(related);
     }
   };
   ```

2. **Using Custom Helpers**

   ```handlebars
   {{!-- Using value helper --}}
   Priority: {{formatPriority parsed.priority}}
 
   {{!-- Using block helper --}}
   {{#withLatestEntries entries 5}}
     {{#each this}}
       - {{content.raw}}
     {{/each}}
   {{/withLatestEntries}}
 
   {{!-- Using async helper --}}
   {{#getRelatedEntries id}}
     {{#each this}}
       - Related: {{content.raw}}
     {{/each}}
   {{/getRelatedEntries}}
   ```

### Template Performance

1. **Optimization Techniques**
   - Use partial caching
   - Minimize helper calls
   - Batch database queries
   - Implement pagination
   - Lazy load images

2. **Caching Example**

   ```javascript
   // Template cache
   const cache = new Map();
 
   function getCachedTemplate(name) {
     if (!cache.has(name)) {
       const template = loadTemplate(name);
       cache.set(name, template);
     }
     return cache.get(name);
   }
 
   // Partial caching
   Handlebars.registerPartial('cached-stats', getCachedTemplate('stats'));
   ```

3. **Performance Helpers**

   ```handlebars
   {{!-- Lazy load images --}}
   {{#each images}}
     <img src="placeholder.png" 
          data-src="{{this}}" 
          class="lazy-load">
   {{/each}}
 
   {{!-- Paginated content --}}
   {{#paginate entries page=1 limit=10}}
     {{#each this}}
       {{content.raw}}
     {{/each}}
   {{/paginate}}
   ```

4. **Best Practices for Performance**
   - Pre-compile templates
   - Use incremental rendering
   - Implement virtual scrolling
   - Optimize image loading
   - Cache expensive operations

### Template Testing

1. **Unit Testing Templates**

   ```javascript
   // test/templates/entry.test.js
   const { expect } = require('chai');
   const Handlebars = require('handlebars');
   
   describe('Entry Template', () => {
     let template;
     
     beforeEach(() => {
       template = Handlebars.compile(
         await fs.readFile('templates/entry.hbs', 'utf8')
       );
     });
     
     test('renders basic entry', () => {
       const entry = {
         content: { raw: 'Test Entry' },
         parsed: { status: 'pending' }
       };
       
       const result = template(entry);
       expect(result).to.include('Test Entry');
       expect(result).to.include('pending');
     });
     
     test('handles missing data', () => {
       const result = template({});
       expect(result).to.not.include('undefined');
       expect(result).to.include('No content');
     });
   });
   ```

2. **Integration Testing**

   ```javascript
   // test/templates/integration.test.js
   describe('Template Integration', () => {
     test('processes complex data structure', async () => {
       const data = await loadTestData();
       const result = await processTemplate('report', data);
       
       expect(result).to.include('Project Stats');
       expect(result).to.match(/\d+ completed/);
     });
     
     test('handles async helpers', async () => {
       const result = await processTemplate('dashboard', {
         id: 'test-123'
       });
       
       expect(result).to.include('Related Entries');
     });
   });
   ```

### Template Security

1. **Input Validation**

   ```javascript
   // Sanitize input data
   const sanitizeInput = (data) => {
     return {
       ...data,
       content: {
         raw: sanitizeHtml(data.content.raw),
         markdown: sanitizeMarkdown(data.content.markdown)
       }
     };
   };
   
   // Use in template
   const safeTemplate = (template, data) => {
     return template(sanitizeInput(data));
   };
   ```

2. **Path Traversal Prevention**

   ```javascript
   // Secure template loading
   const loadTemplate = (name) => {
     const safeName = path.basename(name);
     const templatePath = path.join(TEMPLATE_DIR, safeName);
     
     if (!templatePath.startsWith(TEMPLATE_DIR)) {
       throw new Error('Invalid template path');
     }
     
     return fs.readFile(templatePath, 'utf8');
   };
   ```

3. **Helper Security**

   ```javascript
   // Secure helper registration
   const registerSecureHelper = (name, fn) => {
     Handlebars.registerHelper(name, (...args) => {
       try {
         return fn(...args.map(sanitizeInput));
       } catch (error) {
         logger.error(`Helper ${name} failed:`, error);
         return '';
       }
     });
   };
   ```

4. **Security Best Practices**
   - Validate all input data
   - Sanitize HTML output
   - Prevent template injection
   - Use content security policy
   - Validate image sources
   - Secure file paths
   - Log security events
   - Regular security audits

### Template Versioning

1. **Version Control**

   ```javascript
   // Template metadata
   {
     "name": "entry-template",
     "version": "1.2.0",
     "compatibility": ">=1.0.0",
     "author": "Tom Cranstoun",
     "lastModified": "2024-01-15"
   }
   ```

2. **Version Management**

   ```javascript
   // Template loader with version check
   const loadVersionedTemplate = async (name, version) => {
     const template = await loadTemplate(name);
     if (semver.lt(template.version, version)) {
       throw new Error(`Template ${name} requires version ${version}`);
     }
     return template;
   };
   ```

3. **Migration Support**

   ```javascript
   // Template migration
   const migrations = {
     '1.0.0': (template) => {
       // Update old format to new
       return template.replace(/\{\{content\}\}/g, '{{content.raw}}');
     },
     '1.1.0': (template) => {
       // Add image support
       return template.replace(
         '{{/header}}',
         '{{/header}}\n{{> image-gallery}}'
       );
     }
   };
   ```

### Deployment Strategies

1. **Development Workflow**

   ```bash
   # Template development cycle
   npm run templates:dev     # Start template dev server
   npm run templates:test    # Run template tests
   npm run templates:build   # Build production templates
   npm run templates:deploy  # Deploy to production
   ```

2. **Environment Configuration**

   ```javascript
   // Template environment config
   const config = {
     development: {
       cache: false,
       debug: true,
       watchFiles: true,
       reloadOnChange: true
     },
     production: {
       cache: true,
       debug: false,
       minify: true,
       precompile: true
     }
   };
   ```

3. **Deployment Checks**

   ```javascript
   // Pre-deployment validation
   const validateDeployment = async () => {
     await Promise.all([
       validateTemplates(),
       checkDependencies(),
       runSecurityAudit(),
       testPerformance()
     ]);
   };
   ```

4. **Rollback Support**

   ```javascript
   // Template rollback
   const rollbackTemplate = async (name, version) => {
     const backup = await loadBackup(name, version);
     await saveTemplate(name, backup);
     await invalidateCache(name);
     await notifyUsers(`Template ${name} rolled back to ${version}`);
   };
   ```

5. **Monitoring**

   ```javascript
   // Template usage metrics
   const metrics = {
     trackRendering: (template, duration) => {
       logger.info('Template rendered', {
         name: template.name,
         version: template.version,
         duration,
         timestamp: new Date()
       });
     },
     
     trackErrors: (template, error) => {
       logger.error('Template error', {
         name: template.name,
         version: template.version,
         error: error.message,
         stack: error.stack
       });
     }
   };
   ```

### CI/CD Pipeline

1. **GitHub Actions Workflow**

   ```yaml
   # .github/workflows/templates.yml
   name: Template CI/CD
   
   on:
     push:
       paths:
         - 'templates/**'
         - 'src/renderer/**'
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run templates:lint
         - run: npm run templates:test
         - run: npm run templates:security
   
     build:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm run templates:build
         - uses: actions/upload-artifact@v3
           with:
             name: templates
             path: dist/templates
   
     deploy:
       needs: build
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main'
       steps:
         - uses: actions/download-artifact@v3
         - run: npm run templates:deploy
   ```

2. **Template Distribution**

   ```javascript
   // Template package structure
   {
     "name": "pim-templates",
     "version": "1.2.0",
     "templates": {
       "entry": {
         "source": "src/entry.hbs",
         "precompiled": "dist/entry.js",
         "styles": "styles/entry.css",
         "partials": ["header", "footer"],
         "helpers": ["formatters", "validators"]
       }
     },
     "dependencies": {
       "handlebars": "^4.7.0",
       "marked": "^5.1.1"
     }
   }
   ```

3. **Auto-Update System**

   ```javascript
   // Template update checker
   const checkForUpdates = async () => {
     const current = await getInstalledVersion();
     const latest = await fetchLatestVersion();
     
     if (semver.gt(latest, current)) {
       await promptUpdate();
     }
   };
   
   // Update installation
   const installUpdate = async (version) => {
     await backupCurrentTemplates();
     await downloadTemplates(version);
     await validateInstallation();
     await migrateCustomizations();
   };
   ```

4. **Distribution Channels**

   ```javascript
   // Template registry configuration
   const registry = {
     stable: {
       url: 'https://registry.pim.dev/templates',
       updateFrequency: '1d',
       validation: true
     },
     beta: {
       url: 'https://beta.pim.dev/templates',
       updateFrequency: '1h',
       validation: false
     }
   };
   
   // Template installation
   const installTemplate = async (name, options = {}) => {
     const { channel = 'stable', version = 'latest' } = options;
     
     await validateCompatibility(name, version);
     await downloadTemplate(name, version, channel);
     await installDependencies();
     await runPostInstall();
   };
   ```

### Templates

#### When Templates are Used

1. **Entry Display**
   - Rendering entries in the main view
   - Formatting entry details
   - Displaying rich text content

2. **Export Operations**

   ```bash
   # Export as markdown
   File > Export > Markdown

   # Export as HTML
   File > Export > HTML

   # Generate PDF report
   File > Export > PDF
   ```

3. **Report Generation**
   - Weekly/Monthly summaries
   - Project status reports
   - Activity logs

4. **Search Results**

   ```javascript
   // src/renderer/renderer.js
   const displaySearchResults = async (results) => {
     const template = await loadTemplate('search/results');
     searchContainer.innerHTML = template({
       results,
       query: currentQuery,
       total: results.length
     });
   };
   ```

#### Template Customization

1. **Location**
   Templates are stored in:
   - Linux/macOS: `~/.config/pim/templates/`
   - Windows: `%APPDATA%\pim\templates\`

2. **Available Templates**

   ```bash
   templates/
   ├── entry/
   │   ├── default.hbs
   │   ├── compact.hbs
   │   └── list.hbs
   ├── export/
   │   ├── markdown.hbs
   │   ├── html.hbs
   │   └── json.hbs
   └── reports/
       ├── weekly.hbs
       ├── monthly.hbs
       └── summary.hbs
   └── search/
       └── results.hbs
   ```

3. **Customizing Templates**
   - Copy default template
   - Modify as needed
   - Save with new name
   - Select in preferences

#### Template Variables

1. **Entry Variables**

   ```handlebars
   {{!-- Available in entry templates --}}
   {{content.raw}}           {{!-- Raw text content --}}
   {{content.markdown}}      {{!-- Markdown formatted content --}}
   {{content.images}}        {{!-- Array of image paths --}}
   
   {{parsed.action}}         {{!-- Detected action --}}
   {{parsed.contact}}        {{!-- Primary contact --}}
   {{parsed.final_deadline}} {{!-- Due date --}}
   {{parsed.participants}}   {{!-- Array of participants --}}
   {{parsed.tags}}          {{!-- Array of #tags --}}
   {{parsed.priority}}      {{!-- Priority level --}}
   {{parsed.status}}        {{!-- Current status --}}
   {{parsed.location}}      {{!-- Location object --}}
   {{parsed.duration}}      {{!-- Duration object --}}
   ```

2. **Helper Functions**

   ```handlebars
   {{!-- Date formatting --}}
   {{formatDate parsed.final_deadline}}
   {{relativeDate parsed.final_deadline}}

   {{!-- Duration formatting --}}
   {{formatDuration parsed.duration}}

   {{!-- List handling --}}
   {{#each parsed.participants}}
     @{{this}}
   {{/each}}

   {{!-- Conditional rendering --}}
   {{#if parsed.priority}}
     Priority: {{parsed.priority}}
   {{/if}}
   ```

3. **Example Template**

   ```handlebars
   {{!-- templates/entry/default.hbs --}}
   <div class="entry {{parsed.priority}}">
     <h3>{{content.raw}}</h3>
     
     {{#if parsed.final_deadline}}
       <div class="deadline">
         Due: {{formatDate parsed.final_deadline}}
       </div>
     {{/if}}
     
     {{#if parsed.participants.length}}
       <div class="participants">
         With: {{#each parsed.participants}}@{{this}} {{/each}}
       </div>
     {{/if}}
     
     {{#if parsed.location}}
       <div class="location">
         At: {{parsed.location.value}}
       </div>
     {{/if}}
     
     {{#if content.images.length}}
       <div class="images">
         {{#each content.images}}
           <img src="{{this}}" alt="Attachment {{@index}}">
         {{/each}}
       </div>
     {{/if}}
   </div>
   ```

- #### Template Loading System

-

- 1. **Template Loading**

- ```javascript

- // src/services/template-loader.js
- const loadTemplate = async (name) => {
-      // Check cache first
-      if (templateCache.has(name)) {
-        return templateCache.get(name);
-      }
-
-      // Load template file
-      const templatePath = path.join(TEMPLATE_DIR, `${name}.hbs`);
-      const source = await fs.readFile(templatePath, 'utf8');
-
-      // Compile and cache
-      const template = Handlebars.compile(source);
-      templateCache.set(name, template);
-
-      return template;
- };

- ```
-
- 2. **Helper Registration**

- ```javascript
- // src/services/template-helpers.js
- Handlebars.registerHelper('formatDate', (date) => {
-      if (!date) return '';
-      return new Date(date).toLocaleDateString();
- });
-
- Handlebars.registerHelper('formatDuration', (duration) => {
-      if (!duration?.minutes) return '';
-      const hours = Math.floor(duration.minutes / 60);
-      const mins = duration.minutes % 60;
-      return `${hours}h${mins}m`;
- });

- ```
-
- 3. **Partial Registration**

- ```javascript
- // src/services/template-manager.js
- const registerPartials = async () => {
-      const partialsDir = path.join(TEMPLATE_DIR, 'partials');
-      const files = await fs.readdir(partialsDir);
-
-      for (const file of files) {
-        const name = path.basename(file, '.hbs');
-        const content = await fs.readFile(
-          path.join(partialsDir, file),
-          'utf8'
-        );
-        Handlebars.registerPartial(name, content);
-      }
- };

- ```
-
- 4. **Error Handling**

- ```javascript
- // src/services/template-loader.js
- const safeRender = async (name, data) => {
-      try {
-        const template = await loadTemplate(name);
-        return template(data);
-      } catch (error) {
-        logger.error(`Template render error: ${error.message}`);
-        return loadTemplate('error').then(t => t({
-          error: error.message,
-          template: name
-        }));
-      }
- };

- ```
-
- 5. **Template Validation**

- ```javascript
- // src/services/template-validator.js
- const validateTemplate = (source) => {
-      try {
-        // Check syntax
-        Handlebars.precompile(source);
-
-        // Check required variables
-        const ast = Handlebars.parse(source);
-        const vars = extractVariables(ast);
-
-        // Validate against schema
-        return validateVariables(vars);
-      } catch (error) {
-        throw new Error(`Invalid template: ${error.message}`);
-      }
- };

- ```

- #### Template Caching and Performance

-

- 1. **Cache Configuration**

- ```javascript
- // src/services/template-cache.js
- const templateCache = new Map();
-
- const cacheConfig = {
-      maxSize: 100,           // Maximum templates in cache
-      ttl: 1000 * 60 * 60,   // Cache TTL: 1 hour
-      preload: [             // Templates to preload
-        'entry/default',
-        'entry/list',
-        'search/results'
-      ]
- };

- ```
-
- 2. **Cache Management**

- ```javascript
- const cacheManager = {
-      async preloadTemplates() {
-        for (const name of cacheConfig.preload) {
-          await loadTemplate(name);
-        }
-      },
-
-      clearCache() {
-        templateCache.clear();
-        logger.info('Template cache cleared');
-      },
-
-      invalidateTemplate(name) {
-        templateCache.delete(name);
-        logger.debug(`Template cache invalidated: ${name}`);
-      }
- };

- ```
-

- #### Template Debugging

-

- 1. **Debug Mode**

- ```javascript
- // Enable template debugging
- const debugTemplate = async (name, data) => {
-      const template = await loadTemplate(name);
-      console.log('Template:', name);
-      console.log('Variables:', Object.keys(data));
-      console.log('Helpers:', Handlebars.helpers);
-      return template(data);
- };

- ```
-
- 2. **Common Issues**
- - Template not found
-      - Check template path
-      - Verify file extension
-      - Check file permissions
-
- - Variable undefined
-      - Use {{log this}} to inspect data
-      - Check variable paths
-      - Add default values
-
- - Helper errors
-      - Verify helper registration
-      - Check parameter types
-      - Handle null values
-
- 3. **Development Tools**

- ```handlebars
- {{!-- Debug output in template --}}
- {{log "Debug point 1"}}
- {{log this}}
- {{log "Participants:" parsed.participants}}
-
- {{!-- Inspect specific values --}}
- {{#if debug}}
-      <pre class="debug">
-        {{inspect this}}
-      </pre>
- {{/if}}

- ```
-
- 4. **Performance Monitoring**

- ```javascript
- // Template render timing
- const measureRender = async (name, data) => {
-      const start = performance.now();
-      const result = await loadTemplate(name)(data);
-      const duration = performance.now() - start;
-
-      logger.debug(`Template render: ${name} (${duration.toFixed(2)}ms)`);
-      return result;
- };

- ```
