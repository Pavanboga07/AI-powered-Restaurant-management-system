# Start Frontend Development Server Script
# Run this to start the frontend

Write-Host "Starting Restaurant Management System Frontend..." -ForegroundColor Cyan
Write-Host "Changing to frontend directory..." -ForegroundColor Yellow

Set-Location "c:\Users\91862\OneDrive\Desktop\zbc\frontend"

Write-Host "Starting Vite development server" -ForegroundColor Green
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Gray

npm run dev
