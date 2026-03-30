const fs = require('fs');
let c = fs.readFileSync('src/index.css', 'utf8');
c = c.replace(
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');",
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n"
);
fs.writeFileSync('src/index.css', c);
console.log('Successfully prepended tailwind rules');
