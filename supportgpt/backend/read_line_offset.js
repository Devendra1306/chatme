import fs from 'fs';
import path from 'path';

async function check() {
  const filePath = 'k:\\chatbot\\supportgpt\\backend\\inspect_bundle.js'; // Wait, we downloaded the code inside check_vercel_deploy.js or inspect_bundle.js?
  // Let's download the JS bundle and check the characters at line 104 column 791 (which is 103 0-indexed line, 790 0-indexed column)
  const url = 'https://chatme-ruby.vercel.app/assets/index-DrZuYUgd.js';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    console.log(`Total lines: ${lines.length}`);
    
    // Line 100 (which is 99 0-indexed)
    console.log('\n--- Line 100 context (around column 105 and 353) ---');
    if (lines[99]) {
      console.log('Line 100 length:', lines[99].length);
      console.log('At 100:105 ->', lines[99].slice(Math.max(0, 105 - 50), 105 + 50));
      console.log('At 100:353 ->', lines[99].slice(Math.max(0, 353 - 50), 353 + 50));
    }

    // Line 104 (which is 103 0-indexed)
    console.log('\n--- Line 104 context (around column 791) ---');
    if (lines[103]) {
      console.log('Line 104 length:', lines[103].length);
      console.log('At 104:791 ->', lines[103].slice(Math.max(0, 791 - 50), 791 + 50));
      console.log('At 104:8294 ->', lines[103].slice(Math.max(0, 8294 - 50), 8294 + 50));
    }

    // Line 133 (which is 132 0-indexed)
    console.log('\n--- Line 133 context (around column 3132) ---');
    if (lines[132]) {
      console.log('Line 133 length:', lines[132].length);
      console.log('At 133:3132 ->', lines[132].slice(Math.max(0, 3132 - 50), 3132 + 50));
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
