#!/usr/bin/env pwsh
# Bánh Kem Online - Quick Setup Script

Write-Host "🎂 Bánh Kem Online - Project Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if (-not $nodeVersion) {
    Write-Host "❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
Write-Host ""

# Check if dependencies installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Setup complete! Starting servers..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  NOTE: Make sure you have setup your .env files first!" -ForegroundColor Yellow
Write-Host "   See SETUP_GUIDE.md for detailed instructions." -ForegroundColor Yellow
Write-Host ""

# Ask user what to run
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run Frontend only (port 3000)"
Write-Host "2. Run Backend only (port 5000)" 
Write-Host "3. Run Both (requires 2 terminal windows)"
Write-Host "4. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Starting Frontend on http://localhost:3000" -ForegroundColor Green
        Set-Location frontend
        npm run dev
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Starting Backend on http://localhost:5000" -ForegroundColor Green
        Set-Location backend
        npm run dev
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 Starting Both servers..." -ForegroundColor Green
        Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Green
        Write-Host "   Backend: http://localhost:5000" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Please run this command in ANOTHER terminal for the backend:" -ForegroundColor Yellow
        Write-Host "   cd backend && npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "   Or start separate terminals before running this script." -ForegroundColor Yellow
        Write-Host ""
        Set-Location frontend
        npm run dev
    }
    "4" {
        Write-Host "Goodbye! 👋" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}
