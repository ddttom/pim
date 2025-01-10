# Inline SVG

This block allows for the embedding of SVG content directly into the page, ensuring it scales properly and respects content margins.

## Usage

Place the SVG markup directly in the block content in your document.

## Authoring

In your Google Docs or Microsoft Word document, create a two-column table with "inline-svg" in the first column and the SVG markup in the second column.

| inline-svg |
|------------|
| `<svg>...</svg>` |

## Styling

The block uses the following CSS classes:

- `.inline-svg`: Applies to the main container of the SVG.
- `.inline-svg svg`: Applies to the SVG element itself.

You can customize the appearance by modifying these classes in the `inline-svg.css` file.

## Behavior

The JavaScript in `inline-svg.js` does the following:

1. Extracts the SVG content from the block.
2. Clears the original text content.
3. Creates a new SVG element with the extracted content.
4. Sets the SVG to take up 100% width and height of its container.
5. Appends the SVG to the block.

## Accessibility

The SVG is embedded directly in the DOM, which allows for better accessibility compared to using an `<img>` tag. However, ensure that your SVG includes appropriate ARIA labels and descriptions for complex graphics.

## Dependencies

This block has no external dependencies.

## Suggestions for Improvement

1. Add option for custom sizing (e.g., max-width) through block metadata.
2. Implement fallback for browsers that don't support inline SVG.
3. Add option to specify alternative text for the SVG for improved accessibility.
4. Consider adding animation capabilities for interactive SVGs.