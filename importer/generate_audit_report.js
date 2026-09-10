const fs = require('fs');

const data = fs.readFileSync('new_watches.json', 'utf8');
// skip first line if it doesn't start with [
const lines = data.split('\n');
const jsonStr = lines[0].startsWith('[') ? lines.join('\n') : lines.slice(1).join('\n');
const watches = JSON.parse(jsonStr);

const grouped = {};
for (const w of watches) {
    if (!grouped[w.originalName]) grouped[w.originalName] = [];
    grouped[w.originalName].push(w.id);
}

let report = `# New Watches Audit Plan\n\n`;
report += `This plan covers the 200 newly imported watches. We will update their **display names** and search fields without touching their \`originalName\`. Below are the proposed naming corrections.\n\n`;
report += `| Count | Original Name | Proposed Clean Name | Notes |\n`;
report += `|---|---|---|---|\n`;

for (const [name, ids] of Object.entries(grouped)) {
    // Generate a proposed name (basic mockup for the LLM to refine)
    report += `| ${ids.length} | \`${name}\` | \`FILL_IN\` | |\n`;
}

fs.writeFileSync('audit_plan_temp.md', report);
console.log('Generated audit_plan_temp.md');
