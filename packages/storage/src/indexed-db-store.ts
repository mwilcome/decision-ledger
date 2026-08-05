import type { Decision } from "@decision-ledger/core";
import type { DecisionStore } from "./ports.js";

/**
 * IndexedDB database name for Decision Ledger.
 */
const DB_NAME = "decision-ledger";

/**
 * Object store that holds decision records keyed by id.
 */
const STORE_NAME = "decisions";

/**
 * Schema version for this database.
 */
const DB_VERSION = 1;

/**
 * Persistent {@link DecisionStore} backed by IndexedDB in the extension origin.
 * Works in Chromium and Firefox extension pages that expose IndexedDB.
 */
export class IndexedDbDecisionStore implements DecisionStore {
  /**
   * Shared open-database promise so concurrent calls reuse one connection setup.
   */
  private readonly dbPromise: Promise<IDBDatabase>;

  /**
   * Opens (or creates) the IndexedDB database for decisions.
   */
  constructor() {
    this.dbPromise = openDecisionDatabase();
  }

  /**
   * Returns every stored decision.
   */
  async list(): Promise<Decision[]> {
    const db = await this.dbPromise;
    return runStoreRequest(db, "readonly", (store) => store.getAll());
  }

  /**
   * Loads one decision by id, or null when missing.
   *
   * @param id - Decision id
   */
  async get(id: string): Promise<Decision | null> {
    const db = await this.dbPromise;
    const result = await runStoreRequest(db, "readonly", (store) =>
      store.get(id),
    );
    return (result as Decision | undefined) ?? null;
  }

  /**
   * Inserts or replaces a decision with the same id.
   *
   * @param decision - Decision to persist
   */
  async save(decision: Decision): Promise<void> {
    const db = await this.dbPromise;
    await runStoreRequest(db, "readwrite", (store) => store.put(decision));
  }

  /**
   * Removes a decision by id. No-op when missing.
   *
   * @param id - Decision id
   */
  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    await runStoreRequest(db, "readwrite", (store) => store.delete(id));
  }
}

/**
 * Opens the Decision Ledger database and creates the object store on first run.
 */
function openDecisionDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this context"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    /**
     * Creates the decisions object store when the DB is first created or upgraded.
     */
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
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
 * Runs a single object-store operation inside a transaction and resolves with its result.
 *
 * @param db - Open database
 * @param mode - Transaction mode
 * @param operation - Callback that starts an IDB request on the decisions store
 */
function runStoreRequest<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
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
