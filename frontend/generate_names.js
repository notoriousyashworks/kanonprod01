const fs = require('fs');

const maleFirstNames = [
  "Aarav", "Vihaan", "Vivaan", "Aditya", "Arjun", "Siddharth", "Reyansh", "Ayaan", "Krishna", 
  "Ishaan", "Shaurya", "Atharva", "Ayan", "Yash", "Rohan", "Rahul", "Amit", "Manish", "Kunal", 
  "Rohit", "Neeraj", "Vikas", "Saurabh", "Murtuza", "Raj", "Vikram", "Kabir", "Rishi", "Aryan", "Pranav",
  "Dev", "Ravi", "Anand", "Akash", "Anil", "Sunil", "Sanjay", "Vinay", "Vijay", "Prakash"
];

const femaleFirstNames = [
  "Priya", "Sneha", "Neha", "Riya", "Anjali", "Pooja", "Shruti", "Swati", "Kavya", "Ishita", 
  "Pallavi", "Aanya", "Diya", "Nidhi", "Aditi", "Meera", "Tara", "Roshni", "Ritu", "Nandini",
  "Kiran", "Simran", "Preeti", "Sonia", "Kareena", "Katrina", "Priyanka", "Deepika", "Anushka", "Alia"
];

const lastNames = [
  "Sharma", "Patel", "Singh", "Kumar", "Reddy", "Verma", "Gupta", "Rao", "Desai", "Jain", 
  "Joshi", "Mishra", "Bansal", "Mehta", "Nair", "Choudhury", "Tiwari", "Agarwal", "Bhatia", "Pandey", 
  "Yadav", "Chauhan", "Hussain", "Kapoor", "Malhotra", "Das", "Sen", "Bose", "Chatterjee", "Roy",
  "Iyer", "Pillai", "Bhattacharya", "Sinha", "Ahuja"
];

// Shuffle array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const allMen = [];
maleFirstNames.forEach(f => {
  lastNames.forEach(l => {
    allMen.push(`${f} ${l}`);
  });
});

const allWomen = [];
femaleFirstNames.forEach(f => {
  lastNames.forEach(l => {
    allWomen.push(`${f} ${l}`);
  });
});

shuffle(allMen);
shuffle(allWomen);

const selectedMen = allMen.slice(0, 750);
const selectedWomen = allWomen.slice(0, 250);

const uiJsPath = '/Users/yash/Desktop/kicksaura/frontend/src/js/ui.js';
let content = fs.readFileSync(uiJsPath, 'utf8');

const menRegex = /const INDIAN_NAMES_BOYS = \[\s*.*?\s*\];/s;
const womenRegex = /const INDIAN_NAMES_GIRLS = \[\s*.*?\s*\];/s;

content = content.replace(menRegex, `const INDIAN_NAMES_BOYS = ${JSON.stringify(selectedMen)};`);
content = content.replace(womenRegex, `const INDIAN_NAMES_GIRLS = ${JSON.stringify(selectedWomen)};`);

// Update getRandomName to use 75% for boys
content = content.replace(
  'const isBoy = Math.random() < 0.8;',
  'const isBoy = Math.random() < 0.75;'
);

fs.writeFileSync(uiJsPath, content);
console.log('Updated ui.js with 750 men and 250 women.');
