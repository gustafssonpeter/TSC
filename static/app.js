const tabs = [...document.querySelectorAll(".tab-button")];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const form = document.querySelector("#entry-form");
const saveMessage = document.querySelector("#save-message");
const listMessage = document.querySelector("#list-message");
const tableWrap = document.querySelector("#table-wrap");
const rowCount = document.querySelector("#row-count");
const entriesBody = document.querySelector("#entries-body");
const filters = {
  name: document.querySelector("#filter-name"),
  email: document.querySelector("#filter-email"),
  paid: document.querySelector("#filter-paid"),
  date: document.querySelector("#filter-date"),
};
const dialog = document.querySelector("#confirm-dialog");
let entries = [];
let pendingDeleteId = null;
let saveMessageTimer = null;

function selectTab(tab) {
  tabs.forEach((button) => {
    const selected = button === tab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
  if (tab.id === "tab-search") loadEntries();
}

tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab)));

function showNotice(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
  element.hidden = false;
}

async function responseError(response) {
  let body = {};
  try { body = await response.json(); } catch (_) { /* använd standardmeddelandet */ }
  return body.error || "Något gick fel. Försök igen.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  saveMessage.hidden = true;
  const data = new FormData(form);
  try {
    const response = await fetch("/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        paid: data.has("paid"),
      }),
    });
    if (!response.ok) throw new Error(await responseError(response));
    form.reset();
    form.elements.name.focus();
    window.clearTimeout(saveMessageTimer);
    showNotice(saveMessage, "Posten har sparats i data.csv.");
    saveMessageTimer = window.setTimeout(() => {
      saveMessage.hidden = true;
    }, 5_000);
    if (document.querySelector("#search-panel").hidden === false) await loadEntries();
  } catch (error) {
    showNotice(saveMessage, error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

async function loadEntries() {
  listMessage.hidden = true;
  try {
    const response = await fetch("/api/poster", { cache: "no-store" });
    if (!response.ok) throw new Error(await responseError(response));
    entries = await response.json();
    renderEntries();
  } catch (error) {
    entries = [];
    entriesBody.replaceChildren();
    tableWrap.hidden = true;
    if (rowCount) rowCount.hidden = true;
    showNotice(listMessage, error.message, true);
  }
}

function matchesFilter(value, filter) {
  return String(value).toLocaleLowerCase("sv").includes(filter.trim().toLocaleLowerCase("sv"));
}

function renderEntries() {
  if (rowCount) {
    rowCount.textContent = `Antal rader: ${entries.length}`;
    rowCount.hidden = false;
  }
  const visibleEntries = entries.filter((entry) =>
    matchesFilter(entry.Namn, filters.name.value)
    && matchesFilter(entry["E-post"], filters.email.value)
    && (!filters.paid.value || entry.Betalat.toLowerCase() === filters.paid.value)
    && matchesFilter(entry["Datum och tid"], filters.date.value)
  );

  entriesBody.replaceChildren();
  tableWrap.hidden = visibleEntries.length === 0;

  if (entries.length === 0) {
    showNotice(listMessage, "CSV-filen innehåller ännu inga poster.");
    return;
  }
  if (visibleEntries.length === 0) {
    showNotice(listMessage, "Inga poster matchar filtren.");
    return;
  }
  listMessage.hidden = true;

  visibleEntries.forEach((entry) => {
    const row = document.createElement("tr");
    [entry.Namn, entry["E-post"]].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const paidCell = document.createElement("td");
    const badge = document.createElement("span");
    const isPaid = entry.Betalat.toLowerCase() === "true";
    badge.className = `paid-badge${isPaid ? "" : " unpaid"}`;
    badge.textContent = isPaid ? "Ja" : "Nej";
    paidCell.append(badge);
    row.append(paidCell);

    const dateCell = document.createElement("td");
    dateCell.textContent = entry["Datum och tid"];
    row.append(dateCell);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "button-delete";
    deleteButton.textContent = "Ta bort";
    deleteButton.setAttribute("aria-label", `Ta bort ${entry.Namn}`);
    deleteButton.addEventListener("click", () => {
      pendingDeleteId = entry.id;
      dialog.showModal();
    });
    actionCell.append(deleteButton);
    row.append(actionCell);
    entriesBody.append(row);
  });
}

Object.values(filters).forEach((filter) => filter.addEventListener("input", renderEntries));
filters.paid.addEventListener("change", renderEntries);

document.querySelector("#export-emails").addEventListener("click", () => {
  const emails = [...new Set(entries.map((entry) => entry["E-post"].trim()).filter(Boolean))];
  if (emails.length === 0) {
    showNotice(listMessage, "Det finns inga e-postadresser att exportera.");
    return;
  }

  const blob = new Blob([emails.join(",")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "e-postadresser.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#confirm-no").addEventListener("click", () => {
  pendingDeleteId = null;
  dialog.close();
});

document.querySelector("#confirm-yes").addEventListener("click", async () => {
  if (pendingDeleteId === null) return;
  const entryId = pendingDeleteId;
  pendingDeleteId = null;
  try {
    const response = await fetch(`/api/poster/${entryId}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await responseError(response));
    dialog.close();
    await loadEntries();
  } catch (error) {
    dialog.close();
    showNotice(listMessage, error.message, true);
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    pendingDeleteId = null;
    dialog.close();
  }
});
