# Blogroll Block

The Blogroll block is a versatile component for displaying a list of blog posts, with support for both full and compact display modes.

## Usage

To use the Blogroll block, add it to your page with the following structure:

| Blogroll |
|----------|
| [filter terms] |

For a compact version, add the 'compact' class:

| Blogroll (compact) |
|--------------------|
| [filter terms] |

## Authoring

In Google Docs or Microsoft Word:
1. Create a table with one row and one column.
2. In the first cell, type "Blogroll" (or "Blogroll (compact)" for the compact version).
3. Optionally, add a second row with filter terms to limit displayed posts.

## Styling

The block uses CSS variables for easy customization:

- `--blogroll-font-family`: Font family for the blogroll (default: Arial, sans-serif)
- `--blogroll-max-width`: Maximum width of the blogroll container (default: 800px)
- `--blogroll-padding`: Padding around the blogroll content (default: 20px)
- `--blogroll-title-color`: Color of series titles (default: #333)
- `--blogroll-border-color`: Color of borders (default: #ddd)
- `--blogroll-link-color`: Color of post links (default: #0066cc)
- `--blogroll-date-color`: Color of post dates (default: #666)
- `--blogroll-text-color`: Color of post descriptions (default: #444)
- `--blogroll-panel-bg-color`: Background color of the compact panel (default: #f0f4f8)
- `--blogroll-panel-text-color`: Text color in the compact panel (default: #333)
- `--blogroll-icon-size`: Size of the compact mode icon (default: 40px)
- `--blogroll-icon-bg-color`: Background color of the compact mode icon (default: #007bff)
- `--blogroll-icon-color`: Color of the compact mode icon (default: white)
- `--blogroll-panel-width`: Width of the compact panel (default: 300px)
- `--blogroll-panel-header-border-color`: Border color of the compact panel header (default: #d0d9e1)
- `--blogroll-panel-link-color`: Link color in the compact panel (default: #0056b3)
- `--blogroll-panel-date-color`: Date color in the compact panel (default: #555)
- `--blogroll-entry-border-color`: Border color for individual entries (default: #e0e0e0)

## Behavior

- The block fetches blog post data from '/query-index.json'.
- Posts are grouped by series and sorted within each series.
- In compact mode, an icon is displayed that opens a side panel when clicked.
- The compact panel includes a "Show All Posts" toggle.
- Each blog post entry now has a thin border for improved visual separation.

## Accessibility

- The compact mode icon and panel are keyboard accessible.
- ARIA labels are used for better screen reader support.
- The panel can be closed using the Escape key.

## Dependencies

- This block relies on the presence of a '/query-index.json' file for blog post data.

## Recent Changes

- Added a thin border around each blog post entry for improved visual separation.
- Implemented the `blogroll-entry` class for consistent styling across full and compact modes.
- Enhanced the README with more detailed styling information and recent changes.

## Suggestions for Improvement

1. Implement lazy loading for large numbers of posts to improve performance.
2. Add sorting options (e.g., by date, alphabetically) for user customization.
3. Enhance the filtering mechanism to allow for more complex queries.
4. Implement a search functionality within the blogroll.
5. Add options for different layout styles (e.g., grid view, list view).
6. Implement pagination for better handling of large numbers of posts.
7. Add social sharing buttons for individual blog posts.
8. Implement a "Related Posts" feature based on tags or categories.
9. Add an option to display post thumbnails for a more visual representation.
10. Implement a caching mechanism to improve load times for frequently accessed data.
