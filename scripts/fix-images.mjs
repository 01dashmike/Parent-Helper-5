#!/usr/bin/env node

/**
 * Fix Images Script
 * 
 * Converts all JPG/JPEG images in /public/images/categories to WebP format
 * Uses Sharp for high-quality conversion
 * 
 * Usage: node scripts/fix-images.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_DIR = path.join(__dirname, '../public/images/categories');

async function convertToWebP() {
  console.log('🖼️  Converting images to WebP format...\n');

  if (!fs.existsSync(CATEGORIES_DIR)) {
    console.error(`❌ Directory not found: ${CATEGORIES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CATEGORIES_DIR);
  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const inputPath = path.join(CATEGORIES_DIR, file);
      const name = path.basename(file, path.extname(file));
      const outputPath = path.join(CATEGORIES_DIR, `${name}.webp`);

      // Skip if WebP already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipped: ${file} (WebP already exists)`);
        skipped++;
        continue;
      }

      try {
        await sharp(inputPath)
          .toFormat('webp', { quality: 80 })
          .toFile(outputPath);

        const originalSize = fs.statSync(inputPath).size;
        const newSize = fs.statSync(outputPath).size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`✅ Converted: ${file} → ${name}.webp (${savings}% smaller)`);
        converted++;
      } catch (error) {
        console.error(`❌ Failed to convert ${file}:`, error.message);
      }
    }
  }

  console.log(`\n✨ Conversion complete!`);
  console.log(`   Converted: ${converted} images`);
  console.log(`   Skipped: ${skipped} images (already exist)`);
}

convertToWebP();

