#!/bin/bash
echo "Starting EduGrade application..."

# Start backend server in a new terminal window
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS terminal
  osascript -e 'tell app "Terminal" to do script "cd \"$(pwd)/api\" && node server.js"'
else
  # Linux terminal
  gnome-terminal -- bash -c "cd \"$(pwd)/api\" && node server.js; exec bash" 2>/dev/null || \
  xterm -e "cd \"$(pwd)/api\" && node server.js" 2>/dev/null || \
  konsole --noclose -e "cd \"$(pwd)/api\" && node server.js" 2>/dev/null || \
  echo "Could not open a terminal window for the backend. Please run the backend server manually: cd api && node server.js"
fi

# Start frontend server in a new terminal window
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS terminal
  osascript -e 'tell app "Terminal" to do script "cd \"$(pwd)\" && npm start"'
else
  # Linux terminal
  gnome-terminal -- bash -c "cd \"$(pwd)\" && npm start; exec bash" 2>/dev/null || \
  xterm -e "cd \"$(pwd)\" && npm start" 2>/dev/null || \
  konsole --noclose -e "cd \"$(pwd)\" && npm start" 2>/dev/null || \
  echo "Could not open a terminal window for the frontend. Please run the frontend server manually: npm start"
fi

echo "EduGrade servers are starting..."
echo "Frontend: http://localhost:5000"
echo "Backend: http://localhost:5001"
echo ""
echo "NOTE: If terminal windows did not open automatically, please run these commands manually:"
echo "  Backend: cd api && node server.js"
echo "  Frontend: npm start" 