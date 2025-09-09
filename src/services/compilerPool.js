const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

class CompilerPool {
  constructor(poolSize = Math.max(4, Math.min(os.cpus().length, 8))) {
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.activeJobs = new Map();
    this.workerStats = new Map();
    
    this.initializeWorkers();
    console.log(`🔧 Compiler pool initialized with ${poolSize} workers`);
  }

  initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      this.createWorker(i);
    }
  }

  createWorker(id) {
    const worker = new Worker(path.join(__dirname, 'compilerWorker.js'));
    
    worker.workerId = id;
    worker.isBusy = false;
    worker.jobCount = 0;
    
    this.workerStats.set(id, { jobs: 0, errors: 0, avgTime: 0 });
    
    worker.on('message', (result) => {
      const { jobId, success, data, error, processingTime } = result;
      const job = this.activeJobs.get(jobId);
      
      if (job) {
        worker.isBusy = false;
        worker.jobCount++;
        
        // Update stats
        const stats = this.workerStats.get(id);
        stats.jobs++;
        if (!success) stats.errors++;
        stats.avgTime = ((stats.avgTime * (stats.jobs - 1)) + processingTime) / stats.jobs;
        
        this.activeJobs.delete(jobId);
        
        if (success) {
          job.resolve(data);
        } else {
          job.reject(new Error(error));
        }
        
        this.processQueue();
      }
    });
    
    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error);
      this.restartWorker(id);
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${id} exited with code ${code}`);
        this.restartWorker(id);
      }
    });
    
    this.workers[id] = worker;
  }

  restartWorker(id) {
    if (this.workers[id]) {
      this.workers[id].terminate();
    }
    setTimeout(() => {
      this.createWorker(id);
      console.log(`🔄 Worker ${id} restarted`);
    }, 1000);
  }

  compile(qNum, code, studentName) {
    return new Promise((resolve, reject) => {
      const jobId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const job = { jobId, qNum, code, studentName, resolve, reject, timestamp: Date.now(), fullTests: true };
      
      this.queue.push(job);
      this.processQueue();
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.activeJobs.has(jobId)) {
          this.activeJobs.delete(jobId);
          reject(new Error('Compilation timeout'));
        }
      }, 30000);
    });
  }

  compileWithLimitedTests(qNum, code, studentName) {
    return new Promise((resolve, reject) => {
      const jobId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const job = { jobId, qNum, code, studentName, resolve, reject, timestamp: Date.now(), fullTests: false };
      
      this.queue.push(job);
      this.processQueue();
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.activeJobs.has(jobId)) {
          this.activeJobs.delete(jobId);
          reject(new Error('Compilation timeout'));
        }
      }, 30000);
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.workers.find(w => w && !w.isBusy);
    if (!availableWorker) return;
    
    const job = this.queue.shift();
    availableWorker.isBusy = true;
    this.activeJobs.set(job.jobId, job);
    
    availableWorker.postMessage({
      jobId: job.jobId,
      qNum: job.qNum,
      code: job.code,
      studentName: job.studentName,
      fullTests: job.fullTests
    });
  }

  getStats() {
    return {
      poolSize: this.poolSize,
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      workers: Array.from(this.workerStats.entries()).map(([id, stats]) => ({
        id,
        busy: this.workers[id]?.isBusy || false,
        ...stats
      }))
    };
  }

  shutdown() {
    this.workers.forEach(worker => {
      if (worker) worker.terminate();
    });
  }
}

module.exports = CompilerPool;