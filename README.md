# Personal Information Manager (PIM)

A modern desktop application for managing personal information, tasks, and notes with natural language processing capabilities.

## Features

- Natural language input processing
- Multiple view options (Table, Cards, Timeline)
- Priority system
- Category tagging
- Smart date parsing
- Filtering capabilities

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pim.git
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

## Usage

1. Click the "New Entry" button to create a new entry
2. Enter your note in natural language (e.g., "Call John next Wednesday about the project")
3. Select a priority level (optional)
4. Click "Save" to store your entry

The application will automatically:
- Parse dates and times
- Identify actions and contacts
- Suggest relevant categories
- Store the entry in the database

## Views

- **Table View**: Displays entries in a structured table format
- **Cards View**: Shows entries as cards for a more visual experience
- **Timeline View**: Organizes entries chronologically

## Filtering

Use the sidebar filters to filter entries by:
- Priority levels
- Date ranges
- Categories

## Development

This application is built with:
- Electron
- SQLite3
- Modern JavaScript (ES2022+)

## License

ISC
