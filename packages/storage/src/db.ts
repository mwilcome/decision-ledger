/**
 * Shared IndexedDB open helper for Decision Ledger stores.
 */

/**
 * Database name for all extension local data.
 */
export const DECISION_LEDGER_DB_NAME = "decision-ledger";

/**
 * Object store for decision records (keyPath: id).
 */
export const DECISIONS_STORE = "decisions";

/**
 * Object store for change display metadata (keyPath: changeKey).
 */
export const CHANGE_META_STORE = "change_meta";

/**
 * Schema version (v2 adds change_meta).
 */
export const DECISION_LEDGER_DB_VERSION = 2;

/**
 * Opens the shared database, creating/upgrading object stores as needed.
 */
export function openDecisionLedgerDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this context"));
      return;
    }

    const request = indexedDB.open(
      DECISION_LEDGER_DB_NAME,
      DECISION_LEDGER_DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DECISIONS_STORE)) {
        db.createObjectStore(DECISIONS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CHANGE_META_STORE)) {
        db.createObjectStore(CHANGE_META_STORE, { keyPath: "changeKey" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Runs a single object-store operation inside a transaction.
 *
 * @param db - Open database
 * @param storeName - Object store name
 * @param mode - Transaction mode
 * @param operation - Callback that starts an IDB request
 */
export function runStoreRequest<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = operation(store);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed"));
    };

    tx.onabort = () => {
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    };
  });
}
