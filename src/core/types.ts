export type AiMessageRole = 'user' | 'assistant' | 'system';


export type AiTextPart = {
  type: 'text';
  text: string;
};

export type AiTablePart = {
  type: 'table';
  columns: string[];
  rows: Record<string, unknown>[];
};

export type AiProposal = {
  id: string;
  title: string;
  description?: string;
  /** Arbitrary payload — consumer decides how to handle it */
  payload?: unknown;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type AiProposalPart = {
  type: 'proposal';
  proposal: AiProposal;
};

export type AiErrorPart = {
  type: 'error';
  message: string;
};

export type AiActivityStatus = 'running' | 'done' | 'failed';

export type AiActivityPart = {
  type: 'activity';
  /**
   * Optional stable ID. If provided, a later activity part with the same ID
   * will update the previous one in-place instead of appending a new row.
   */
  id?: string;
  title: string;
  description?: string;
  status: AiActivityStatus;
  metadata?: Record<string, unknown>;
};

export type AiMessagePart = AiTextPart | AiTablePart | AiProposalPart | AiActivityPart | AiErrorPart;

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  parts: AiMessagePart[];
  createdAt: Date;
};

export type AiStreamTextEvent = { type: 'text'; text: string };
export type AiStreamPartEvent = { type: 'part'; part: AiTablePart | AiProposalPart | AiActivityPart | AiErrorPart };
export type AiStreamDoneEvent = { type: 'done' };
export type AiStreamErrorEvent = { type: 'error'; message: string };

export type AiStreamEvent =
  | AiStreamTextEvent
  | AiStreamPartEvent
  | AiStreamDoneEvent
  | AiStreamErrorEvent;

export type AiAdapterInput = {
  messages: AiMessage[];
  /** Optional application context passed through — adapter can use or ignore */
  context?: Record<string, unknown>;
};

// ─── Juneau wire protocol ─────────────────────────────────────────────────────
//
// The standard JSON format Juneau expects backends to stream.
// Each line (SSE `data:` or NDJSON line) should be one of these shapes.
//
// Both createSseAdapter and createFetchStreamAdapter parse this by default —
// no custom parseEvent/parseChunk needed for Juneau-compatible backends.
//
// Backend example (SSE):
//   data: {"type":"activity","id":"skill-select","title":"Selecting skill","status":"running"}
//   data: {"type":"activity","id":"skill-select","title":"Skill selected","description":"Using Document Search","status":"done"}
//   data: {"type":"text","text":"Here is what I found:"}
//   data: {"type":"done"}

/** Plain text chunk — appended to the current assistant message */
export type JuneauWireText = {
  type: 'text';
  text: string;
};

/** Activity event — shows AI progress (skill selection, tool calls, etc.) */
export type JuneauWireActivity = {
  type: 'activity';
  /**
   * Stable ID for in-place updates. Send the same `id` with a new `status`
   * to update the existing activity row instead of appending a new one.
   */
  id?: string;
  title: string;
  description?: string;
  status: AiActivityStatus;
  /**
   * Arbitrary metadata — not rendered by Juneau, available for consumers.
   * Use for internal data (tool name, duration, etc.) that should not be
   * displayed but may be useful for logging or custom renderers.
   */
  metadata?: Record<string, unknown>;
};

/** Structured rich block — table or proposal */
export type JuneauWirePart = {
  type: 'part';
  part: AiTablePart | AiProposalPart;
};

/** Stream finished cleanly */
export type JuneauWireDone = {
  type: 'done';
};

/** Stream error — ends the stream */
export type JuneauWireError = {
  type: 'error';
  message: string;
};

/**
 * Union of all valid Juneau wire protocol events.
 * This is what Juneau-compatible backends should stream as JSON lines.
 */
export type JuneauWireEvent =
  | JuneauWireText
  | JuneauWireActivity
  | JuneauWirePart
  | JuneauWireDone
  | JuneauWireError;

export interface AiBackendAdapter {
  sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent>;
}
