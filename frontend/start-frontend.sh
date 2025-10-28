#!/bin/bash

echo "🚀 Starting SchedEase Frontend Development Server..."
echo ""
echo "📁 Current directory: $(pwd)"
echo "📦 Installing dependencies..."

# Install dependencies
npm install

echo ""
echo "🎨 Starting development server on port 3000..."
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔄 Backend should be running on: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev