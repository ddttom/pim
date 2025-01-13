import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function findPluginFiles(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(await findPluginFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

export default class PluginManager {
  constructor() {
    this.plugins = [];
    this.initialized = false;
  }

  async loadPlugins() {
    const pluginsDir = path.join(__dirname, '../../public/plugins');
    try {
      const pluginFiles = await findPluginFiles(pluginsDir);
      
      for (const file of pluginFiles) {
        const pluginModule = await import(file);
        
        if (pluginModule.default) {
          // Handle both class and object-style plugins
          const plugin = typeof pluginModule.default === 'function'
            ? new pluginModule.default()
            : pluginModule.default;
            
          this.plugins.push(plugin);
        }
      }
    } catch (error) {
      console.error('Error loading plugins:', error);
    }
  }

  async initializePlugins() {
    await Promise.all(
      this.plugins.map(plugin => {
        if (typeof plugin.initialize === 'function') {
          return plugin.initialize();
        }
      })
    );
    this.initialized = true;
  }

  async executeHook(hookName, context) {
    for (const plugin of this.plugins) {
      if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
        try {
          await plugin.hooks[hookName](context);
        } catch (error) {
          console.error(`Error executing ${hookName} hook in ${plugin.name}:`, error);
        }
      }
    }
  }

  async unloadPlugins() {
    await Promise.all(
      this.plugins.map(plugin => {
        if (typeof plugin.cleanup === 'function') {
          return plugin.cleanup();
        }
      })
    );
    this.plugins = [];
    this.initialized = false;
  }
}
