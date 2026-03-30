import fs from 'fs';

let text = fs.readFileSync('src/components/fs/FSVoucherEntry.tsx', 'utf8');

// Replace the message rendering block
text = text.replace(/\{\/\* Status message \*\/\}\s*\{message && \(\s*<div style=\{\{[\s\S]*?\}\}\>\s*\{message\}\s*<\/div>\s*\)\}/, '');

fs.writeFileSync('src/components/fs/FSVoucherEntry.tsx', text);

console.log("Fix completed successfully!");
