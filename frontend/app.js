
/*
 * Facility Maintenance Assist
 * Local database foundation
 *
 * This is the first step toward offline maintenance logging.
 * It does not yet implement login, server sync, or permissions.
 */

(function () {
  "use strict";

  const DATABASE_NAME = "FacilityMaintenanceAssist";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "pendingRecords";

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) {
        reject(new Error("This browser does not support IndexedDB."));
        return;
      }

      const request = indexedDB.open(
        DATABASE_NAME,
        DATABASE_VERSION
      );

      request.onupgradeneeded = function (event) {
        const database = event.target.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, {
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

  async function checkLocalDatabase() {
    try {
      const database = await openDatabase();
      database.close();

      console.info(
        "Facility Maintenance Assist: local database is ready."
      );
    } catch (error) {
      console.error(
        "Facility Maintenance Assist: database setup failed.",
        error
      );
    }
  }

  
  function saveMaintenanceRecord(record) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(
          STORE_NAME,
          "readwrite"
        );

        const store = transaction.objectStore(STORE_NAME);

        store.put({
          ...record,
          recordId: record.recordId || crypto.randomUUID(),
          syncStatus: "pending",
          savedAt: new Date().toISOString()
        });

        transaction.oncomplete = function () {
          database.close();
          resolve(true);
        };

        transaction.onerror = function () {
          database.close();
          reject(transaction.error);
        };

        transaction.onabort = function () {
          database.close();
          reject(transaction.error || new Error("Save aborted."));
        };
      });
    });
  }

  function getMaintenanceRecords() {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(
          STORE_NAME,
          "readonly"
        );

        const request = transaction.objectStore(STORE_NAME).getAll();

        request.onsuccess = function () {
          resolve(request.result);
        };

        request.onerror = function () {
          reject(request.error);
        };

        transaction.oncomplete = function () {
          database.close();
        };
      });
    });
  }

  window.FacilityMaintenanceAssist = {
    openDatabase: openDatabase,
    saveMaintenanceRecord: saveMaintenanceRecord,
    getMaintenanceRecords: getMaintenanceRecords
  };


  checkLocalDatabase();
})();
