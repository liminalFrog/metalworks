// Script to convert SVG to PNG using sharp
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgBuffer = fs.readFileSync(path.join(__dirname, '../src/assets/icons/icon.svg'));

// Create different sized PNGs
const sizes = [16, 32, 64, 128, 256, 512, 1024];

// Create the main icon.png (1024x1024) for electron-icon-maker
sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toFile(path.join(__dirname, '../src/assets/icons/icon.png'))
  .then(() => console.log('Created icon.png (1024x1024)'))
  .catch(err => console.error('Error creating icon.png:', err));

// Create icons in various sizes for reference
sizes.forEach(size => {
  sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(__dirname, `../src/assets/icons/icon-${size}.png`))
    .then(() => console.log(`Created icon-${size}.png`))
    .catch(err => console.error(`Error creating icon-${size}.png:`, err));
});
