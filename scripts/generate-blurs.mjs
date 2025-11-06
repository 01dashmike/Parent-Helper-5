#!/usr/bin/env node

/**
 * Blur Placeholder Generator
 * 
 * Creates tiny blurred versions of images for Next.js placeholder="blur"
 * - Generates 10x10px blurred versions
 * - Saves as *-blur.jpg alongside originals
 * - Skips existing blur files
 * - Outputs base64 data URLs for use in <Image> components
 * 
 * Usage: node scripts/generate-blurs.mjs
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_DIR = path.join(__dirname, '../public/images/categories');
const BLUR_SIZE = 10;
const BLUR_SIGMA = 5;

async function generateBlurPlaceholder(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Skip non-images and existing blur files
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return null;
  if (path.basename(filePath).includes('-blur')) return null;

  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, ext);
  const blurPath = path.join(dir, `${baseName}-blur.jpg`);

  try {
    // Check if blur already exists
    try {
      await fs.access(blurPath);
      console.log(`⏭️  Skipped ${path.basename(filePath)} (blur already exists)`);
      return null;
    } catch {
      // Blur doesn't exist, create it
    }

    // Generate tiny blurred version
    const buffer = await sharp(filePath)
      .resize(BLUR_SIZE, BLUR_SIZE, { fit: 'inside' })
      .blur(BLUR_SIGMA)
      .jpeg({ quality: 50 })
      .toBuffer();

    // Save to file
    await sharp(buffer).toFile(blurPath);

    // Generate base64 data URL for code
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const fileSize = (await fs.stat(blurPath)).size;

    console.log(`✅ Generated ${path.basename(blurPath)} (${fileSize} bytes)`);
    
    return {
      original: path.basename(filePath),
      blur: path.basename(blurPath),
      dataUrl,
      size: fileSize,
    };
  } catch (error) {
    console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🎨 Parent Helper Blur Placeholder Generator\n');
  console.log(`📁 Processing: ${CATEGORIES_DIR}\n`);

  try {
    const files = await fs.readdir(CATEGORIES_DIR);
    const imageFiles = files
      .filter(f => ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()))
      .filter(f => !f.includes('-blur'))
      .map(f => path.join(CATEGORIES_DIR, f));

    console.log(`Found ${imageFiles.length} images\n`);

    const results = [];
    for (const file of imageFiles) {
      const result = await generateBlurPlaceholder(file);
      if (result) results.push(result);
    }

    console.log(`\n✨ Generated ${results.length} blur placeholders`);
    
    // Output code snippet for developers
    if (results.length > 0) {
      console.log('\n📝 Example usage in <Image> component:');
      console.log(`
<Image
  src="/images/categories/${results[0].original}"
  alt="Description"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="/images/categories/${results[0].blur}"
/>
      `);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

