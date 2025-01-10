
# Dynamic block JS

This JavaScript code is part Tom Cranstoun derived variations of Helix CMS, with diagrams here <https://main--allaboutv2--ddttom.hlx.live/extra/dynamic>

It defines an asynchronous function named `decorate` that dynamically manipulates web content based on certain conditions. The function is designed to work within a specific block of a webpage, enhancing it with dynamic content fetched from a JSON file.

The file is /query-index.json which is auto-populated by Helix whenever pages are published or deleted

the dynamic pages are selected using one of three different mechanisms:

default is to use /blog/ as a path to find pages
if the current page has more than / in its path, such as /articles/index t5hen the default becomes the path
finally if there are any classnames in the helix block these are used as paths.

one can use section metadata attribute "maxReturn" to set the maximum number of entries.
if no section metadata the code looks for page metadata maxReturn
if not found it then looks for "$system:maxreturn$"
and finally it uses 8 if they do not exist.

You can pull in the headline, description, 'service' tag, 'resource' tag and url path from the query-index to the card. This will display relevant information about the article and allow a link to the page from the card.

Here's a detailed breakdown:

## ESLint Directives

- **`eslint-disable function-paren-newline, import/extensions, no-alert`**: These lines disable specific ESLint rules for this file, allowing certain code styles that ESLint would normally flag as violations. This customization is common in projects to fit the team's coding style or project's requirements.

## Imports

- **Various elements from `'../../scripts/dom-helpers.js'`**: Functions like `a`, `div`, `li`, `p`, `strong`, `ul` are imported for creating HTML elements programmatically. This approach is typical in modern web development to dynamically generate content.
- **`createOptimizedPicture` from `'../../scripts/aem.js'`**: A function designed to create optimized `<picture>` elements for responsive images, a common practice in web performance optimization.
- **`ffetch` from `'../../scripts/ffetch.js'`**: a wrapper around the Fetch API, tailored for this project's specific needs for making network requests.

### The `decorate` Function

- **Purpose**: Asynchronously fetches and processes content, then injects this content into a specified block element on the webpage.
- **Parameters**:
  - `block`: The DOM element into which the dynamic content will be inserted.

#### Key Operations

1. **Element Selection**: Finds an element with the class `.dynamic-container` within the document.

2. **Max Return Calculation**: Determines the maximum number of content items to fetch, prioritizing the value of a `data-maxreturn` attribute, followed by system configurations, and defaults to `8` if none are specified.

3. **Content Fetching**: Uses the `ffetch` function to asynchronously retrieve content from `/query-index.json`.

4. **Target Names Initialization**: Sets the default content category to `blog`. It adjusts the target based on the current URL path, excluding the domain.

5. **Additional Targets**: Dynamically adjusts target names based on additional class names of the `block` element, with exclusions for specific patterns.

6. **Content Filtering**: Excludes content paths that contain `/template` or match the current page's path. Further filters the content to include only items that match the specified `targetNames`.

7. **Sorting**: Orders the filtered content by the `lastModified` timestamp in descending order.

8. **Content Injection**: Limits the displayed content based on `maxReturnNumber` and appends it to the `block` element. Each item is structured with an image, title, description, and a "Read More" link.

### Summary

The script is a sophisticated content loader that enhances user experience by dynamically displaying relevant content. It leverages modern JavaScript practices, such as asynchronous data fetching, dynamic content generation, and efficient content filtering and sorting. This approach is particularly effective in content-heavy sites, allowing for a more responsive, tailored user experience.
