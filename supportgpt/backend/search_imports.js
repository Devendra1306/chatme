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
      if (content.includes('firebase')) {
        console.log(`🔍 Found "firebase" import in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('firebase')) {
            console.log(`   Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles(searchDir);
