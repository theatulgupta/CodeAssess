# 🚀 Load-Balanced Compiler System

## Overview
The CodeAssess platform now features a distributed compilation system that can handle 40+ concurrent students without "too many runs" errors.

## Architecture

### Compiler Pool
- **Multiple Worker Threads**: 4-8 compiler workers (based on CPU cores)
- **Load Balancing**: Requests distributed across available workers
- **Queue Management**: Automatic queuing when all workers are busy
- **Fault Tolerance**: Auto-restart failed workers

### Key Components

#### 1. CompilerPool (`src/services/compilerPool.js`)
- Manages multiple compiler worker threads
- Distributes compilation jobs across workers
- Provides statistics and monitoring
- Handles worker lifecycle management

#### 2. CompilerWorker (`src/services/compilerWorker.js`)
- Isolated compilation environment
- Handles individual C++ compilation and execution
- Returns results to main thread
- Automatic cleanup of temporary files

## Performance Improvements

### Before (Single-threaded)
- ❌ Max 5 concurrent compilations
- ❌ Queue bottleneck with 40 students
- ❌ "Too many runs" errors
- ❌ Sequential processing

### After (Load-balanced)
- ✅ 4-8 concurrent compilations per worker
- ✅ 32-64 total concurrent compilations
- ✅ No "too many runs" errors
- ✅ Parallel processing across workers

## Configuration

### Pool Size
```javascript
// Automatically configured based on CPU cores
const poolSize = Math.max(4, Math.min(os.cpus().length, 8));
```

### Rate Limits (Updated)
- Test runs: 15 per minute (increased from 10)
- Submissions: 5 per minute (increased from 3)

## Monitoring

### Compiler Status Endpoint
```bash
GET /api/compiler-status
```

Returns:
```json
{
  "poolSize": 8,
  "queueLength": 2,
  "activeJobs": 6,
  "workers": [
    {
      "id": 0,
      "busy": true,
      "jobs": 45,
      "errors": 1,
      "avgTime": 1250
    }
  ]
}
```

### NPM Script
```bash
npm run compiler-status
```

## Usage

### Starting the Server
```bash
npm run dev    # Development with load balancing
npm start      # Production with clustering + load balancing
```

### Testing Load Capacity
1. Start server: `npm run dev`
2. Check status: `npm run compiler-status`
3. Monitor worker distribution during high load

## Benefits for 40-Student Class

1. **Concurrent Capacity**: 32-64 simultaneous compilations
2. **No Queue Bottlenecks**: Distributed processing
3. **Better Response Times**: Parallel execution
4. **Fault Tolerance**: Worker auto-restart
5. **Resource Optimization**: CPU core utilization

## Technical Details

### Worker Thread Communication
- Jobs sent via `postMessage()`
- Results returned with job ID tracking
- Timeout handling (30 seconds)
- Error propagation and handling

### Load Distribution
- Round-robin worker selection
- Busy worker detection
- Automatic queue processing
- Job completion callbacks

### Memory Management
- Isolated worker processes
- Automatic file cleanup
- Memory-efficient compilation
- Resource pooling

## Troubleshooting

### High Load Issues
1. Check worker status: `GET /api/compiler-status`
2. Monitor queue length
3. Verify worker health
4. Check system resources

### Worker Failures
- Workers auto-restart on failure
- Jobs automatically redistributed
- Error logging for debugging
- Graceful degradation

## Future Enhancements

1. **Dynamic Scaling**: Add/remove workers based on load
2. **Redis Queue**: Distributed queue for multiple servers
3. **Docker Containers**: Isolated compilation environments
4. **Metrics Dashboard**: Real-time monitoring UI
5. **Load Prediction**: ML-based capacity planning