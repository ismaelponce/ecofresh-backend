import { storage } from './config/firebase.js';
import { readFileSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simple test utility to verify Firebase Storage uploads are working
 */
async function testUpload() {
  try {
    console.log('Starting storage upload test');

    // Get the default bucket
    const bucket = storage.bucket();
    console.log('Using bucket:', bucket.name);

    // Create a simple test text file in memory
    const testContent = Buffer.from('Test content ' + new Date().toISOString());
    const fileName = `test-${Date.now()}.txt`;

    // Create a file reference
    const fileRef = bucket.file(fileName);
    console.log('Created file reference for:', fileName);

    // Upload the file
    console.log('Uploading file...');
    await fileRef.save(testContent, {
      contentType: 'text/plain',
      public: true,
      resumable: false,
    });

    // Make the file public
    await fileRef.makePublic();
    
    // Get the public URL
    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log('File uploaded successfully!');
    console.log('Public URL:', url);

    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during test upload:', error);
    process.exit(1);
  }
}

// Run the test
testUpload(); 