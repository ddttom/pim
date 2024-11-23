const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const ExifReader = require('exifreader');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools in development mode.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('load-images', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const images = result.filePaths;
      const metadata = await Promise.all(
        images.map(imagePath => extractMetadata(imagePath))
      );

      return {
        images,
        metadata
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading images:', error);
    throw new Error('Failed to load images');
  }
});

ipcMain.handle('get-metadata', async (event, imagePath) => {
  try {
    return await extractMetadata(imagePath);
  } catch (error) {
    console.error('Error getting metadata:', error);
    throw new Error('Failed to extract metadata');
  }
});

ipcMain.handle('optimize-image', async (event, imagePath) => {
  try {
    const optimizedPath = path.join(
      app.getPath('temp'),
      `optimized-${path.basename(imagePath)}`
    );

    await sharp(imagePath)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toFile(optimizedPath);

    return optimizedPath;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
});

ipcMain.on('toggle-fullscreen', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.setFullScreen(!window.isFullScreen());
});

// Helper function to extract metadata
async function extractMetadata(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const tags = await ExifReader.load(imageBuffer);
    const stats = await fs.stat(imagePath);
    const dimensions = await sharp(imagePath).metadata();

    return {
      camera: tags.Model ? tags.Model.description : 'Unknown',
      lens: tags.LensModel ? tags.LensModel.description : 'Unknown',
      focalLength: tags.FocalLength ? `${tags.FocalLength.description}mm` : 'Unknown',
      fStop: tags.FNumber ? `f/${tags.FNumber.description}` : 'Unknown',
      shutterSpeed: tags.ExposureTime ? `${tags.ExposureTime.description}s` : 'Unknown',
      iso: tags.ISOSpeedRatings ? tags.ISOSpeedRatings.description : 'Unknown',
      dimensions: `${dimensions.width}x${dimensions.height}`,
      dpi: dimensions.density ? `${dimensions.density}` : 'Unknown',
      fileSize: formatFileSize(stats.size)
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      camera: 'Unknown',
      lens: 'Unknown',
      focalLength: 'Unknown',
      fStop: 'Unknown',
      shutterSpeed: 'Unknown',
      iso: 'Unknown',
      dimensions: 'Unknown',
      dpi: 'Unknown',
      fileSize: 'Unknown'
    };
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
