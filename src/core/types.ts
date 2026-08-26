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

/**
 * Lifecycle state of a proposal.
 * - `confirmed` / `cancelled` — the user acted on it
 * - `expired` — the proposal was persisted to history without being acted on;
 *   restored proposals must never fire callbacks against stale payloads
 */
export type AiProposalResolution = 'confirmed' | 'cancelled' | 'expired';

export type AiProposal = {
  id: string;
  title: string;
  description?: string;
  /** Arbitrary payload — consumer decides how to handle it */
  payload?: unknown;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Set once the proposal is acted on or expired — renders the card disabled */
  resolved?: AiProposalResolution;
};

export type AiProposalPart = {
  type: 'proposal';
  proposal: AiProposal;
};

export type AiErrorPart = {
  type: 'error';
  message: string;
};

/** Badge tone for an entity field value */
export type AiEntityBadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

/** One labelled field of an entity — rendered as a label/value row */
export type AiEntityField = {
  label: string;
  value: string;
  /** Render the value as a coloured badge instead of plain text */
  badge?: AiEntityBadgeTone;
};

/**
 * A generic structured entity — a domain record (any object with a title
 * and fields). Juneau renders it as a card; consumers can override via
 * `renderPart` for domain-specific layouts.
 */
export type AiEntity = {
  /** Stable ID — forwarded to `onEntityClick` so consumers can navigate */
  id?: string;
  title: string;
  subtitle?: string;
  fields?: AiEntityField[];
  /** Arbitrary payload — not rendered, available for custom renderers and click handlers */
  payload?: unknown;
};

export type AiEntityPart = {
  type: 'entity';
  entity: AiEntity;
  /** Optional entity kind (e.g. "invoice") — available for custom renderers */
  entityType?: string;
};

export type AiEntityListPart = {
  type: 'entity-list';
  entities: AiEntity[];
  /** Optional heading above the list */
  title?: string;
  /** Optional entity kind shared by all items — available for custom renderers */
  entityType?: string;
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

/**
 * Escape hatch for consumer-defined part types. Any part shape with a `type`
 * string that isn't one of the built-ins flows through the wire protocol and
 * message state untouched. Juneau applies no validation or narrowing — the
 * consumer owns all type assertions in their `renderPart` implementation.
 */
export type AiCustomPart = { type: string; [key: string]: unknown };

export type AiMessagePart =
  | AiTextPart
  | AiTablePart
  | AiProposalPart
  | AiActivityPart
  | AiErrorPart
  | AiEntityPart
  | AiEntityListPart
  | AiCustomPart;

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  parts: AiMessagePart[];
  createdAt: Date;
};

// ─── Chat history ─────────────────────────────────────────────────────────────
//
// Juneau is storage-agnostic: the consumer persists chats however they want
// (localStorage, database, …) and hands Juneau plain data. These types define
// the exact contract.

/**
 * Lightweight descriptor for one stored chat — what a chat history list needs
 * to render. The consumer stores the full `AiMessage[]` per chat separately
 * and loads it on selection.
 */
export type AiChatSummary = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * JSON-safe form of {@link AiMessage} — dates as ISO strings.
 * `v` is the persistence format version; missing means v1 (pre-versioned).
 */
export type AiSerializedMessage = Omit<AiMessage, 'createdAt'> & { createdAt: string; v?: number };

export type AiStreamTextEvent = { type: 'text'; text: string };
export type AiStreamPartEvent = { type: 'part'; part: AiTablePart | AiProposalPart | AiActivityPart | AiErrorPart | AiEntityPart | AiEntityListPart | AiCustomPart };
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

/** Structured rich block — table, proposal, entity, entity list, or any consumer-defined custom part */
export type JuneauWirePart = {
  type: 'part';
  part: AiTablePart | AiProposalPart | AiEntityPart | AiEntityListPart | AiCustomPart;
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
