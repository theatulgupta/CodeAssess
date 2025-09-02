// Student Database
const STUDENT_DATABASE = {
  "25MCSA01": "MOHIL DUBEY",
  "25MCSA02": "AABHAS MALPANI",
  "25MCSA03": "TEJA RISHITHA GANGAVARAM",
  "25MCSA04": "KUMARI ANU",
  "25MCSA05": "SOUGATA ROY",
  "25MCSA06": "KRISHNA MOHANTY",
  "25MCSA07": "HARSHIT SINGH",
  "25MCSA08": "PRASHANT GOSWAMI",
  "25MCSA09": "SOUVIK SARKAR",
  "25MCSA10": "RUBIN JAIN",
  "25MCSA11": "BHUSHAN NARESH GATHIBANDHE",
  "25MCSA12": "LALIT KUMAR",
  "25MCSA13": "DEVESH KUMAR VERMA",
  "25MCSA14": "SURYANSH JAISWAL",
  "25MCSA15": "POOJA PATIDAR",
  "25MCSA16": "MAYANK RAJ",
  "25MCSA17": "IKHLAS IMTIYAJ MANGURE",
  "25MCSA18": "ABHISHEK ANAND",
  "25MCSA19": "SHASHANK J SIROTHIYA",
  "25MCSA20": "SHEKHAR KUMAR",
  "25MCSA21": "MANISH RAMESHCHANDRA SAVKARE",
  "25MCSA22": "PAVAN MURTHY R",
  "25MCSA23": "ANKIT PAWAR",
  "25MCSA24": "HRITHIK VISHAL PAWAR",
  "25MCSA25": "EISLAVATH SRI SAI KIRAN",
  "25MCSS01": "ROHIT SHARMA",
  "25MCSS02": "RICHA VERMA",
  "25MCSS03": "AMIT KUMAR SINGH",
  "25MCSS04": "AVNI TRIVEDI",
  "25MCSS05": "HARSHIT JAIN",
  "25MCSS06": "ATUL KUMAR GUPTA",
  "25MCSS07": "ADARSH DUBEY",
  "25MCSS08": "SAI PAVANI BOORNA",
  "25MCSS09": "SAI KANDREGULA",
  "25MCSS10": "ABHISHEK ASHOK TERANI",
  "25MCSS11": "MANIDEEPAK TOONAM",
  "25MCSS12": "ANKUSH PATEL",
  "25MCSS13": "GIRISH VASTRANE",
  "25MCSS14": "ANIKET RAJKUMAR BHUTANGE",
  "25MCSS15": "GOURAV CHOUHAN",
};

// MCQ Correct Answers
const MCQ_ANSWERS = {
  mcq1: "b",
  mcq2: "a", 
  mcq3: "b",
  mcq4: "b",
  mcq5: "b",
};

// Test Cases
const TEST_CASES = {
  1: [
    { input: [7, 4, 8, 2, 9], expected: "3", points: 7 },
    { input: [1, 2, 3, 4, 5], expected: "5", points: 7 },
    { input: [5, 4, 3, 2, 1], expected: "1", points: 6 },
    { input: [10, 10, 10, 10], expected: "1", points: 7 },
    { input: [3, 1, 4, 2, 5, 9, 7], expected: "4", points: 6 },
  ],
  2: [
    { input: [[0,1,0],[1,1,0],[1,1,1]], expected: "3", points: 7 },
    { input: [[0,0,0],[0,0,0],[0,0,0]], expected: "1", points: 7 },
    { input: [[1,0],[1,1],[0,1]], expected: "2", points: 6 },
    { input: [[1,1,1],[1,0,0],[0,1,0]], expected: "1", points: 7 },
    { input: [[0,1],[0,1],[1,1]], expected: "3", points: 6 },
  ],
  3: [
    { input: [4,5,0,1,9,0,5,0], expected: "4 5 1 9 5 0 0 0", points: 7 },
    { input: [0,0,0,0], expected: "0 0 0 0", points: 7 },
    { input: [1,2,3,4], expected: "1 2 3 4", points: 7 },
    { input: [0,1,0,2,0,3,0,4], expected: "1 2 3 4 0 0 0 0", points: 6 },
    { input: [5], expected: "5", points: 7 },
  ],
};

module.exports = {
  STUDENT_DATABASE,
  MCQ_ANSWERS,
  TEST_CASES,
};