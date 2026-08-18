import type { ZodType, z } from 'zod';

/**
 * A single skill definition — description, zod input schema, i18n labels, and the execute fn.
 */
export interface SkillDefinition<TInput extends ZodType = ZodType> {
  description: string;
  input: TInput;
  labels: {
    running: { cs: string; en: string };
    done:    { cs: string; en: string };
    failed?: { cs: string; en: string };
  };
  execute: (input: z.infer<TInput>) => Promise<unknown>;
}

/**
 * The object returned by createSkillSet.
 */
export interface SkillSet {
  /** ai-sdk ToolSet — pass directly to streamText({ tools }) */
  tools: Record<string, unknown>;

  /**
   * Returns and clears all buffered activity wire SSE strings.
   * Call before yielding text chunks to flush running/done/failed indicators.
   */
  drainActivities(): string[];

  /**
   * True if any tool execution failed during the last call.
   * Use to decide whether to run the failure recovery phase.
   */
  hadFailure: boolean;

  /**
   * Human-readable failure context for the recovery prompt.
   * Set after a failed tool call. Use as an assistant message in the follow-up call.
   */
  failureContext: string | null;
}

export interface SkillSetOptions {
  /** Language code — determines which label variant to use. Default: 'en' */
  language?: string;
  /** Emit structured console.debug logs for each skill execution. Default: false */
  debug?: boolean;
}

export interface ToolRecoveryOptions {
  phase1: () => { fullStream: AsyncIterable<unknown> };
  phase2: (failureContext: string) => { fullStream: AsyncIterable<unknown> };
  skillSet: SkillSet;
  /** Emit structured console.debug logs for phase decisions and chunk flow. Default: false */
  debug?: boolean;
}

export interface StreamToWireOptions {
  /** Emit structured console.debug logs for every ai-sdk chunk received. Default: false */
  debug?: boolean;
}

/**
 * CoreMessage — structural match for ai-sdk's CoreMessage type.
 * Juneau does not import ai-sdk; this plain object is compatible by structure.
 */
export type CoreMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
