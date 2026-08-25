@echo off
rem ============================================================
rem  Franklin Blog 后台管理一键启动
rem  启动后访问 http://localhost:3001/admin （密码 admin123）
rem  关闭本窗口即停止后台服务
rem ============================================================
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 node，请先安装 Node.js
  pause
  exit /b 1
)

set ADMIN_PASSWORD=admin123
set SITE_URL=http://localhost:3001

echo.
echo  ============================================
echo   Franklin Blog Admin Server
echo   地址:  http://localhost:3001/admin
echo   密码:  admin123
echo   按 Ctrl+C 或关闭窗口停止服务
echo  ============================================
echo.

node server.mjs
pause
