@echo off
setlocal
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0name_tag_generator.py"
) else (
  python "%~dp0name_tag_generator.py"
)
if errorlevel 1 pause
endlocal
