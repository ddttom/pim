// CommonJS entry point for Electron
const path = require('path');

(async () => {
  try {
    // Convert the file URL to a path that works with import()
    const mainPath = path.join(__dirname, 'main.js');
    const mainUrl = `file://${mainPath}`;

    // Import the ES module main file
    const main = await import(mainUrl);

    // Export any functions that might be needed
    module.exports = main;
  } catch (error) {
    console.error('Failed to load main process:', error);
    process.exit(1);
  }
})();
