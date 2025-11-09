@echo off
echo ========================================
echo Restaurant Management System - Frontend
echo ========================================
echo.

cd frontend

echo Checking for node_modules...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

echo.
echo ========================================
echo Starting React Development Server...
echo ========================================
echo.
echo Frontend will be available at: http://localhost:5173
echo.

call npm run dev
