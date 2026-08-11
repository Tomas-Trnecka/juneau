// ─── Message roles ────────────────────────────────────────────────────────────

export type AiMessageRole = 'user' | 'assistant' | 'system';

// ─── Message parts ────────────────────────────────────────────────────────────

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

export type AiMessagePart = AiTextPart | AiTablePart | AiProposalPart | AiErrorPart;

// ─── Message ──────────────────────────────────────────────────────────────────

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  parts: AiMessagePart[];
  createdAt: Date;
};

// ─── Stream events ────────────────────────────────────────────────────────────

/** A chunk of text appended to the current assistant message */
export type AiStreamTextEvent = {
  type: 'text';
  text: string;
};

/** A complete message part replacing/appending a structured block */
export type AiStreamPartEvent = {
  type: 'part';
  part: AiTablePart | AiProposalPart | AiErrorPart;
};

/** Signals that the assistant is done responding */
export type AiStreamDoneEvent = {
  type: 'done';
};

/** Signals a fatal error from the adapter */
export type AiStreamErrorEvent = {
  type: 'error';
  message: string;
};

export type AiStreamEvent =
  | AiStreamTextEvent
  | AiStreamPartEvent
  | AiStreamDoneEvent
  | AiStreamErrorEvent;

// ─── Adapter interface ────────────────────────────────────────────────────────

export type AiAdapterInput = {
  messages: AiMessage[];
  /** Optional application context passed through — adapter can use or ignore */
  context?: Record<string, unknown>;
};

export interface AiBackendAdapter {
  sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent>;
}
