"""Lokal Flask-app för att registrera och söka bland poster i data.csv."""

import csv
import os
import threading
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file


BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "data.csv"
CSV_HEADERS = ["Namn", "E-post", "Betalat", "Datum och tid"]
csv_lock = threading.Lock()

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True


def read_rows():
    """Returnera CSV-rader i samma ordning som de lagrats."""
    if not CSV_PATH.exists() or CSV_PATH.stat().st_size == 0:
        return []

    with CSV_PATH.open("r", newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        if reader.fieldnames != CSV_HEADERS:
            raise ValueError("CSV-filen har inte de förväntade rubrikerna.")
        return [
            {header: row.get(header, "") or "" for header in CSV_HEADERS}
            for row in reader
        ]


def ensure_csv_exists():
    """Skapa CSV-filen med rubriker om den saknas eller är tom."""
    if not CSV_PATH.exists() or CSV_PATH.stat().st_size == 0:
        with CSV_PATH.open("w", newline="", encoding="utf-8") as csv_file:
            csv.writer(csv_file).writerow(CSV_HEADERS)


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/tsc_logga.png")
def logo():
    # Loggan stannar i projektmappen med sitt befintliga filnamn.
    return send_file(BASE_DIR / "tsc_logga.png", mimetype="image/png")


@app.get("/swish-QR-small.png")
def swish_qr():
    return send_file(BASE_DIR / "swish-QR-small.png", mimetype="image/png")


@app.get("/api/poster")
def get_entries():
    try:
        with csv_lock:
            rows = read_rows()
        return jsonify(
            [dict(row, id=index) for index, row in enumerate(rows)]
        )
    except (OSError, UnicodeError, csv.Error, ValueError) as error:
        return jsonify({"error": str(error)}), 400


@app.post("/api/poster")
def add_entry():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    paid = data.get("paid")

    if not name or not email:
        return jsonify({"error": "Fyll i både namn och e-post."}), 400
    if not isinstance(paid, bool):
        return jsonify({"error": "Betalat måste vara true eller false."}), 400

    row = [name, email, "true" if paid else "false", datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S")]
    try:
        with csv_lock:
            ensure_csv_exists()
            # Kontrollera rubrikerna innan en befintlig fil ändras.
            existing_rows = read_rows()
            normalized_email = email.casefold()
            if any(row["E-post"].strip().casefold() == normalized_email for row in existing_rows):
                return jsonify({"error": "Det finns redan en post med den e-postadressen."}), 409
            with CSV_PATH.open("a", newline="", encoding="utf-8") as csv_file:
                csv.writer(csv_file).writerow(row)
            rows = read_rows()
        return jsonify(dict(zip(CSV_HEADERS, row), id=len(rows) - 1)), 201
    except (OSError, UnicodeError, csv.Error, ValueError) as error:
        return jsonify({"error": str(error)}), 400


@app.delete("/api/poster/<int:entry_id>")
def delete_entry(entry_id):
    try:
        with csv_lock:
            rows = read_rows()
            if entry_id < 0 or entry_id >= len(rows):
                return jsonify({"error": "Posten kunde inte hittas."}), 404

            del rows[entry_id]
            temporary_path = CSV_PATH.with_name(CSV_PATH.name + ".tmp")
            with temporary_path.open("w", newline="", encoding="utf-8") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=CSV_HEADERS)
                writer.writeheader()
                writer.writerows(rows)
            os.replace(temporary_path, CSV_PATH)
        return jsonify({"success": True})
    except (OSError, UnicodeError, csv.Error, ValueError) as error:
        return jsonify({"error": str(error)}), 400


if __name__ == "__main__":
    # Endast tillgänglig från den lokala datorn.
    app.run(host="127.0.0.1", port=5000, debug=False)
