import type { ZodType } from 'zod';
import type { SkillDefinition, SkillSet, SkillSetOptions } from './types';

type SkillMap = Record<string, SkillDefinition<ZodType>>;

function formatActivityEvent(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function pickLabel(labels: { cs: string; en: string }, language: string): string {
  return (labels as Record<string, string>)[language] ?? labels.en;
}

/**
 * Takes a map of skill definitions and returns a SkillSet containing:
 * - tools: ready-made tool definitions for ai-sdk's streamText({ tools })
 * - drainActivities(): flush buffered activity wire SSE strings
 * - hadFailure / failureContext: for driving tool failure recovery
 */
export function createSkillSet(skills: SkillMap, options: SkillSetOptions = {}): SkillSet {
  const language = options.language ?? 'en';
  const debug = options.debug ?? false;
  const activityBuffer: string[] = [];
  let hadFailure = false;
  let failureContext: string | null = null;

  const tools: Record<string, unknown> = {};

  for (const [name, skill] of Object.entries(skills)) {
    tools[name] = {
      description: skill.description,
      parameters: skill.input,
      execute: async (input: unknown) => {
        if (debug) {
          console.debug(`[juneau] skill "${name}" → executing, input:`, input);
        }

        const startMs = debug ? Date.now() : 0;

        // Emit a "running" activity event into the buffer
        activityBuffer.push(
          formatActivityEvent({
            type: 'activity',
            id: name,
            title: pickLabel(skill.labels.running, language),
            status: 'running',
            metadata: { skill: name },
          })
        );

        try {
          const result = await skill.execute(input as never);

          const durationMs = debug ? Date.now() - startMs : 0;
          if (debug) {
            console.debug(`[juneau] skill "${name}" → done in ${durationMs}ms, result:`, result);
          }

          // Emit a "done" activity event
          activityBuffer.push(
            formatActivityEvent({
              type: 'activity',
              id: name,
              title: pickLabel(skill.labels.done, language),
              status: 'done',
              metadata: { skill: name },
            })
          );

          return result;
        } catch (err) {
          const durationMs = debug ? Date.now() - startMs : 0;
          const message = err instanceof Error ? err.message : String(err);

          if (debug) {
            console.debug(`[juneau] skill "${name}" → FAILED in ${durationMs}ms: "${message}"`);
          }

          const failedLabels = skill.labels.failed ?? { cs: 'Nepodařilo se', en: 'Failed' };

          // Emit a "failed" activity event
          activityBuffer.push(
            formatActivityEvent({
              type: 'activity',
              id: name,
              title: pickLabel(failedLabels, language),
              status: 'failed',
              metadata: { skill: name },
            })
          );

          hadFailure = true;
          failureContext = `Tool "${name}" failed: ${message}`;

          // Re-throw so ai-sdk knows the tool call failed
          throw err;
        }
      },
    };
  }

  return {
    tools,

    drainActivities(): string[] {
      return activityBuffer.splice(0, activityBuffer.length);
    },

    get hadFailure() {
      return hadFailure;
    },

    get failureContext() {
      return failureContext;
    },
  };
}
