const fs = require('fs');
const content = fs.readFileSync('/tmp/perfumes_list.json', 'utf8');
const lines = content.split('\n');
if (lines[0].includes('injected env')) lines.shift();
const data = JSON.parse(lines.join('\n'));
data.forEach(p => console.log(p.id + ' | ' + p.name));
