import type { SkillSet } from './types';

/**
 * Builds a compact one-liner-per-skill index for the system prompt.
 * Inject the output into your system prompt instead of hand-maintaining a
 * skill list — adding a skill to the registry updates the index automatically.
 *
 * Output format:
 *   - invoiceSearch (read): Find invoices by number, supplier, date, or status.
 *   - invoiceApprove (write, requires confirmation): Approve an invoice.
 */
export function buildSkillIndex(skillSet: SkillSet): string {
  return Object.entries(skillSet.skills)
    .map(([name, skill]) => {
      const traits: string[] = [skill.readOnly === false ? 'write' : 'read'];
      if (skill.requiresConfirmation) {
        traits.push('requires confirmation');
      }
      return `- ${name} (${traits.join(', ')}): ${skill.description}`;
    })
    .join('\n');
}

/**
 * Returns the concatenated workflow instructions for the given skill names —
 * typically skillSet.calledSkillNames after phase 1. Skills without
 * instructions and unknown names are skipped. Returns '' when nothing matches.
 *
 * This is the lazy-loading half of the skill format: full instructions enter
 * the prompt only for skills the model actually used.
 *
 * @example
 * const instructions = selectSkills(skillSet, skillSet.calledSkillNames);
 * // → inject into phase 3's system prompt as additional context
 */
export function selectSkills(skillSet: SkillSet, skillNames: string[]): string {
  return skillNames
    .map(name => skillSet.skills[name])
    .filter(skill => skill?.instructions)
    .map(skill => skill.instructions as string)
    .join('\n\n');
}
