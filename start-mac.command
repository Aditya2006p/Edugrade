#!/bin/bash

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Function to start a process in a new Terminal window
function start_in_terminal() {
  osascript -e "tell application \"Terminal\"
    do script \"cd \\\"$DIR$1\\\" && $2\"
    set position of front window to {$3, $4}
    set custom title of front window to \"$5\"
  end tell"
}

# Echo colorful start message
echo -e "\033[1;32m*******************************\033[0m"
echo -e "\033[1;32m* Starting EduGrade Application *\033[0m"
echo -e "\033[1;32m*******************************\033[0m"

# Start backend server in a new Terminal window
start_in_terminal "/api" "node server.js" 50 50 "EduGrade Backend"

# Wait a moment for backend to start
sleep 2

# Start frontend server in a new Terminal window
start_in_terminal "" "npm start" 600 50 "EduGrade Frontend"

# Open the application in browser after a short delay
sleep 5
open http://localhost:5000

echo "EduGrade application started!"
echo "Frontend: http://localhost:5000"
echo "Backend: http://localhost:5001"
echo ""
echo "You can close this window, the servers will continue running in their own Terminal windows." 