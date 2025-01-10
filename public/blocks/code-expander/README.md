# Code Expander

The Code Expander is a component that enhances code blocks by adding syntax highlighting, copy functionality, and expandable views for long code snippets.

## Usage

The Code Expander automatically applies to all `<pre><code>` elements on the page. No additional markup is required.

## Authoring

When creating content in Google Docs or Microsoft Word, simply use code blocks as you normally would. The Code Expander will automatically enhance these blocks when the page is rendered.

## Styling

The Code Expander uses the following CSS classes:

- `.code-expander-wrapper`: The main wrapper for each code block.
- `.code-expander-copy`: The copy button.
- `.code-expander-expand-collapse`: The expand/collapse buttons for long code blocks.
- `.collapsible`: Applied to long code blocks that can be expanded/collapsed.
- `.expanded`: Applied to code blocks when they are expanded.

Language-specific syntax highlighting classes are also applied to individual code elements.

## Behavior

1. **Language Detection**: The component automatically detects the language of the code snippet and applies appropriate syntax highlighting. Supported languages include JavaScript, JSON, HTML, CSS, Markdown, and shell/terminal commands.

2. **Syntax Highlighting**: Each language has specific syntax highlighting rules applied to enhance readability.

3. **Copy Functionality**: Each code block has a "Copy to clipboard" button at the top right corner. The button text changes to "Copied!" briefly after clicking and then reverts to the original text.

4. **Expandable Long Code Blocks**: Code blocks with more than 40 lines are made collapsible. They have an "Expand" button at the top left and a "..." button at the bottom left to toggle the full view.

## Customization

The component uses CSS variables for easy customization of colors and sizes. These variables are defined in the `:root` selector and can be overridden as needed.

## Dependencies

This component has no external dependencies. It uses vanilla JavaScript and CSS.

## Accessibility

- The copy and expand/collapse buttons are keyboard accessible.
- ARIA attributes are used where appropriate to enhance screen reader compatibility.
- Focus styles are applied to buttons for better visibility during keyboard navigation.

## Browser Support

The Code Expander is designed to work in modern browsers that support ES6+ JavaScript and CSS3.

## Suggestions for Improvement

1. Add support for more programming languages.
2. Implement line numbering for code blocks.
3. Add an option to highlight specific lines of code.
4. Implement a theme switcher for different syntax highlighting color schemes.
5. Add a "View Raw" option to see the unformatted code.
6. Improve mobile responsiveness for better display on smaller screens.

## Known Issues

Currently, there are no known issues. If you encounter any problems, please report them to the development team.
