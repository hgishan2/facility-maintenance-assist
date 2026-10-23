
(function () {
  "use strict";

  const DATABASE_NAME = "FacilityMaintenanceAssist";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "pendingRecords";

  const form = document.getElementById("serviceForm");
  const saveMessage = document.getElementById("saveMessage");
  const outbox = document.getElementById("outbox");
  const refreshButton = document.getElementById("refresh");
  const network = document.getElementById("network");
  const syncStatus = document.getElementById("syncStatus");

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(
        DATABASE_NAME,
        DATABASE_VERSION
      );

      request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "recordId"
          });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function saveMaintenanceRecord(record) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        store.put(record);

        tx.oncomplete = function () {
          db.close();
          resolve(true);
        };

        tx.onerror = function () {
          const error = tx.error;
          db.close();
          reject(error);
        };

        tx.onabort = function () {
          const error = tx.error || new Error("Save cancelled.");
          db.close();
          reject(error);
        };
      });
    });
  }

  function getMaintenanceRecords() {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).getAll();

        request.onsuccess = function () {
          resolve(request.result);
        };

        request.onerror = function () {
          reject(request.error);
        };

        tx.oncomplete = function () {
          db.close();
        };

        tx.onerror = function () {
          db.close();
          reject(tx.error);
        };
      });
    });
  }

  function showRecords(records) {
    outbox.replaceChildren();

    if (records.length === 0) {
      outbox.textContent = "No local records saved yet.";
      syncStatus.textContent = "0 pending";
      return;
    }

    records.forEach(function (record) {
      const card = document.createElement("article");
      card.style.border = "1px solid #e2e5ea";
      card.style.borderRadius = "8px";
      card.style.padding = "12px";
      card.style.marginBottom = "8px";

      const heading = document.createElement("strong");
      heading.textContent =
        (record.equipmentId || "Unknown equipment") +
        " — " + (record.serviceType || "Service");

      const details = document.createElement("p");
      details.className = "muted";
      details.textContent =
        "Staff: " + (record.staffId || "Not specified") +
        " | Building: " + (record.building || "Not specified");

      const notes = document.createElement("p");
      notes.textContent = record.notes || "";

      const status = document.createElement("p");
      status.className = "muted";
      status.textContent =
        "Status: " + (record.syncStatus || "pending") +
        " | Saved: " + (record.savedAt || "Unknown");

      card.append(heading, details, notes, status);
      outbox.appendChild(card);
    });

    syncStatus.textContent = records.length + " pending";
  }

  async function refreshRecords() {
    try {
      const records = await getMaintenanceRecords();
      showRecords(records);
    } catch (error) {
      outbox.textContent = "Could not load local records.";
      console.error("Record loading failed:", error);
    }
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const data = new FormData(form);

      const record = {
        recordId: crypto.randomUUID(),
        staffId: String(data.get("staffId") || "").trim(),
        building: String(data.get("building") || "").trim(),
        equipmentId: String(data.get("equipmentId") || "").trim(),
        serviceType: String(data.get("serviceType") || ""),
        notes: String(data.get("notes") || "").trim(),
        savedAt: new Date().toISOString(),
        syncStatus: "pending"
      };

      if (
        !record.staffId ||
        !record.building ||
        !record.equipmentId ||
        !record.notes
      ) {
        saveMessage.textContent = "Please complete all required fields.";
        return;
      }

      const submitButton = form.querySelector(
        'button[type="submit"]'
      );

      submitButton.disabled = true;
      saveMessage.textContent = "Saving record locally…";

      try {
        
await saveMaintenanceRecord(record);

saveMessage.textContent =
  "Record saved on this device. It has not been uploaded.";

if (form && typeof form.reset === "function") {
  form.reset();
}

await refreshRecords();

      } catch (error) {
        console.error("Record save failed:", error);
        saveMessage.textContent =
          "Could not save the record. Please try again.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", refreshRecords);
  }

  function updateNetworkStatus() {
    const online = navigator.onLine;

    network.textContent = online ? "Online" : "Offline";
    network.className = online ? "status ok" : "status warn";
  }

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  window.FacilityMaintenanceAssist = {
    openDatabase: openDatabase,
    saveMaintenanceRecord: saveMaintenanceRecord,
    getMaintenanceRecords: getMaintenanceRecords
  };

  updateNetworkStatus();
  refreshRecords();

  openDatabase()
    .then(function (db) {
      db.close();
      console.info(
        "Facility Maintenance Assist: local database is ready."
      );
    })
    .catch(function (error) {
      console.error("Local database setup failed:", error);
    });
})();
