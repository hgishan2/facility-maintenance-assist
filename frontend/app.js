/* Starter only: local outbox demo. Production auth/sync transport is intentionally not wired yet. */
const DB_NAME = "facility-assist-local";
const DB_VERSION = 1;
const STORE = "outbox";
const $ = s => document.querySelector(s);
const network = () => {
  $("#network").textContent = navigator.onLine ? "Online" : "Offline";
  $("#network").className = "status " + (navigator.onLine ? "ok" : "warn");
};
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {keyPath:"recordId"});
        store.createIndex("syncStatus", "syncStatus", {unique:false});
        store.createIndex("createdAt", "createdAt", {unique:false});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function writeRecord(record) {
  const db = await openDb();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(STORE,"readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function readRecords() {
  const db = await openDb();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(STORE,"readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => { db.close(); resolve(req.result || []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
function id() {
  return crypto.randomUUID ? crypto.randomUUID() :
    "rec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}
async function renderOutbox() {
  const records = await readRecords();
  $("#syncStatus").textContent = `${records.filter(r=>r.syncStatus!=="synced").length} pending`;
  $("#outbox").innerHTML = records.length ? records.map(r =>
    `<article class="card"><strong>${escapeHtml(r.building)} · ${escapeHtml(r.equipmentId)}</strong>
      <div class="muted">${escapeHtml(r.serviceType)} · Staff ${escapeHtml(r.staffId)} · ${new Date(r.createdAt).toLocaleString()}</div>
      <p>${escapeHtml(r.notes)}</p><span class="status warn">${escapeHtml(r.syncStatus)}</span></article>`
  ).join("") : '<p class="muted">No local records yet.</p>';
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
$("#serviceForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const record = {
    recordId: id(),
    schemaVersion: 1,
    staffId: data.staffId.trim(),
    building: data.building.trim(),
    equipmentId: data.equipmentId.trim(),
    serviceType: data.serviceType,
    notes: data.notes.trim(),
    createdAt: new Date().toISOString(),
    deviceId: localStorage.getItem("facility-assist-device-id") || createDeviceId(),
    syncStatus: "pending"
  };
  try {
    await writeRecord(record);
    $("#saveMessage").textContent = "Saved on this device. Sync is not configured in this starter.";
    event.currentTarget.reset();
    await renderOutbox();
  } catch (err) {
    $("#saveMessage").textContent = "Could not save locally: " + (err.message || err);
  }
});
function createDeviceId() {
  const value = id();
  localStorage.setItem("facility-assist-device-id", value);
  return value;
}
$("#refresh").addEventListener("click", renderOutbox);
window.addEventListener("online", network);
window.addEventListener("offline", network);
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(err => console.warn("Service worker registration failed", err));
}
network();
renderOutbox().catch(err => { $("#outbox").textContent = "IndexedDB unavailable: " + err.message; });
