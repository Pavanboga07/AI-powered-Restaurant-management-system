# Start Backend Server Script
# Run this to start the backend server

Write-Host "Starting Restaurant Management System Backend..." -ForegroundColor Cyan
Write-Host "Changing to backend directory..." -ForegroundColor Yellow

Set-Location "c:\Users\91862\OneDrive\Desktop\zbc\backend"

Write-Host "Starting Uvicorn server on http://0.0.0.0:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "WebSocket: ws://localhost:8000/ws" -ForegroundColor Cyan
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Gray

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
