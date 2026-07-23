import fs from 'fs';
import path from 'path';

const searchDir = 'k:\\chatbot\\supportgpt\\backend';
const lowerModels = [
  'analytics.js',
  'chat.js',
  'chunk.js',
  'conversation.js',
  'document.js',
  'knowledgebase.js',
  'message.js',
  'ticket.js',
  'user.js'
];

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
      lowerModels.forEach((m) => {
        const importStr = `/models/${m}`;
        if (content.toLowerCase().includes(importStr)) {
          // Check exact casing
          const matchIndex = content.toLowerCase().indexOf(importStr);
          const actualSlice = content.slice(matchIndex, matchIndex + importStr.length);
          // The correct casing has capital letters: /models/User.js, /models/Document.js, etc.
          // Let's compare
          const correctModel = m.charAt(0).toUpperCase() + m.slice(1);
          const correctStr = `/models/${correctModel}`;
          if (actualSlice !== correctStr) {
            console.log(`🔴 CASE MISMATCH in: ${fullPath}`);
            console.log(`   Imported as: ${actualSlice}`);
            console.log(`   Should be:   ${correctStr}`);
          }
        }
      });
    }
  }
}

searchFiles(searchDir);
