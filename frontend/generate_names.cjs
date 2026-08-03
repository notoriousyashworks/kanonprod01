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

console.log(JSON.stringify(selectedMen));
console.log("----SEP----");
console.log(JSON.stringify(selectedWomen));
