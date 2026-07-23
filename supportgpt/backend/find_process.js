import fs from 'fs';
import path from 'path';

const searchDir = 'k:\\chatbot\\supportgpt\\frontend\\src';

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('process.env')) {
        console.log(`🔍 Found "process.env" in: ${fullPath}`);
        // Print lines containing process.env
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('process.env')) {
            console.log(`   Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for "process.env" in frontend source...');
searchFiles(searchDir);
console.log('Search complete.');
