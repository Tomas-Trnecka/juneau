import type { ZodType, z } from 'zod';

/**
 * Helpers injected into a skill's execute fn as the second argument.
 */
export interface SkillExecuteContext {
  /**
   * Emits a custom part wire event directly into the stream, alongside the
   * automatic running/done/failed activities. Available synchronously at any
   * point during execution — parts appear in the stream in emit order.
   * The part is wrapped as { type: 'part', part } on the wire.
   */
  emit: (part: { type: string; [key: string]: unknown }) => void;
}

/**
 * A single skill definition — metadata, zod input schema, i18n labels, and the execute fn.
 *
 * `description` is the tool description the model uses for tool selection.
 * `instructions` is the "how to behave after calling this" workflow text —
 * injected into the prompt only when the skill is relevant (see selectSkills).
 */
export interface SkillDefinition<TInput extends ZodType = ZodType> {
  /** Human-readable name, e.g. "Invoice Search". Used by buildSkillIndex. */
  title: string;
  description: string;
  /**
   * Workflow instructions for the agent — separate from description. Loaded
   * lazily via selectSkills() only for skills the model actually called.
   */
  instructions?: string;
  /** False means the skill mutates data. Default: true. */
  readOnly?: boolean;
  /** True means the skill should emit a proposal before acting. Default: false. */
  requiresConfirmation?: boolean;
  /**
   * Future-proofing for skill composition — names of other skills this skill
   * depends on. Validated at createSkillSet() time against the skill map keys.
   */
  tools?: string[];
  input: TInput;
  labels: {
    running: { cs: string; en: string };
    done:    { cs: string; en: string };
    failed?: { cs: string; en: string };
  };
  execute: (input: z.infer<TInput>, context: SkillExecuteContext) => Promise<unknown>;
}

/**
 * The object returned by createSkillSet.
 */
export interface SkillSet {
  /** ai-sdk ToolSet — pass directly to streamText({ tools }) */
  tools: Record<string, unknown>;

  /** The original skill definitions — used by buildSkillIndex / selectSkills. */
  skills: Record<string, SkillDefinition>;

  /**
   * Names of skills the model actually called, in call order (deduplicated).
   * Populated during phase 1 execution — pass to selectSkills() to load
   * workflow instructions lazily for phase 3.
   */
  calledSkillNames: string[];

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
   * ai-sdk v7: resolves after the stream is consumed to the FULL message
   * history — user, assistant(tool-call), and tool(tool-result) turns.
   * Preferred source for phase 3; Gemini rejects histories where a tool-call
   * turn is not followed by its tool-result turn.
   */
  messages?: Promise<unknown[]>;
  /**
   * Fallback only — may resolve to an incomplete subset of the history
   * (observed: missing tool-result turns). Used when `messages` is unavailable.
   */
  response?: Promise<{ messages?: unknown[] }>;
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
  /**
   * Called once, right before the final done event, with the assistant text
   * accumulated across all phases. Use to persist the response server-side.
   * Not called on error paths.
   */
  onFinish?: (result: { text: string }) => void;
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
