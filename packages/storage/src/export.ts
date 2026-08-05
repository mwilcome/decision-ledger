import type { Decision } from "@decision-ledger/core";
import { buildChangeKey } from "@decision-ledger/core";

/**
 * Serializes decisions to a Markdown document for export or sharing.
 *
 * @param decisions - Decisions to include
 * @returns Markdown string
 */
export function decisionsToMarkdown(decisions: readonly Decision[]): string {
  if (decisions.length === 0) {
    return "# Decision Ledger export\n\n_No decisions._\n";
  }

  const lines: string[] = ["# Decision Ledger export", ""];

  for (const decision of decisions) {
    lines.push(...formatDecisionSection(decision), "");
  }

  return lines.join("\n");
}

/**
 * Serializes decisions to pretty-printed JSON.
 *
 * @param decisions - Decisions to include
 */
export function decisionsToJson(decisions: readonly Decision[]): string {
  return `${JSON.stringify(decisions, null, 2)}\n`;
}

/**
 * Builds Markdown lines for a single decision heading and body.
 *
 * @param decision - Decision to format
 */
function formatDecisionSection(decision: Decision): string[] {
  const { change } = decision.context;
  const title = `${change.repo.owner}/${change.repo.name}#${change.number}`;
  return [
    `## ${decision.kind} (${decision.status})`,
    "",
    `- **Id:** ${decision.id}`,
    `- **Change:** ${title}`,
    `- **Key:** ${buildChangeKey(change)}`,
    `- **Host:** ${change.repo.host}`,
    `- **URL:** ${decision.context.sourceUrl}`,
    `- **Tags:** ${decision.tags.length ? decision.tags.join(", ") : "_none_"}`,
    `- **Updated:** ${decision.updatedAt}`,
    "",
    decision.body,
  ];
}
