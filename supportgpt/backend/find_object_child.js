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
      
      // Let's look for suspicious JSX expressions like {error} or {err} or {msg}
      const jsxExpressions = content.match(/\{[a-zA-Z0-9_\.]+\}/g);
      if (jsxExpressions) {
        jsxExpressions.forEach((expr) => {
          const name = expr.slice(1, -1);
          if (['error', 'err', 'message', 'msg', 'errorMessage'].includes(name)) {
            console.log(`🔍 Potential object-as-child rendering in: ${fullPath}`);
            console.log(`   Expression: ${expr}`);
            
            // Print context lines
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes(expr)) {
                console.log(`   Line ${idx + 1}: ${line.trim()}`);
              }
            });
          }
        });
      }
    }
  }
}

console.log('Searching for rendering of raw error/message variables...');
searchFiles(searchDir);
console.log('Search complete.');
