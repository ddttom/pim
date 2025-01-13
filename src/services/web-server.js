import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WebServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.templateContent = null;
    this.errorPageContent = null;
    
    // Security middleware
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'development' ? '*' : false
    }));
    
    this.app.use((req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Serve static files
    this.app.use(express.static(path.join(__dirname, '../../public')));
    
    // Root path handler
    this.app.get('/', async (req, res) => {
      try {
        if (!this.templateContent || !this.errorPageContent) {
          return res.status(500).send('Server not ready');
        }
        
        // Use index.md for root path
        const tplPath = path.join(__dirname, '../../public/index.md');
        
        // Try to read .md file
        let content;
        try {
          content = await fs.readFile(tplPath, 'utf-8');
        } catch (error) {
          if (error.code === 'ENOENT') {
            // Serve 404.html if .md doesn't exist
            return res.status(404).send(this.errorPageContent);
          }
          throw error;
        }
        
        // Combine template with .md content
        const html = this.templateContent.replace(
          '{{ INSERT_CONTENT_HERE }}',
          content
        );
        
        res.set('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    // HTML route handler
    this.app.get('*.html', async (req, res) => {
      try {
        if (!this.templateContent || !this.errorPageContent) {
          return res.status(500).send('Server not ready');
        }
        
        // Convert requested .html to .md path
        const tplPath = path.join(
          __dirname,
          '../../public',
          req.path.replace('.html', '.md')
        );
        
        // Try to read .mdfile
        let content;
        try {
          content = await fs.readFile(tplPath, 'utf-8');
        } catch (error) {
          if (error.code === 'ENOENT') {
            // Serve 404.html if .md doesn't exist
            return res.status(404).send(this.errorPageContent);
          }
          throw error;
        }
        
        // Combine template with .md content
        const html = this.templateContent.replace(
          '{{ INSERT_CONTENT_HERE }}',
          content
        );
        
        res.set('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  async loadTemplates() {
    try {
      // Load main template
      const templatePath = path.join(__dirname, '../../public/template.txt');
      this.templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Load 404 page
      const errorPagePath = path.join(__dirname, '../../public/404.html');
      this.errorPageContent = await fs.readFile(errorPagePath, 'utf-8');
      
      console.log('Templates loaded successfully');
    } catch (error) {
      console.error('Failed to load templates:', error);
      throw error;
    }
  }

  async start() {
    await this.loadTemplates();
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Web server running on port ${this.port}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Web server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default WebServer;
