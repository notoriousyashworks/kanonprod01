const fs = require('fs');
const content = fs.readFileSync('/tmp/perfumes_list.json', 'utf8');
const lines = content.split('\n');
if (lines[0].includes('injected env')) lines.shift();
const data = JSON.parse(lines.join('\n'));

const corrections = {};

data.forEach(p => {
  let name = p.name;
  let original = name;

  // Fix underscores
  name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // Common spelling mistakes with case-insensitive replacement
  const replacements = [
    [/\bDio\b/ig, 'Dior'],
    [/\bHuugo Boss\b/ig, 'Hugo Boss'],
    [/\bHugo Boos\b/ig, 'Hugo Boss'],
    [/\bHugo Bos\b/ig, 'Hugo Boss'],
    [/\bHugo Bos S\b/ig, 'Hugo Boss'],
    [/\bHug Boss\b/ig, 'Hugo Boss'],
    [/\bHugoBossMan\b/ig, 'Hugo Boss Man'],
    [/\bLouiis Vuitton\b/ig, 'Louis Vuitton'],
    [/\bLoui Vuitton\b/ig, 'Louis Vuitton'],
    [/\bTomforrd\b/ig, 'Tom Ford'],
    [/\bTomfor\b/ig, 'Tom Ford'],
    [/\bTOM FORRD\b/ig, 'Tom Ford'],
    [/\bTOM FOR D\b/ig, 'Tom Ford'],
    [/\bD&G & Gabbana\b/ig, 'Dolce & Gabbana'],
    [/\bD&G Gabbana\b/ig, 'Dolce & Gabbana'],
    [/\bD&Gabbana\b/ig, 'Dolce & Gabbana'],
    [/\bDolc\s*&\s*Gabbana\b/ig, 'Dolce & Gabbana'],
    [/\bBurrberry\b/ig, 'Burberry'],
    [/\bGiorgio Arma\b/ig, 'Giorgio armani'],
    [/\bARMAANI\b/ig, 'Armani'],
    [/\bARMAI\b/ig, 'Armani'],
    [/\bARMA I\b/ig, 'Armani'],
    [/\bCalvin Klien\b/ig, 'Calvin Klein'],
    [/\bCalvi Klein\b/ig, 'Calvin Klein'],
    [/\bCALVIN KLEIIN\b/ig, 'Calvin Klein'],
    [/\bValentiino\b/ig, 'Valentino'],
    [/\bValentin Uomo\b/ig, 'Valentino Uomo'],
    [/\bGUCCCI\b/ig, 'Gucci'],
    [/\bGUCC I\b/ig, 'Gucci'],
    [/\bGucc\b/ig, 'Gucci'],
    [/\bCHANEEL\b/ig, 'Chanel'],
    [/\bCHANNEL\b/ig, 'Chanel'],
    [/\bchannel\b/ig, 'Chanel'],
    [/\bCHANE L\b/ig, 'Chanel'],
    [/\bPRADDA\b/ig, 'Prada'],
    [/\bPrad Paradigme\b/ig, 'Prada Paradigme'],
    [/\bELIE SAA B\b/ig, 'Elie Saab'],
    [/\bHERMEES\b/ig, 'Hermes']
  ];

  for (const [regex, replacement] of replacements) {
    name = name.replace(regex, replacement);
  }
  
  // Specific fix for Armani rule
  name = name.replace(/Giorgio Armani/ig, 'Giorgio armani');

  if (name !== original) {
    corrections[p.id] = name;
  }
});

fs.writeFileSync('/tmp/generated_corrections.json', JSON.stringify(corrections, null, 2));
console.log(`Generated ${Object.keys(corrections).length} corrections`);
