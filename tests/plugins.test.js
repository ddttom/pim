import { fileURLToPath } from 'url';
import path from 'path';
import PluginManager from '../src/services/plugins.js';

describe('Plugin Tests', () => {
  let pluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
    const __filename = fileURLToPath(import.meta.url);
    pluginManager.pluginsDirectory = path.join(path.dirname(__filename), '../../public/plugins');
  });

  test('loads plugins from directory', async () => {
    await pluginManager.loadPlugins();
    expect(pluginManager.plugins.length).toBeGreaterThan(0);
  });

  test('initializes plugins', async () => {
    await pluginManager.loadPlugins();
    await pluginManager.initializePlugins();
    
    expect(pluginManager.initialized).toBe(true);
  });

  test('executes hooks correctly', async () => {
    await pluginManager.loadPlugins();
    await pluginManager.initializePlugins();
    
    const result = await pluginManager.executeHook('beforeSave');
    expect(result).toBeUndefined();
  });

  test('handles hook errors gracefully', async () => {
    await pluginManager.loadPlugins();
    await pluginManager.initializePlugins();
    
    const result = await pluginManager.executeHook('invalidHook');
    expect(result).toBeUndefined();
  });
});
