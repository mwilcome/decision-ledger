import type { Decision } from "@decision-ledger/core";
import type { DecisionStore } from "./ports.js";

/**
 * In-memory {@link DecisionStore} for tests and early UI wiring.
 * Data is lost when the process or extension context restarts.
 */
export class MemoryDecisionStore implements DecisionStore {
  /**
   * Map of decision id to decision record.
   */
  private readonly byId = new Map<string, Decision>();

  /**
   * Returns a shallow copy list of all decisions.
   */
  async list(): Promise<Decision[]> {
    return [...this.byId.values()];
  }

  /**
   * Looks up a decision by id.
   *
   * @param id - Decision id
   */
  async get(id: string): Promise<Decision | null> {
    return this.byId.get(id) ?? null;
  }

  /**
   * Stores a clone of the decision under its id.
   *
   * @param decision - Decision to save
   */
  async save(decision: Decision): Promise<void> {
    this.byId.set(decision.id, {
      ...decision,
      tags: [...decision.tags],
      context: decision.context,
    });
  }

  /**
   * Deletes the decision if present.
   *
   * @param id - Decision id
   */
  async remove(id: string): Promise<void> {
    this.byId.delete(id);
  }
}
