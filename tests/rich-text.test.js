import { MarkdownEditor } from '../src/renderer/editor/markdown-editor.js';

describe('MarkdownEditor', () => {
  let editor;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    editor = new MarkdownEditor(container);
  });

  describe('Table Conversion', () => {
    test('converts HTML table to markdown', () => {
      const html = `
        <table>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `;

      const expectedMarkdown = 
`| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;

      const result = editor.htmlToMarkdown(html);
      expect(result.trim()).toBe(expectedMarkdown.trim());
    });

    test('converts markdown table to HTML', () => {
      const markdown = 
`| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;

      const expectedHtml = '<table>\n<tr><th>Header 1</th><th>Header 2</th></tr>\n<tr><td>Cell 1</td><td>Cell 2</td></tr>\n</table>\n';

      const result = editor.markdownToHtml(markdown);
      expect(result.trim()).toBe(expectedHtml.trim());
    });

    test('handles empty cells', () => {
      const html = `
        <table>
          <tr>
            <th></th>
            <th>Header</th>
          </tr>
          <tr>
            <td>Cell</td>
            <td></td>
          </tr>
        </table>
      `;

      const expectedMarkdown = 
`|  | Header |
| --- | --- |
| Cell |  |`;

      const result = editor.htmlToMarkdown(html);
      expect(result.trim()).toBe(expectedMarkdown.trim());
    });

    test('preserves table content through multiple conversions', () => {
      const initialHtml = `
        <table>
          <tr>
            <th>Name</th>
            <th>Age</th>
          </tr>
          <tr>
            <td>John</td>
            <td>30</td>
          </tr>
        </table>
      `;

      const markdown = editor.htmlToMarkdown(initialHtml);
      const finalHtml = editor.markdownToHtml(markdown);

      // Convert both to simplified format for comparison (remove whitespace)
      const simplifyHtml = html => html.replace(/\s+/g, '');
      expect(simplifyHtml(finalHtml)).toBe(simplifyHtml(initialHtml));
    });

    test('handles nested content in table cells', () => {
      const html = `
        <table>
          <tr>
            <th><strong>Bold Header</strong></th>
            <th>Normal Header</th>
          </tr>
          <tr>
            <td>Regular Cell</td>
            <td><em>Italic Cell</em></td>
          </tr>
        </table>
      `;

      const expectedMarkdown = 
`| Bold Header | Normal Header |
| --- | --- |
| Regular Cell | Italic Cell |`;

      const result = editor.htmlToMarkdown(html);
      expect(result.trim()).toBe(expectedMarkdown.trim());
    });
  });
});
