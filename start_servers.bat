@echo off
echo ===================================================
echo Starting Agentiz Society Servers...
echo ===================================================

echo Starting Backend API (FastAPI)...
start "Agentiz Backend" cmd /k ".\venv\Scripts\activate && python -m uvicorn backend.main:app --reload"

echo Starting Frontend UI (Vite)...
cd frontend
start "Agentiz Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting up in separate windows!
echo You can close this window now.
exit
