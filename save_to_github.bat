@echo off
chcp 65001 >nul
echo ===================================
echo   Сохраняем изменения на GitHub...
echo ===================================
echo.

cd /d C:\Users\dasha\alienedu

git add .
git commit -m "Обновление проекта"
git push

echo.
echo ===================================
echo   Готово! Можно закрыть это окно.
echo ===================================
pause
