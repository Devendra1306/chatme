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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('code') && content.includes('message')) {
        console.log(`🔍 Matches "code" and "message" in: ${fullPath}`);
        // Let's print the lines containing both or either in context
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('code') || line.includes('message')) {
            console.log(`   Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles(searchDir);
