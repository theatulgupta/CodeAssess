const express = require("express");
const path = require("path");
const { limiter } = require("./middleware/rateLimiter");
const { adminAuth } = require("./middleware/auth");
const examRoutes = require("./routes/examRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(limiter);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Performance optimizations
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Connection pooling and keep-alive
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

// Routes
app.use("/api", examRoutes);
app.use("/api", adminRoutes);

// Serve admin.html with authentication
app.get('/admin.html', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

// Serve other static files normally
app.use(express.static(path.join(__dirname, '..'), {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('admin.html')) {
      res.status(404).end();
    }
  }
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

module.exports = app;