const fs = require('fs');

const code = fs.readFileSync('scripts/readable_player_logic.js', 'utf8');

function printFunc(name) {
  const idx = code.indexOf(`function ${name}(`);
  if (idx !== -1) {
    console.log(`\n\n==================== ${name} ====================`);
    console.log(code.substring(idx, idx + 2500));
  }
}

printFunc('ofWq');
printFunc('Aoor');
printFunc('cKes');
printFunc('AANp');
printFunc('kopp');
