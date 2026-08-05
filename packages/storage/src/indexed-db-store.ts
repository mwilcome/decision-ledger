import type { Decision } from "@decision-ledger/core";
import { normalizeDecision } from "@decision-ledger/core";
import {
  DECISIONS_STORE,
  openDecisionLedgerDb,
  runStoreRequest,
} from "./db.js";
import type { DecisionStore } from "./ports.js";

/**
 * Persistent {@link DecisionStore} backed by IndexedDB in the extension origin.
 */
export class IndexedDbDecisionStore implements DecisionStore {
  /**
   * Shared open-database promise.
   */
  private readonly dbPromise: Promise<IDBDatabase>;

  /**
   * Opens (or creates) the shared Decision Ledger database.
   */
  constructor() {
    this.dbPromise = openDecisionLedgerDb();
  }

  /**
   * Returns every stored decision.
   */
  async list(): Promise<Decision[]> {
    const db = await this.dbPromise;
    const rows = await runStoreRequest(db, DECISIONS_STORE, "readonly", (store) =>
      store.getAll(),
    );
    return (rows as Decision[]).map((row) => normalizeDecision(row));
  }

  /**
   * Loads one decision by id, or null when missing.
   *
   * @param id - Decision id
   */
  async get(id: string): Promise<Decision | null> {
    const db = await this.dbPromise;
    const result = await runStoreRequest(
      db,
      DECISIONS_STORE,
      "readonly",
      (store) => store.get(id),
    );
    if (!result) {
      return null;
    }
    return normalizeDecision(result as Decision);
  }

  /**
   * Inserts or replaces a decision with the same id.
   *
   * @param decision - Decision to persist
   */
  async save(decision: Decision): Promise<void> {
    const db = await this.dbPromise;
    const normalized = normalizeDecision(decision);
    await runStoreRequest(db, DECISIONS_STORE, "readwrite", (store) =>
      store.put(normalized),
    );
  }

  /**
   * Removes a decision by id. No-op when missing.
   *
   * @param id - Decision id
   */
  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    await runStoreRequest(db, DECISIONS_STORE, "readwrite", (store) =>
      store.delete(id),
    );
  }
}
