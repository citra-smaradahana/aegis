/**
 * Generate Android launcher icons from public/aegis.png
 * Run: node scripts/generate-android-icons.js
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'public', 'aegis.png');
const resDir = join(root, 'android', 'app', 'src', 'main', 'res');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generate() {
  if (!existsSync(source)) {
    console.error('Source not found:', source);
    process.exit(1);
  }

  const sourceBuffer = readFileSync(source);

  for (const [folder, size] of Object.entries(sizes)) {
    const dir = join(resDir, folder);
    const buffer = await sharp(sourceBuffer)
      .resize(size, size)
      .png()
      .toBuffer();

    const files = ['ic_launcher.png', 'ic_launcher_foreground.png', 'ic_launcher_round.png'];
    for (const file of files) {
      const outPath = join(dir, file);
      await sharp(buffer).png().toFile(outPath);
      console.log('Created:', outPath.replace(root, ''));
    }
  }

  console.log('Done! Android icons generated from aegis.png');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
