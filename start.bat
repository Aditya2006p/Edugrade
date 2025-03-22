@echo off
echo Starting EduGrade application...

echo Starting backend server...
start cmd /k "cd api && node server.js"

echo Starting frontend server...
start cmd /k "npm start"

echo EduGrade servers are starting...
echo Frontend: http://localhost:5000
echo Backend: http://localhost:5001
echo.
echo Press any key to exit this window. The servers will continue running.
pause > nul 