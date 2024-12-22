#!/bin/bash

# Script to standardize parser test file names
# Ensures consistent naming convention with source files

# Exit on any error
set -e

# Change to the tests/parsers directory
cd tests/parsers

# Backup function
backup_files() {
    echo "Creating backup of test files..."
    mkdir -p backup
    cp *.test.js backup/
    cp *.tests.js backup/ 2>/dev/null || true
}

# Rename function with error handling
rename_file() {
    local old_name="$1"
    local new_name="$2"
    
    if [ -f "$old_name" ]; then
        echo "Renaming $old_name to $new_name"
        mv "$old_name" "$new_name"
    else
        echo "Warning: $old_name not found"
    fi
}

# Create backup
backup_files

# Remove -parser suffix and standardize extensions
echo "Standardizing test file names..."

# Handle the duplicate project test files
if [ -f "project.tests.js" ]; then
    echo "Removing duplicate project.tests.js"
    rm project.tests.js
fi

# Rename files to match source convention
rename_file "action-parser.test.js" "action.test.js"
rename_file "attendees-parser.test.js" "attendees.test.js"
rename_file "categories-parser.test.js" "categories.test.js"
rename_file "complexity-parser.test.js" "complexity.test.js"
rename_file "contact-parser.test.js" "contact.test.js"
rename_file "contexts-parser.test.js" "contexts.test.js"
rename_file "dependencies-parser.test.js" "dependencies.test.js"
rename_file "duration-parser.test.js" "duration.test.js"
rename_file "links-parser.test.js" "links.test.js"
rename_file "location-parser.test.js" "location.test.js"
rename_file "participants-parser.test.js" "participants.test.js"
rename_file "timeofday-parser.test.js" "timeOfDay.test.js"
rename_file "urgency-parser.test.js" "urgency.test.js"

echo "Renaming complete!"
echo "Backup of original files stored in tests/parsers/backup/"
echo "Please verify the changes and run your tests to ensure everything works correctly."
