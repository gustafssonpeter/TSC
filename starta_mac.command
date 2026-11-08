#!/bin/bash
set -e

cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 hittades inte. Installera Python 3 och försök igen."
  read -r -p "Tryck Enter för att stänga..."
  exit 1
fi

if [ ! -x ".venv/bin/python" ]; then
  echo "Förbereder appen första gången..."
  python3 -m venv .venv
  .venv/bin/python -m pip install -r requirements.txt
fi

(.venv/bin/python -c 'import time, webbrowser; time.sleep(1.5); webbrowser.open("http://127.0.0.1:5000")' >/dev/null 2>&1) &
.venv/bin/python app.py
