export default function decorate(block) {
  const svgText = block.textContent.trim();
  if (svgText.startsWith('<svg')) {
    // Clear the text content
    block.textContent = '';

    // Create a container for the SVG
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = svgText;
    
    // Extract the SVG element
    const svgElement = svgContainer.querySelector('svg');
    if (svgElement) {
      // Ensure the SVG takes full width and height
      svgElement.setAttribute('width', '100%');
      svgElement.setAttribute('height', '100%');
      block.appendChild(svgElement);
    } else {
      // eslint-disable-next-line no-console
      console.error('No SVG element found in the provided content');
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('The block does not contain valid SVG content');
  }
}