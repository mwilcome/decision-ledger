import type { ChangeMeta } from "@decision-ledger/core";
import {
  CHANGE_META_STORE,
  openDecisionLedgerDb,
  runStoreRequest,
} from "./db.js";
import type { ChangeMetaStore } from "./ports.js";

/**
 * IndexedDB-backed store for last-known change titles and related display fields.
 */
export class IndexedDbChangeMetaStore implements ChangeMetaStore {
  /**
   * Shared open-database promise.
   */
  private readonly dbPromise: Promise<IDBDatabase>;

  /**
   * Opens the shared Decision Ledger database.
   */
  constructor() {
    this.dbPromise = openDecisionLedgerDb();
  }

  /**
   * Returns every cached change meta record.
   */
  async list(): Promise<ChangeMeta[]> {
    const db = await this.dbPromise;
    const rows = await runStoreRequest(
      db,
      CHANGE_META_STORE,
      "readonly",
      (store) => store.getAll(),
    );
    return rows as ChangeMeta[];
  }

  /**
   * Loads meta for one change key.
   *
   * @param changeKey - Stable change key
   */
  async get(changeKey: string): Promise<ChangeMeta | null> {
    const db = await this.dbPromise;
    const result = await runStoreRequest(
      db,
      CHANGE_META_STORE,
      "readonly",
      (store) => store.get(changeKey),
    );
    return (result as ChangeMeta | undefined) ?? null;
  }

  /**
   * Inserts or replaces meta for a change key.
   *
   * @param meta - Meta to persist
   */
  async save(meta: ChangeMeta): Promise<void> {
    const db = await this.dbPromise;
    await runStoreRequest(db, CHANGE_META_STORE, "readwrite", (store) =>
      store.put(meta),
    );
  }
}

/**
 * Merges newly learned presentation into existing meta (does not clear nickname).
 *
 * @param existing - Prior meta, if any
 * @param changeKey - Stable change key
 * @param presentation - Fresh fields from the open page
 * @param nowIso - ISO timestamp
 */
export function mergeChangeMeta(
  existing: ChangeMeta | null | undefined,
  changeKey: string,
  presentation: {
    title?: string;
    sourceBranch?: string;
    targetBranch?: string;
  },
  nowIso: string = new Date().toISOString(),
): ChangeMeta {
  return {
    changeKey,
    nickname: existing?.nickname,
    title: presentation.title?.trim() || existing?.title,
    sourceBranch:
      presentation.sourceBranch?.trim() || existing?.sourceBranch,
    targetBranch:
      presentation.targetBranch?.trim() || existing?.targetBranch,
    updatedAt: nowIso,
  };
}
