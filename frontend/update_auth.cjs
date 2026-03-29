const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace sessionStorage with localStorage globally
  content = content.replace(/sessionStorage/g, 'localStorage');
  
  // Replace Logout links
  // Looking for <a href="/login" ...>Logout</a>
  // Adding the onClick logic
  content = content.replace(/href="\/login"(.*?)>Logout<\/a>/g, 'href="/login" onClick={() => localStorage.clear()}>Logout</a>');
  
  fs.writeFileSync(filePath, content);
});

console.log('Updated all pages.');
