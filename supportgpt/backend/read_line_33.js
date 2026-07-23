import fetch from 'node-fetch';

async function check() {
  const url = 'https://chatme-ruby.vercel.app/assets/index-DrZuYUgd.js';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    console.log(`Total lines: ${lines.length}`);
    
    // Line 33 (which is 32 0-indexed)
    console.log('\n--- Line 33 context (around column 108) ---');
    if (lines[32]) {
      console.log('Line 33 length:', lines[32].length);
      console.log('At 33:108 ->', lines[32].slice(Math.max(0, 108 - 100), 108 + 100));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
