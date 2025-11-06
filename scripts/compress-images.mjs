#!/usr/bin/env node

/**
 * Image Compression Script
 * 
 * Compresses all images in /public/images using Sharp
 * - Converts to AVIF (quality 45) and WebP (quality 60)
 * - Only overwrites if result is smaller
 * - Skips SVGs and files < 150KB
 * - Logs before/after sizes
 * 
 * Usage: node scripts/compress-images.mjs
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../public/images');
const MIN_SIZE = 150 * 1024; // 150KB
const QUALITY_AVIF = 45;
const QUALITY_WEBP = 60;

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatSize(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Skip non-image files
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return null;
  }

  const originalSize = await getFileSize(filePath);
  
  // Skip small files
  if (originalSize < MIN_SIZE) {
    console.log(`⏭️  Skipped ${path.basename(filePath)} (${formatSize(originalSize)} < 150KB)`);
    return null;
  }

  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, ext);

  try {
    // Read original
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let compressed = false;
    let savedBytes = 0;

    // Try AVIF
    const avifPath = path.join(dir, `${baseName}.avif`);
    await image.avif({ quality: QUALITY_AVIF }).toFile(avifPath);
    const avifSize = await getFileSize(avifPath);
    
    if (avifSize < originalSize) {
      console.log(`✅ AVIF: ${path.basename(filePath)} ${formatSize(originalSize)} → ${formatSize(avifSize)} (${formatSize(originalSize - avifSize)} saved)`);
      compressed = true;
      savedBytes += originalSize - avifSize;
    } else {
      await fs.unlink(avifPath);
      console.log(`❌ AVIF: ${path.basename(filePath)} larger, skipped`);
    }

    // Try WebP
    const webpPath = path.join(dir, `${baseName}.webp`);
    await image.webp({ quality: QUALITY_WEBP }).toFile(webpPath);
    const webpSize = await getFileSize(webpPath);
    
    if (webpSize < originalSize) {
      console.log(`✅ WebP: ${path.basename(filePath)} ${formatSize(originalSize)} → ${formatSize(webpSize)} (${formatSize(originalSize - webpSize)} saved)`);
      compressed = true;
      savedBytes += originalSize - webpSize;
    } else {
      await fs.unlink(webpPath);
      console.log(`❌ WebP: ${path.basename(filePath)} larger, skipped`);
    }

    return { compressed, savedBytes };
  } catch (error) {
    console.error(`❌ Error compressing ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

async function walkDirectory(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await walkDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

async function main() {
  console.log('🖼️  Parent Helper Image Compression\n');
  console.log(`📁 Scanning: ${IMAGES_DIR}\n`);

  const allFiles = await walkDirectory(IMAGES_DIR);
  const imageFiles = allFiles.filter(f => ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()));

  console.log(`Found ${imageFiles.length} images to process\n`);

  let totalSaved = 0;
  let processedCount = 0;

  for (const file of imageFiles) {
    const result = await compressImage(file);
    if (result && result.compressed) {
      totalSaved += result.savedBytes;
      processedCount++;
    }
  }

  console.log(`\n✨ Compression complete!`);
  console.log(`📊 Processed: ${processedCount} images`);
  console.log(`💾 Total saved: ${formatSize(totalSaved)}`);
}

main().catch(console.error);

