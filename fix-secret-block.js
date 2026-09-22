const fs = require('fs');
const path = 'index.html';
let c = fs.readFileSync(path, 'utf8');

// Find the secret-message click handler and normalise it to a single, clean block.
const start = c.indexOf("revealSecretBtn.addEventListener('click', () => {");
if (start === -1) {
  console.log('NOT FOUND: handler start');
  process.exit(1);
}

const endMarker = '        // --- MEMORY PHOTO UPLOAD ---';
const end = c.indexOf(endMarker, start);
if (end === -1) {
  console.log('NOT FOUND: handler end');
  process.exit(1);
}

const clean = `revealSecretBtn.addEventListener('click', () => {
            const isRevealed = secretMessage.classList.toggle('is-revealed');
            revealSecretBtn.textContent = isRevealed ? '💙 Pesan Sudah Terbuka' : '🔒 Buka Pesan Rahasia';
            revealSecretBtn.setAttribute('aria-expanded', String(isRevealed));
            if (isRevealed) {
                launchConfetti();
            }
        });

`;

c = c.slice(0, start) + clean + c.slice(end);
fs.writeFileSync(path, c, 'utf8');
console.log('CLEANED secret-message handler');
