const fs = require('fs');
const content = fs.readFileSync('/tmp/belts_list.json', 'utf8');
const lines = content.split('\n');
if (lines[0].includes('injected env')) lines.shift();
const data = JSON.parse(lines.join('\n'));

const corrections = {};

data.forEach(p => {
  let name = p.name;
  let original = name;

  // Fix underscores
  name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // Belt-specific spelling mistakes
  const replacements = [
    [/\bLv Loui Vuittion\b/ig, 'Louis Vuitton'],
    [/\bLv Vuittion\b/ig, 'Louis Vuitton'],
    [/\bLv Louis Vuitton\b/ig, 'Louis Vuitton'],
    [/\bLv Loui\b/ig, 'Louis Vuitton'],
    [/\bLOUII S VUITTON\b/ig, 'Louis Vuitton'],
    [/\bLouis Vuitton BELT LV\b/ig, 'Louis Vuitton Belt'],
    [/\bAx Arma\b/ig, 'AX Armani Exchange'],
    [/\bAx Arma Exchange\b/ig, 'AX Armani Exchange'],
    [/\bAx Armani Exchange\b/ig, 'AX Armani Exchange'],
    [/\bArma\b/ig, 'Armani'],
    [/\bCoaach\b/ig, 'Coach'],
    [/\bCoac\b/ig, 'Coach'],
    [/\bBURBERRRY\b/ig, 'Burberry'],
    [/\bBurber r\b/ig, 'Burberry'],
    [/\bHerme Paris\b/ig, 'Hermes Paris'],
    [/\bDIOOR\b/ig, 'Dior'],
    [/\bDiio r\b/ig, 'Dior'],
    [/\bLEVIIS\b/ig, 'Levis'],
    [/\bTomm y Hilgi\b/ig, 'Tommy Hilfiger'],
    [/\bTomm y Hilgif\b/ig, 'Tommy Hilfiger'],
    [/\bTOMMMY HILFIGER\b/ig, 'Tommy Hilfiger'],
    [/\bJagua\b/ig, 'Jaguar'],
    [/\bBalenciag\b/ig, 'Balenciaga'],
    [/\bVelentin\b/ig, 'Valentino'],
    [/\bCalviin Klein\b/ig, 'Calvin Klein'],
    [/\bCk Calvi\b/ig, 'CK Calvin Klein'],
    [/\bSalvatore feraaga\b/ig, 'Salvatore Ferragamo'],
    [/\bSalvator faragamo\b/ig, 'Salvatore Ferragamo'],
    [/\bSalvator faragam o\b/ig, 'Salvatore Ferragamo'],
    [/\bfaragamo\b/ig, 'Ferragamo'],
  ];

  for (const [regex, replacement] of replacements) {
    name = name.replace(regex, replacement);
  }
  
  // Specific fix for Armani to be formatted as requested
  name = name.replace(/Giorgio Armani/ig, 'Giorgio armani');

  if (name !== original) {
    corrections[p.id] = name;
  }
});

fs.writeFileSync('/tmp/generated_belt_corrections.json', JSON.stringify(corrections, null, 2));
console.log(`Generated ${Object.keys(corrections).length} corrections`);
