import { MarkdownParser } from '../src/services/web-server.js';
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

  it('should convert markdown to HTML correctly', () => {
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
    expect(compareSections('.bio')).toBeTruthy();
    expect(compareSections('.index')).toBeTruthy();
    expect(compareSections('p')).toBeTruthy();
    expect(compareSections('h2')).toBeTruthy();
    expect(compareSections('ul')).toBeTruthy();
    expect(compareSections('.fragment')).toBeTruthy();
    expect(compareSections('.section-metadata')).toBeTruthy();
    expect(compareSections('.blogroll')).toBeTruthy();
    expect(compareSections('.returntotop')).toBeTruthy();
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
