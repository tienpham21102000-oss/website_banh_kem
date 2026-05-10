@echo off
echo ==========================================
echo    KHOI DONG DU AN WEBSITE BANH KEM
echo ==========================================
echo.

echo [1/2] Dang khoi dong Backend...
start cmd /k "cd backend && npm run dev"

echo [2/2] Dang khoi dong Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo  THANH CONG! 
echo  Hay cho giay lat de cac cua so Terminal chay xong.
echo  Sau do mo trinh duyet vao: http://localhost:3000
echo ==========================================
pause
