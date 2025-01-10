# Raw Block

The Raw block processes HTML content within a cell, removing it from the DOM and reinserting it in-place, with added security and validation measures. It can handle content that's sent within quotes and with encoded HTML entities, and allows for safe embedding of iframes from trusted domains.

## Usage

Use this block when you want to insert raw HTML content into your Franklin page without any additional processing or wrapping, while ensuring the content is safe and valid. This is particularly useful for embedding content like iframes from trusted sources.

## Authoring

In your Google Docs or Microsoft Word document, create a table with two rows:
1. The first row should contain "Raw" in the first cell.
2. The second row should contain the raw HTML content you want to insert. This content can be within quotes and may contain encoded HTML entities.

| Raw |
|-----|
| "<Your raw HTML content here, including iframes from trusted domains>" |

## Behavior

The JavaScript for this block does the following:
1. Extracts the HTML content from the block.
2. Removes surrounding quotes if present.
3. Decodes HTML entities.
4. Sanitizes the content to remove potentially harmful elements and attributes, while preserving safe iframes.
5. Validates the HTML structure.
6. If valid, inserts the sanitized HTML content back into the block.
7. Logs and reports any issues encountered during the process.

This process allows for the insertion of raw HTML without additional wrapping or processing by Franklin, while maintaining security and structural integrity.

## Accessibility

Ensure that any raw HTML content you insert is accessible and follows web accessibility guidelines (WCAG).

## Security

The block implements the following security measures:
1. HTML sanitization to remove potentially harmful elements and attributes.
2. Special handling for iframe to ensure they're from trusted domains.
3. HTML structure validation to ensure only well-formed HTML is inserted.
4. Error handling and reporting for any issues encountered during processing.

## Limitations

- Some complex HTML structures or advanced features may be affected by the sanitization process.
- JavaScript within the raw HTML will be removed for security reasons.
- Only iframes from trusted domains (currently 'ooo.mmhmm.app') are allowed. Other domains will be stripped from the src attribute.

## Suggestions for Further Improvement

1. Implement a more robust HTML sanitization library for enhanced security.
2. Add configuration options to allow certain tags or attributes based on specific use cases.
3. Integrate with a centralized logging or monitoring system for better issue tracking.
4. Implement a way to preserve and safely execute certain JavaScript functionality if needed.
5. Allow for configuration of trusted domains for iframes.