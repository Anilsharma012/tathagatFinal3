#!/bin/bash

cd /home/runner/workspace

# Start backend in background
echo "Starting backend on port 3001..."
cd /home/runner/workspace/backend1 
NODE_ENV=development SKIP_SEED=1 PORT=3001 node index.js 2>&1 | sed 's/^/[BACKEND] /' &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Start frontend  
cd /home/runner/workspace/Frontend1
echo "Starting frontend on port 5000..."
export PORT=5000
export DANGEROUSLY_DISABLE_HOST_CHECK=true
export WDS_SOCKET_PORT=0
export NODE_OPTIONS="--max-old-space-size=1024"
export GENERATE_SOURCEMAP=false
export TSC_COMPILE_ON_ERROR=true
export ESLINT_NO_DEV_ERRORS=true
export BROWSER=none
exec npm start
