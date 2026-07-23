import fetch from 'node-fetch';

async function check() {
  const url = 'https://chatme-ruby.vercel.app/assets/index-DrZuYUgd.js';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    console.log(`Total lines: ${lines.length}`);
    
    // Line 157 (which is 156 0-indexed)
    console.log('\n--- Line 157 context (around columns 37756, 36475, 36314) ---');
    if (lines[156]) {
      console.log('Line 157 length:', lines[156].length);
      console.log('At 157:37756 ->', lines[156].slice(Math.max(0, 37756 - 150), 37756 + 150));
      console.log('At 157:36475 ->', lines[156].slice(Math.max(0, 36475 - 150), 36475 + 150));
      console.log('At 157:36314 ->', lines[156].slice(Math.max(0, 36314 - 150), 36314 + 150));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
