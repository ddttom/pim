import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { MarkdownParser } from './MDParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, '../../public');
const markdownParser = new MarkdownParser();

const app = express();
app.use(cors());

// Read template file once at startup
let template = '';
(async () => {
  try {
    template = await fs.readFile(path.join(publicPath, 'template.txt'), 'utf-8');
  } catch (error) {
    console.error('Failed to load template:', error);
  }
})();

// Custom static file handler
app.use(async (req, res, next) => {
  try {
    // If explicitly requesting .md file, serve as static
    if (req.path.endsWith('.md')) {
      return next();
    }
    
    // Remove .html extension if present
    const requestPath = req.path.replace(/\.html$/, '');
    
    // Check for markdown file
    const mdPath = path.join(publicPath, `${requestPath}.md`);
    try {
      await fs.access(mdPath);
      
      // Read and convert markdown
      const markdown = await fs.readFile(mdPath, 'utf-8');
      const html = markdownParser.parse(markdown);
      
      // Handle plain.html requests
      if (req.path.endsWith('plain.html')) {
        return res.send(html);
      }
      
      // Use template for regular requests
      if (template) {
        const templatedHtml = template.replace('{{ INSERT_CONTENT_HERE }}', html);
        return res.send(templatedHtml);
      }
      
      // Fallback to just HTML if no template
      return res.send(html);
    } catch {
      // Markdown file not found, continue to static files
      return next();
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Serve static files as fallback
app.use(express.static(publicPath));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});
