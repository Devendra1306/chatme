import fetch from 'node-fetch';

async function check() {
  const url = 'https://chatme-ruby.vercel.app/assets/index-DrZuYUgd.js';
  try {
    const res = await fetch(url);
    const code = await res.text();
    
    // Let's find occurrences of strings unique to Register page, e.g. "Join ChatMe to get started"
    console.log('Searching for "Join ChatMe to get started" in bundle:');
    const registerIdx = code.indexOf('Join ChatMe to get started');
    if (registerIdx !== -1) {
      console.log(`Found at index: ${registerIdx}`);
      const slice = code.slice(Math.max(0, registerIdx - 300), registerIdx + 300);
      console.log(slice);
    } else {
      console.log('Not found');
    }

    // Let's find occurrences of strings unique to Login page, e.g. "Sign in to your account"
    console.log('\nSearching for "Sign in to your account" or "Invalid email or password" in bundle:');
    const loginIdx = code.indexOf('Invalid email or password');
    if (loginIdx !== -1) {
      console.log(`Found at index: ${loginIdx}`);
      const slice = code.slice(Math.max(0, loginIdx - 300), loginIdx + 300);
      console.log(slice);
    } else {
      console.log('Not found');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
