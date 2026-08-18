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

/**
 * Structural match for ai-sdk v7's StreamTextResult — only the members
 * withToolRecovery needs. Juneau does not import ai-sdk; passing the result
 * of streamText() satisfies this shape.
 */
export interface ToolRecoveryStreamResult {
  fullStream: AsyncIterable<unknown>;
  /**
   * ai-sdk v7: resolves after the stream is consumed to the response metadata,
   * including the full message history (tool calls + tool results).
   */
  response?: Promise<{ messages: unknown[] }>;
  /** Some ai-sdk versions expose the message history directly. */
  messages?: Promise<unknown[]>;
}

export interface ToolRecoveryOptions {
  phase1: () => ToolRecoveryStreamResult;
  phase2: (failureContext: string) => { fullStream: AsyncIterable<unknown> };
  /**
   * Silent-success recovery — called when a tool succeeded but the model wrote
   * no text (observed with Gemini 2.5 Flash, which treats the tool call as its
   * complete response). Receives the full phase 1 message history including
   * tool-call and tool-result turns; call the model again without tools so it
   * is forced to summarise the tool result as text.
   */
  phase3?: (messages: unknown[]) => { fullStream: AsyncIterable<unknown> };
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
