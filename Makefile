.PHONY: start start-backend start-frontend stop restart install

# Start both servers
start: start-backend start-frontend
	@echo "EduGrade application started"
	@echo "Frontend: http://localhost:5000"
	@echo "Backend: http://localhost:5001"

# Start the backend server
start-backend:
	@echo "Starting backend server..."
	@cd api && node server.js &

# Start the frontend server
start-frontend:
	@echo "Starting frontend server..."
	@npm start &

# Stop both servers
stop:
	@echo "Stopping EduGrade servers..."
	@-pkill -f "node server.js" 2>/dev/null || true
	@-pkill -f "react-scripts start" 2>/dev/null || true
	@echo "Servers stopped"

# Restart both servers
restart: stop start
	@echo "EduGrade application restarted"

# Install dependencies
install:
	@echo "Installing dependencies..."
	@npm install
	@echo "Dependencies installed successfully"

# Help command
help:
	@echo "EduGrade Makefile commands:"
	@echo "  make start          - Start both frontend and backend servers"
	@echo "  make start-backend  - Start only the backend server"
	@echo "  make start-frontend - Start only the frontend server"
	@echo "  make stop           - Stop all servers"
	@echo "  make restart        - Restart all servers"
	@echo "  make install        - Install project dependencies" 