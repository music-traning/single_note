const fs = require('fs');
let content = fs.readFileSync('src/data/strategists.ts', 'utf8');
content = content.replace(/skillDesc: (.*?)(\n\s*},|\n\s*synergyStageId: .*?\n\s*},)/gs, (match, p1, p2) => {
  if (match.includes('unlockHint')) return match;
  if (p2.includes('synergyStageId')) {
    return match.replace(/synergyStageId: (.*?)\n\s*},/, "synergyStageId: $1,\n    unlockHint: '未知の条件をクリア'\n  },");
  } else {
    return `skillDesc: ${p1},\n    unlockHint: '未知の条件をクリア'${p2}`;
  }
});
fs.writeFileSync('src/data/strategists.ts', content);
