#!/bin/bash

echo "🚀 Starting C++ Coding Assessment Server..."

# Create necessary directories
mkdir -p submissions
mkdir -p results

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if g++ is installed
if ! command -v g++ &> /dev/null; then
    echo "❌ g++ compiler is not installed. Please install g++ first."
    echo "On macOS: xcode-select --install"
    echo "On Ubuntu: sudo apt-get install g++"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Server starting on http://localhost:3000"
echo "📊 Admin dashboard: http://localhost:3000/admin.html"
echo "📝 Student interface: http://localhost:3000/index.html"
echo ""
echo "Press Ctrl+C to stop the server"

node server.js
