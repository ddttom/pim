# Showcaser Demo

This page demonstrates the functionality of the Showcaser block, which displays code snippets in a visually appealing book-like format.

## Usage Example

| Showcaser |
|-----------|

`Hello World Example
console.log("Hello, World!");`

`Fibonacci Sequence
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`

`CSS Flexbox
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item {
  flex: 1;
  padding: 10px;
}`

## Compact Variation

| Showcaser (compact) |
|---------------------|

`Compact Example
console.log("This is a compact showcaser!");`

## How It Works

1. The Showcaser block collects all code blocks (wrapped in single backticks) from the current page.
2. It creates a book-like interface with clickable titles on the left and content on the right.
3. The first line of each code block becomes the title for that snippet.
4. Clicking a title displays the corresponding code snippet on the right page.
5. The block is responsive and adjusts its layout for different screen sizes.

## Customization

You can customize the appearance of the Showcaser block by modifying the CSS variables in your project's stylesheet. Refer to the README.md file for more details on available variables.

| metadata | |
|----------|--|
| title | Showcaser Block Demo |
| description | Demonstration of the Showcaser block for displaying code snippets |
| json-ld | article |
| image | |
| author | Tom Cranstoun |
| longdescription | This page showcases the Showcaser block functionality in Franklin, displaying code snippets in a visually appealing book-like format. It demonstrates how to use the block, explains its behavior, and provides information on customization options. |
