**Tunsta Social Club – lokalt medlemsregister**  
En liten webbapp på svenska för att registrera, söka och ta bort poster. Appen körs endast lokalt och lagrar poster i `data.csv` i projektmappen. Loggan används direkt från `tsc_logga.png` och filen flyttas eller byter inte namn.  
**Krav**  
- Python 3.9 eller senare  
- pip (ingår vanligtvis med Python)  
**Starta appen**  
Dubbelklicka på startfilen för ditt operativsystem i projektmappen:  
- **macOS:** `starta_mac.command`  
- **Windows:** `starta_windows.bat`  
Första gången skapar startfilen en lokal Python-miljö och installerar Flask (internetanslutning behövs då). Startfilen öppnar sedan appen i webbläsaren. Låt terminalfönstret vara öppet medan du använder appen och stoppa servern med `Ctrl+C`.  
Om Linux inte låter dig köra filen, öppna terminalen i projektmappen och kör `chmod +x starta_linux.sh` en gång. På macOS kan det behövas att du högerklickar på filen och väljer **Öppna** första gången.  
**Starta manuellt (alternativ)**  
Öppna en terminal i projektmappen, alltså mappen som innehåller `app.py`   
**Linux eller macOS**  
```  
 apt install python3.12-venv (Linux)
 python3 -m venv .venv  
 source .venv/bin/activate  
 python -m pip install -r requirements.txt  
 python app.py  
   
```  
**Windows (PowerShell)**  
```  
py -m venv .venv  
 .venv\Scripts\Activate.ps1  
 python -m pip install -r requirements.txt  
 python app.py  
   
```  
Om PowerShell hindrar aktivering kan du i stället köra installations- och startkommandona med `\.venv\Scripts\python.exe`, till exempel `\.venv\Scripts\python.exe -m pip install -r requirements.txt` och `\.venv\Scripts\python.exe app.py`.  
Öppna sedan **http://127.0.0.1:5000** i webbläsaren. Servern lyssnar bara på den lokala datorn. Stoppa den med `Ctrl+C` i terminalen.  
Vid första sparandet skapas `data.csv` med rubrikerna `Namn`, `E-post`, `Betalat` och `Datum och tid`. Nya poster läggs till sist. Ta bort kräver bekräftelse och uppdaterar CSV-filen med övriga poster kvar.  
