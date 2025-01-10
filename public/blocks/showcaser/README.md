# Showcaser

The Showcaser block displays a visually appealing showcase for code snippets in a book-like format, with the ability to copy code to the clipboard, expand/collapse long code snippets, and a "Return to Menu" button for easy navigation back to the top of the Showcaser.

## Usage

To use the Showcaser block, add the following markdown table to your Franklin document:

| Showcaser |
|-----------|

The block automatically collects all code snippets from the current page and displays them in the showcase.

## Behavior

- Collects all code snippets from the current page
- Creates a book-like interface with a collapsible left sidebar containing clickable titles
- Clicking a title displays the corresponding code snippet on the right page
- The first snippet is displayed by default
- For code snippets longer than 40 lines:
  - An "Expand" button appears at the top of the snippet
  - A "..." button appears at the bottom of the snippet
  - Clicking either button toggles between expanded and collapsed views
- Copy to clipboard button for each code snippet
- Syntax highlighting based on detected language
- Responsive layout adjusts for mobile devices
- "Return to Menu" button appears when scrolling down and, when clicked, smoothly scrolls the page back to the top of the Showcaser block
- Toggle button in the top-left corner to collapse/expand the left sidebar

## Accessibility

- Uses semantic HTML structure for better screen reader compatibility
- Clickable titles have appropriate cursor styles and hover effects
- Maintains color contrast ratios for readability
- "Return to Menu" button provides an easy way for users to navigate back to the top of the Showcaser, improving usability for all users
- Expand/collapse buttons for long code snippets improve readability and navigation
- Focus styles for interactive elements to aid keyboard navigation

## Language Detection

The Showcaser automatically detects the following languages:

- JavaScript
- CSS
- HTML
- Markdown
- Shell/Terminal commands
- JSON
- Plain text

The language detection helps in applying appropriate syntax highlighting and labeling the copy button correctly.

## Performance Considerations

- The block uses lazy initialization, only becoming fully visible when loaded
- Long code snippets are initially collapsed to improve page load times and readability
- Syntax highlighting is performed client-side to reduce server load
- The collapsible left sidebar improves usability on smaller screens

## Browser Compatibility

The Showcaser block is designed to work on modern browsers, including:

- Chrome (latest versions)
- Firefox (latest versions)
- Safari (latest versions)
- Edge (latest versions)

For older browsers, some features may have limited functionality, but the core content display should remain accessible.- Syntax highlighting based on detected language
- Responsive layout adjusts for mobile devices
- "Return to Menu" button appears when scrolling down and, when clicked, smoothly scrolls the page back to the top of the Showcaser block

## Accessibility

- Uses semantic HTML structure for better screen reader compatibility
- Clickable titles have appropriate cursor styles and hover effects
- Maintains color contrast ratios for readability
- "Return to Menu" button provides an easy way for users to navigate back to the top of the Showcaser, improving usability for all users
- Expand/collapse buttons for long code snippets improve readability and navigation
- Focus styles for interactive elements to aid keyboard navigation


## Language Detection

The Showcaser automatically detects the following languages:

- JavaScript
- CSS
- HTML
- Markdown
- Shell/Terminal commands
- JSON
- Plain text

The language detection helps in applying appropriate syntax highlighting and labeling the copy button correctly.

## Performance Considerations

- The block uses lazy initialization, only becoming fully visible when loaded
- Long code snippets are initially collapsed to improve page load times and readability
- Syntax highlighting is performed client-side to reduce server load
