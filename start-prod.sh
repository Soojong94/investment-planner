#!/bin/bash
echo "🚀 Starting Investment Program in PRODUCTION mode..."
echo "📝 Setting NODE_ENV=production"
export NODE_ENV=production
echo "🔇 Console logs will be minimized"
echo "🌐 Starting server..."
node server.js
