import type { SkillSet } from './types';

/**
 * Builds a compact one-liner-per-skill index for the system prompt.
 * Inject the output into your system prompt instead of hand-maintaining a
 * skill list — adding a skill to the registry updates the index automatically.
 *
 * Each line includes the numeric ID so the model can request a skill by ID
 * (avoids brittle string comparisons when routing phase 2 dispatch).
 *
 * Output format:
 *   [1] invoiceSearch (read): Find invoices by number, supplier, date, or status.
 *   [2] invoiceApprove (write, requires confirmation): Approve an invoice.
 */
export function buildSkillIndex(skillSet: SkillSet): string {
  return Object.entries(skillSet.skills)
    .map(([name, skill]) => {
      const traits: string[] = [skill.readOnly === false ? 'write' : 'read'];
      if (skill.requiresConfirmation) {
        traits.push('requires confirmation');
      }
      const idPrefix = `[${skill.id}] `;
      return `${idPrefix}${name} (${traits.join(', ')}): ${skill.description}`;
    })
    .join('\n');
}

/**
 * Returns the concatenated workflow instructions for the given skill names —
 * typically skillSet.calledSkillNames after phase 1. Skills without
 * instructions and unknown names are skipped. Returns '' when nothing matches.
 *
 * This is the lazy-loading half of the skill pattern: full instructions enter
 * the prompt only for skills the model actually used.
 *
 * @example
 * const instructions = selectSkills(skillSet, skillSet.calledSkillNames);
 * // → inject into phase 2's system prompt as additional context
 */
export function selectSkills(skillSet: SkillSet, skillNames: string[]): string {
  return skillNames
    .map(name => skillSet.skills[name])
    .filter(skill => skill?.instructions)
    .map(skill => skill.instructions as string)
    .join('\n\n');
}

/**
 * Returns the concatenated workflow instructions for the given skill IDs —
 * typically skillSet.calledSkillIds after phase 1. Skills without instructions
 * and unknown IDs are skipped. Returns '' when nothing matches.
 *
 * Prefer this over selectSkills when routing dispatch by numeric ID — avoids
 * string comparisons entirely.
 *
 * @example
 * const instructions = selectSkillsById(skillSet, skillSet.calledSkillIds);
 * // → inject into phase 2's system prompt as additional context
 */
export function selectSkillsById(skillSet: SkillSet, skillIds: number[]): string {
  return skillIds
    .map(id => skillSet.skillsById.get(id))
    .filter(skill => skill?.instructions)
    .map(skill => skill!.instructions as string)
    .join('\n\n');
}
