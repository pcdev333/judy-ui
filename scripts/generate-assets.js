#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function createMinimalPNG(width, height) {
  // PNG signature
  const png_sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdr_data = Buffer.alloc(13);
  ihdr_data.writeUInt32BE(width, 0);
  ihdr_data.writeUInt32BE(height, 4);
  ihdr_data[8] = 8;  // bit depth
  ihdr_data[9] = 2;  // color type (RGB)
  ihdr_data[10] = 0; // compression
  ihdr_data[11] = 0; // filter
  ihdr_data[12] = 0; // interlace
  
  const ihdr_chunk_type = Buffer.from('IHDR');
  const ihdr_crc = crc32(Buffer.concat([ihdr_chunk_type, ihdr_data]));
  
  const ihdr_len = Buffer.alloc(4);
  ihdr_len.writeUInt32BE(13, 0);
  const ihdr_chunk = Buffer.concat([ihdr_len, ihdr_chunk_type, ihdr_data, crc32Buffer(ihdr_crc)]);
  
  // IDAT chunk (minimal image data)
  const scanline = Buffer.alloc(1 + width * 3);
  scanline[0] = 0; // filter type
  const raw_data = Buffer.concat([scanline]);
  const full_data = Buffer.concat(Array(height).fill(raw_data));
  
  const compressed = zlib.deflateSync(full_data);
  const idat_chunk_type = Buffer.from('IDAT');
  const idat_crc = crc32(Buffer.concat([idat_chunk_type, compressed]));
  
  const idat_len = Buffer.alloc(4);
  idat_len.writeUInt32BE(compressed.length, 0);
  const idat_chunk = Buffer.concat([idat_len, idat_chunk_type, compressed, crc32Buffer(idat_crc)]);
  
  // IEND chunk
  const iend_chunk_type = Buffer.from('IEND');
  const iend_crc = crc32(iend_chunk_type);
  const iend_len = Buffer.alloc(4);
  iend_len.writeUInt32BE(0, 0);
  const iend_chunk = Buffer.concat([iend_len, iend_chunk_type, crc32Buffer(iend_crc)]);
  
  return Buffer.concat([png_sig, ihdr_chunk, idat_chunk, iend_chunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crc32Buffer(num) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(num, 0);
  return buf;
}

const MINIMAL_PNG = createMinimalPNG(16, 16);

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, MINIMAL_PNG);
    console.log(`Created: assets/${file}`);
  } else {
    console.log(`Exists:  assets/${file}`);
  }
});
console.log('\nDone! Replace placeholders with real assets before publishing.');
