@echo off
cd /d "%~dp0"
javac AnalyticsServer.java
if %errorlevel% neq 0 (
  echo Compile failed
  pause
  exit /b
)
java AnalyticsServer
pause