# 🏗️ CodeAssess Architecture

## 📁 Modular Structure

```
CodeAssess/
├── 📄 server.js              # Original monolithic server
├── 🔧 server-modular.js      # New modular server entry point
├── 🎨 index.html             # Student exam interface
├── 👨💼 admin.html             # Admin dashboard
├── 🗃️ database.js            # Database operations
├── 📦 package.json           # Dependencies and scripts
└── 📁 src/                   # Modular source code
    ├── 🎯 app.js             # Express app configuration
    ├── 📋 config/
    │   └── constants.js      # Static data (students, test cases)
    ├── 🎮 controllers/
    │   ├── examController.js # Exam submission logic
    │   └── adminController.js# Admin panel logic
    ├── 🛡️ middleware/
    │   ├── auth.js           # Authentication middleware
    │   └── rateLimiter.js    # Rate limiting middleware
    ├── 🛣️ routes/
    │   ├── examRoutes.js     # Exam API routes
    │   └── adminRoutes.js    # Admin API routes
    ├── ⚙️ services/
    │   └── gradingService.js # Auto-grading logic
    └── 🔧 utils/
        └── codeUtils.js      # C++ code utilities
```

## 🚀 Running the Application

### Original Monolithic Version
```bash
npm start          # Production
npm run dev        # Development with nodemon
```

### New Modular Version
```bash
npm run start:modular    # Production (modular)
npm run dev:modular      # Development (modular)
```

## 📋 Module Responsibilities

### 🎯 **app.js** - Express Application
- Middleware configuration
- Route mounting
- Static file serving
- CORS setup

### 📋 **config/constants.js** - Static Data
- Student database
- MCQ answers
- Test cases for all questions

### 🎮 **controllers/** - Business Logic
- **examController.js**: Handles exam submissions, checking, and testing
- **adminController.js**: Manages admin operations (view, delete results)

### 🛡️ **middleware/** - Request Processing
- **auth.js**: Basic HTTP authentication for admin
- **rateLimiter.js**: Rate limiting for different endpoints

### 🛣️ **routes/** - API Endpoints
- **examRoutes.js**: `/api/submit`, `/api/check-submission`, `/api/test-code`
- **adminRoutes.js**: `/api/results`, `/api/results/clear`, `/api/results/:id`

### ⚙️ **services/** - Core Services
- **gradingService.js**: Auto-grading engine with queue management

### 🔧 **utils/** - Helper Functions
- **codeUtils.js**: C++ code processing, compilation, and evaluation

## 🔄 Migration Benefits

### ✅ **Maintainability**
- Separated concerns into logical modules
- Easier to locate and modify specific functionality
- Clear dependency structure

### ✅ **Scalability**
- Individual modules can be optimized independently
- Easy to add new features without affecting existing code
- Better testing capabilities

### ✅ **Readability**
- Smaller, focused files
- Clear naming conventions
- Logical organization

### ✅ **Backwards Compatibility**
- Original `server.js` still works
- Gradual migration possible
- No functionality changes

## 🎯 Key Features Preserved

- ✅ Real C++ compilation and grading
- ✅ High-load optimization with clustering
- ✅ Admin authentication
- ✅ Rate limiting and security
- ✅ Richa's special features
- ✅ All UI functionality intact
- ✅ Database operations unchanged

## 🔧 Development Workflow

1. **Add new features** in appropriate modules
2. **Modify constants** in `config/constants.js`
3. **Add new routes** in `routes/` directory
4. **Implement logic** in `controllers/`
5. **Add utilities** in `utils/` directory

The modular structure makes the codebase more professional and maintainable while preserving all existing functionality!