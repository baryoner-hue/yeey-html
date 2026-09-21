const fs = require('fs');
const path = 'index.html';
let c = fs.readFileSync(path, 'utf8');

const bad = "confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 });";
const good = "confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 });}";

if (!c.includes(bad)) {
  console.log('NOT FOUND');
  process.exit(1);
}
c = c.replace(bad, good);
fs.writeFileSync(path, c, 'utf8');
console.log('FIXED ->', good);
