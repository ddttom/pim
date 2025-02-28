import { MarkdownParser } from '../src/services/MDParser.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MarkdownParser', () => {
  let parser;
  let exampleMd;
  let exampleHtml;

  beforeAll(async () => {
    parser = new MarkdownParser();
    
    // Read test files
    const mdPath = path.join(__dirname, '../docs/frankenstein/example.md');
    const htmlPath = path.join(__dirname, '../docs/frankenstein/example.html');
    
    exampleMd = await fs.readFile(mdPath, 'utf-8');
    exampleHtml = await fs.readFile(htmlPath, 'utf-8');
  });

  it('should convert basic markdown elements correctly', () => {
    const markdown = `
# Header 1
## Header 2
### Header 3

- List item 1
- List item 2

**Bold text**

*Italic text*

\`Code text\`

[Link text](https://example.com)

![Alt text](https://example.com/image.png)
    `;

    const result = parser.parse(markdown);
    const dom = new JSDOM(result).window.document;

    expect(dom.querySelector('h1').textContent).toBe('Header 1');
    expect(dom.querySelector('h2').textContent).toBe('Header 2');
    expect(dom.querySelector('h3').textContent).toBe('Header 3');
    expect(dom.querySelectorAll('li').length).toBe(2);
    expect(dom.querySelector('strong').textContent).toBe('Bold text');
    expect(dom.querySelector('em').textContent).toBe('Italic text');
    expect(dom.querySelector('code').textContent).toBe('Code text');
    expect(dom.querySelector('a').href).toBe('https://example.com/');
    expect(dom.querySelector('img').src).toBe('https://example.com/image.png');
  });

  it('should handle tables correctly', () => {
    const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
    `;

    const result = parser.parse(markdown);
    const dom = new JSDOM(result).window.document;

    const table = dom.querySelector('table');
    expect(table).toBeTruthy();
    
    const headers = table.querySelectorAll('th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toBe('Header 1');
    expect(headers[1].textContent).toBe('Header 2');

    const cells = table.querySelectorAll('td');
    expect(cells.length).toBe(4);
    expect(cells[0].textContent).toBe('Cell 1');
    expect(cells[3].textContent).toBe('Cell 4');
  });

  it('should handle complex markdown documents', () => {
    const result = parser.parse(exampleMd);
    const resultDom = new JSDOM(result).window.document;
    const expectedDom = new JSDOM(exampleHtml).window.document;

    // Compare main sections
    const compareSections = (selector) => {
      const resultEl = resultDom.querySelector(selector);
      const expectedEl = expectedDom.querySelector(selector);
      
      if (!resultEl || !expectedEl) {
        console.log(`Missing element for selector: ${selector}`);
        console.log('Result:', resultEl ? resultEl.outerHTML : 'null');
        console.log('Expected:', expectedEl ? expectedEl.outerHTML : 'null');
        return false;
      }
      
      const resultHtml = resultEl.innerHTML.trim();
      const expectedHtml = expectedEl.innerHTML.trim();
      
      if (resultHtml !== expectedHtml) {
        console.log(`Mismatch for selector: ${selector}`);
        console.log('Result:', resultHtml);
        console.log('Expected:', expectedHtml);
      }
      
      return resultHtml === expectedHtml;
    };

    // Test main sections
    expect(compareSections('h1')).toBeTruthy();
    expect(compareSections('p')).toBeTruthy();
    expect(compareSections('h2')).toBeTruthy();
    expect(compareSections('ul')).toBeTruthy();
    expect(compareSections('table')).toBeTruthy();
  });

  it('should not modify input files', async () => {
    // Re-read files to ensure they haven't changed
    const mdPath = path.join(__dirname, '../docs/frankenstein/example.md');
    const htmlPath = path.join(__dirname, '../docs/frankenstein/example.html');
    
    const currentMd = await fs.readFile(mdPath, 'utf-8');
    const currentHtml = await fs.readFile(htmlPath, 'utf-8');
    
    expect(currentMd).toBe(exampleMd);
    expect(currentHtml).toBe(exampleHtml);
  });
});
