# 3D Cube Block

The 3D Cube block creates an interactive, rotatable 3D cube with images on each face that link to specified URLs.

## Features

- 6-sided 3D cube with images on each face
- Rotatable in all directions using mouse movement
- Double-click to navigate to the linked page
- Responsive design

## Usage

To use the 3D Cube block in your Franklin project, create a block with the following structure:

| Image | Link |
|-------|------|
| ![Front face image](path/to/front-image.jpg) | <https://example.com/front> |
| ![Back face image](path/to/back-image.jpg) | <https://example.com/back> |
| ![Right face image](path/to/right-image.jpg) | <https://example.com/right> |
| ![Left face image](path/to/left-image.jpg) | <https://example.com/left> |
| ![Top face image](path/to/top-image.jpg) | <https://example.com/top> |
| ![Bottom face image](path/to/bottom-image.jpg) | <https://example.com/bottom> |

The block will automatically create a 3D cube with the provided images and links.

## Interaction

- Hover over the cube to rotate it freely without clicking
- Click and drag to rotate the cube manually
- Double-click on a face to navigate to the associated link

## Customization

You can customize the appearance of the cube by modifying the `3dcube.css` file. Adjust the cube size, face opacity, and other properties as needed.

## Accessibility and SEO

The 3D Cube block is designed with accessibility and SEO in mind:

- Images have appropriate alt text (inherited from the original image tags)
- Links are standard `<a>` tags, making them crawlable by search engines
- The cube can be rotated using mouse or touch interactions

## Performance

The block uses CSS 3D transforms for smooth performance and minimal JavaScript overhead. Images are loaded as background images to prevent unnecessary DOM elements.

## Browser Support

This block uses modern CSS and JavaScript features. It should work in all modern browsers that support CSS 3D transforms.
