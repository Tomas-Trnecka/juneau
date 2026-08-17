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

export interface AiBackendAdapter {
  sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent>;
}
