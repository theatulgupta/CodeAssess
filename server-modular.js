const cluster = require("cluster");
const os = require("os");
const fs = require("fs");
const app = require("./src/app");
const db = require("./database");

// Cluster setup for load handling
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Master process starting ${numCPUs} workers...`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
  
  return;
}

// Directory Setup
const submissionDir = "submissions";
try {
  if (!fs.existsSync(submissionDir)) fs.mkdirSync(submissionDir);
  if (!fs.existsSync("db")) fs.mkdirSync("db");
} catch (error) {
  // Directory might already exist, ignore the error
}

// Server Start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await db.getResults();
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, "0.0.0.0", () => {
      const workerId = cluster.worker ? cluster.worker.id : 'Master';
      console.log(`🚀 Worker ${workerId} running on port ${PORT}`);
      if (!cluster.worker) {
        console.log(`   Local:    http://localhost:${PORT}`);
        console.log(`   Network:  http://0.0.0.0:${PORT}`);
        console.log(`   Status:   Ready for high-load submissions`);
      }
    });
    
    // Optimize server settings for high load
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.maxConnections = 1000;
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 Graceful shutdown initiated...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  }
}

startServer();