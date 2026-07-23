import axios from 'axios';

async function inspect() {
  const url = 'https://chatme-ruby.vercel.app/assets/index-DrZuYUgd.js';
  try {
    console.log(`Downloading JS bundle: ${url}...`);
    const res = await axios.get(url);
    const code = res.data;
    console.log(`Downloaded code. Length: ${code.length} bytes`);

    // Let's find mentions of "code" and "message" in the minified code
    // Often it appears like: e.code, e.message, or {code:..., message:...}
    console.log('\nSearching for occurrences of code and message properties in the minified bundle:');
    
    // Find all occurrences of something like .code and .message nearby (within 100 chars)
    const regex = /(\.\bcode\b[\s\S]{0,100}\.\bmessage\b|\.\bmessage\b[\s\S]{0,100}\.\bcode\b)/g;
    let match;
    let count = 0;
    while ((match = regex.exec(code)) !== null && count < 10) {
      count++;
      console.log(`\nMatch ${count} (Index: ${match.index}):`);
      const start = Math.max(0, match.index - 100);
      const end = Math.min(code.length, match.index + match[0].length + 100);
      console.log(code.slice(start, end));
    }

  } catch (err) {
    console.error('Error downloading bundle:', err.message);
  }
}

inspect();
