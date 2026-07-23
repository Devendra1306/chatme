import fs from 'fs';
import path from 'path';

const searchDir = 'k:\\chatbot\\supportgpt\\backend';

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        searchFiles(fullPath);
      }
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('uploads') && !file.includes('check_')) {
        console.log(`🔍 Matches "uploads" in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('uploads')) {
            console.log(`   Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles(searchDir);
