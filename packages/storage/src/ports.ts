import type { ChangeMeta, Decision } from "@decision-ledger/core";

/**
 * Persistence port for decision records.
 * Implementations may use memory, IndexedDB, or other stores.
 */
export interface DecisionStore {
  /**
   * Returns every stored decision.
   */
  list(): Promise<Decision[]>;

  /**
   * Loads one decision by id, or null when missing.
   *
   * @param id - Decision id
   */
  get(id: string): Promise<Decision | null>;

  /**
   * Inserts or replaces a decision with the same id.
   *
   * @param decision - Decision to persist
   */
  save(decision: Decision): Promise<void>;

  /**
   * Removes a decision by id. No-op when missing.
   *
   * @param id - Decision id
   */
  remove(id: string): Promise<void>;
}

/**
 * Persistence port for per-change display metadata (titles, nicknames).
 */
export interface ChangeMetaStore {
  /**
   * Returns every cached change meta record.
   */
  list(): Promise<ChangeMeta[]>;

  /**
   * Loads meta for one change key, or null when missing.
   *
   * @param changeKey - Stable change key
   */
  get(changeKey: string): Promise<ChangeMeta | null>;

  /**
   * Inserts or replaces meta for a change key.
   *
   * @param meta - Meta to persist
   */
  save(meta: ChangeMeta): Promise<void>;
}
