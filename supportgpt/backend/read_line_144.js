import fetch from 'node-fetch';

async function check() {
  const url = 'https://chatme-ruby.vercel.app/assets/index-DrZuYUgd.js';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    console.log(`Total lines: ${lines.length}`);
    
    // Line 144 (which is 143 0-indexed)
    console.log('\n--- Line 144 context (around column 1257) ---');
    if (lines[143]) {
      console.log('Line 144 length:', lines[143].length);
      console.log('At 144:1257 ->', lines[143].slice(Math.max(0, 1257 - 100), 1257 + 100));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
