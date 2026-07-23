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
      
      // Extract everything between { and } in JSX-like contexts
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('{') && line.includes('}') && !line.includes('import') && !line.includes('const') && !line.includes('function') && !line.includes('=>')) {
          // Check if it looks like a JSX interpolation
          const match = line.match(/\{([^}]+)\}/);
          if (match) {
            const val = match[1].trim();
            // Ignore common helper function calls, styling objects, or booleans
            if (val && !val.startsWith('class') && !val.includes('()') && !val.includes('?') && !val.includes('&&') && !val.includes('||') && !val.startsWith('"') && !val.startsWith('\'')) {
              console.log(`${file}:${idx + 1} -> { ${val} }`);
            }
          }
        }
      });
    }
  }
}

searchFiles(searchDir);
