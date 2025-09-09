# 🚀 Deployment Guide

## Production Deployment

### Prerequisites
- Node.js v16+
- C++ compiler (g++)
- 4GB+ RAM recommended
- 2+ CPU cores

### Environment Setup
```bash
# Clone and setup
git clone https://github.com/theatulgupta/CodeAssess.git
cd CodeAssess
npm install --production

# Set environment variables
export NODE_ENV=production
export PORT=3000
```

### Production Start
```bash
# Start with clustering (recommended)
NODE_ENV=production npm start

# Or with PM2 (advanced)
npm install -g pm2
pm2 start server.js --name "codeassess" -i max
```

### Load Testing
```bash
# Test with 50 concurrent users
curl -X POST http://localhost:3000/api/test-code \
  -H "Content-Type: application/json" \
  -d '{"questionNumber":1,"code":"test","studentName":"test"}'
```

### Monitoring
- Check compiler status: `npm run compiler-status`
- Database status: `npm run db-status`
- Server logs: `tail -f server.log`

### Security Checklist
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ Anti-cheating measures
- ✅ Session management
- ✅ Error handling

### Performance Tuning
- Adjust worker count in `compilerPool.js`
- Monitor memory usage
- Scale horizontally if needed
- Use reverse proxy (nginx) for production