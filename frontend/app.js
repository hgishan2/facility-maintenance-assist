
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

  window.FacilityMaintenanceAssist = {
    openDatabase: openDatabase
  };

  checkLocalDatabase();
})();
