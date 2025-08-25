# 🎓 CodeAssess - Automated Coding Assessment Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

*A modern, full-featured automated coding assessment system with real-time grading and beautiful UI*

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🔐 **Advanced Authentication System**
- **Roll Number Validation**: Secure student verification with predefined roll numbers
- **One-Time Submission**: Prevents multiple submissions per student
- **Session Management**: Automatic session handling with backup recovery

### 🤖 **Intelligent Auto-Grading**
- **Real-time Compilation**: Automatic C++ code compilation and execution
- **Test Case Validation**: Comprehensive test case evaluation with detailed feedback
- **MCQ Assessment**: Multiple choice questions with instant scoring
- **Partial Credit**: Fair scoring system with partial points for test cases

### 🎨 **Modern User Interface**
- **Glassmorphism Design**: Beautiful, modern UI with gradient backgrounds
- **Responsive Layout**: Mobile-friendly design that works on all devices
- **Syntax Highlighting**: Code editor with syntax highlighting using Prism.js
- **Real-time Feedback**: Instant validation and error messages

### 👨‍💼 **Admin Dashboard**
- **Results Management**: Comprehensive admin panel for viewing all submissions
- **Export Functionality**: Easy export of results for further analysis
- **Database Management**: Built-in tools for database operations
- **Real-time Monitoring**: Live view of student submissions

### 🛡️ **Security & Reliability**
- **Rate Limiting**: Protection against spam submissions
- **Input Validation**: Comprehensive server-side validation
- **Error Handling**: Robust error handling with user-friendly messages
- **Data Backup**: Automatic local backup system for submissions

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/theatulgupta/CodeAssess.git
cd CodeAssess
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Access the application**
- **Student Interface**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin.html`

## 📋 Available Commands

### 🔧 **Development & Server Management**
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

### 🗃️ **Database Management**
```bash
# Clear all exam results (with confirmation)
npm run clear-db

# Check database status and statistics
npm run db-status
```

## 🎯 Usage Workflow

### For Instructors/Admins

1. **🧹 Clear Previous Data**
   ```bash
   npm run clear-db
   ```

2. **🚀 Start the Server**
   ```bash
   npm run dev
   ```

3. **📊 Monitor Progress**
   - Visit `http://localhost:3000/admin.html`
   - View real-time submissions and results

4. **📈 Check Statistics**
   ```bash
   npm run db-status
   ```

### For Students

1. **🌐 Access the Exam**
   - Visit `http://localhost:3000`
   - Enter valid roll number (format: 25MCSXXX)

2. **✍️ Complete Assessment**
   - Solve coding problems in the provided editor
   - Answer multiple choice questions
   - Submit once completed

3. **📋 View Results**
   - Instant feedback on submission
   - Detailed breakdown of scores

## 📁 Project Structure

```
CodeAssess/
├── 📄 server.js              # Express.js server with auto-grading engine
├── 🎨 index.html             # Student assessment interface
├── 👨‍💼 admin.html             # Admin dashboard and results panel
├── 🗃️ database.js            # SQLite database operations
├── 📦 package.json           # Dependencies and npm scripts
├── 📖 README.md              # Project documentation
├── 🛠️ scripts/
│   ├── clear-database.js     # Database cleanup utility
│   └── database-status.js    # Database status checker
├── 🗂️ db/
│   └── coding_test.db        # SQLite database file
└── 📁 submissions/           # Temporary files for code compilation
```

## 🔧 Configuration

### Student Database
Students are pre-configured in `server.js`. To add/modify students:

```javascript
const students = {
  "25MCSA01": "Student Name",
  "25MCSA02": "Another Student",
  // Add more students...
};
```

### MCQ Questions
Multiple choice questions can be configured in `index.html`:

```javascript
const mcqQuestions = {
  mcq1: { question: "Your question here", options: [...], answer: "A" },
  // Add more questions...
};
```

## 🎨 Screenshots

### Student Interface
*Modern, responsive design with glassmorphism effects*

### Admin Dashboard
*Comprehensive results management with real-time updates*

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Code Highlighting**: Prism.js
- **Icons**: Font Awesome
- **Styling**: Modern CSS with Flexbox/Grid

## 🚦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submit` | Submit student answers for grading |
| GET | `/api/results` | Retrieve all exam results (admin) |
| DELETE | `/api/results/clear` | Clear all results (admin) |

## 🔐 Security Features

- **Input Sanitization**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevents spam and abuse
- **Session Control**: One submission per student
- **Error Handling**: Secure error messages without sensitive data exposure

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Atul Gupta**
- GitHub: [@theatulgupta](https://github.com/theatulgupta)
- LinkedIn: [Atul Gupta](https://linkedin.com/in/theatulgupta)

## 🙏 Acknowledgments

- Thanks to all contributors who helped make this project better
- Inspired by the need for efficient coding assessments in educational institutions
- Built with ❤️ for educators and students

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ by [Atul Gupta](https://github.com/theatulgupta)

</div>
