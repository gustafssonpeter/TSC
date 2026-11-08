@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Forbereder appen for forsta gangen...
    where py >nul 2>nul
    if not errorlevel 1 (
        py -3 -m venv .venv
    ) else (
        where python >nul 2>nul
        if errorlevel 1 (
            echo Python 3 hittades inte. Installera Python 3 och forsok igen.
            pause
            exit /b 1
        )
        python -m venv .venv
    )
    if errorlevel 1 (
        echo Kunde inte skapa Python-miljon.
        pause
        exit /b 1
    )
    .venv\Scripts\python.exe -m pip install -r requirements.txt
    if errorlevel 1 (
        echo Kunde inte installera Flask. Kontrollera internetanslutningen.
        pause
        exit /b 1
    )
)

start "" http://127.0.0.1:5000
.venv\Scripts\python.exe app.py
if errorlevel 1 pause
