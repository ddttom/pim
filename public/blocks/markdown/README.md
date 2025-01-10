# Markdown Block

This block processes and displays markdown content within a styled container.

## Usage

To use the Markdown block, create a table in your document with "Markdown" in the first cell. The content in the cells below will be processed as markdown and displayed in a light blue box with rounded corners and a 2px thick border.

| Markdown |
|----------|
| Your markdown content here |

## Authoring

When creating content for the Markdown block in Google Docs or Microsoft Word:

1. Create a table with at least two rows.
2. In the first cell of the first row, type "Markdown".
3. In the cells below, add your markdown content.
4. The block will automatically process and display the markdown content.

## Styling

The Markdown block uses CSS variables for easy customization:

- `--markdown-bg-color`: Background color of the container (default: light blue)
- `--markdown-border-color`: Border color of the container (default: blue)
- `--markdown-border-radius`: Border radius of the container (default: 8px)
- `--markdown-padding`: Padding inside the container (default: 20px)

## Behavior

The Markdown block:

1. Trims all lines in the content.
2. Converts the markdown to HTML.
3. Replaces images with optimized versions using the `createOptimizedPicture` function.
4. Displays the processed content in a styled container.

## Dependencies

This block depends on the `markdown-it` library for markdown processing and the `createOptimizedPicture` function from `aem.js` for image optimization.

## Accessibility

The Markdown block preserves the semantic structure of the markdown content, which helps maintain good accessibility. However, content authors should ensure that their markdown follows accessibility best practices, such as using proper heading levels and providing alt text for images.
