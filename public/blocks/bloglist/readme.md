# Bloglist Component

This document describes the functionality of the `bloglist.js` file, which is responsible for creating a list of blog posts on a webpage.

## Main Function: `decorate`

The `decorate` function is the entry point of this component. It performs the following tasks:

1. Fetches blog data from `/query-index.json`.
2. Filters blog items to include only those with "developer-guide" in the path, excluding the current page.
3. Sorts the filtered blog items alphabetically by title.
4. Limits the number of displayed blog items to 4.
5. Generates HTML content for the blog list.
6. Inserts the generated content into the DOM.

## Helper Functions

### `generateContent(blogItems)`

This function creates HTML markup for each blog item, including:

- Link to the blog post
- Blog post image
- Title
- Description
- Last modified date

### `formatDate(date)`

Formats a given date object into a string with the format "DD/Month/YYYY".

### `getMonthName(monthIndex)`

Converts a month index (0-11) to its corresponding month name.

## Usage

The `bloglist.js` file is designed to be used with the Franklin site generator. It automatically runs when a page containing a `.bloglist` element is loaded.

To use this component in your Franklin project:

1. Place the `bloglist.js` file in the `blocks/bloglist/` directory.
2. Add a `<div class="bloglist"></div>` element to your HTML where you want the blog list to appear.

The component will automatically populate the blog list with up to 4 relevant blog posts from the "developer-guide" section, sorted alphabetically by title.
