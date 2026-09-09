import type {
  AiChartPart,
  AiChatSummary,
  AiMessage,
  AiMessagePart,
  AiProposalPart,
  AiSerializedMessage,
} from './types';

/**
 * Narrows a part to a proposal. Needed because `AiCustomPart`'s index
 * signature keeps TypeScript from narrowing the union on `type` alone.
 */
export function isProposalPart(part: AiMessagePart): part is AiProposalPart {
  return part.type === 'proposal';
}

/**
 * Narrows a part to a chart. Checks structure, not just `type` — chart parts
 * may be restored from persisted history written by older consumers.
 */
export function isChartPart(part: AiMessagePart): part is AiChartPart {
  return part.type === 'chart' && Array.isArray((part as AiChartPart).series);
}

/**
 * Prepares messages for persistence. Returns plain JSON-safe objects:
 *
 * - `createdAt` dates become ISO strings
 * - unresolved proposals are marked `resolved: 'expired'` so a restored card
 *   can never fire callbacks against a stale payload
 * - `running` activity parts are dropped — a restored "in progress" row would
 *   look permanently stuck
 *
 * @example
 * localStorage.setItem('chat', JSON.stringify(serializeForStorage(messages)));
 */
/** Current persistence format version written by {@link serializeForStorage}. */
const STORAGE_FORMAT_VERSION = 1;

export function serializeForStorage(messages: AiMessage[]): AiSerializedMessage[] {
  return messages.map(msg => ({
    ...msg,
    v: STORAGE_FORMAT_VERSION,
    createdAt: msg.createdAt.toISOString(),
    parts: msg.parts
      .filter(part => !(part.type === 'activity' && part.status === 'running'))
      .map(sanitizePart),
  }));
}

function sanitizePart(part: AiMessagePart): AiMessagePart {
  if (isProposalPart(part) && !part.proposal.resolved) {
    return { ...part, proposal: { ...part.proposal, resolved: 'expired' } };
  }
  return part;
}

/**
 * Restores messages persisted with {@link serializeForStorage} back into the
 * live `AiMessage[]` shape Juneau expects — revives `createdAt` dates.
 * Accepts the parsed JSON value, not the raw string.
 *
 * @example
 * const stored = JSON.parse(localStorage.getItem('chat') ?? '[]');
 * const messages = deserializeMessages(stored);
 */
export function deserializeMessages(stored: AiSerializedMessage[]): AiMessage[] {
  // Missing `v` means v1 (pre-versioned histories) — same shape, parses as-is
  return stored.map(({ v: _v, ...msg }) => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
  }));
}

/**
 * Trims a conversation to at most `limit` messages for sending to the model,
 * keeping the most recent ones. Purely a token-saving measure — rendering is
 * never trimmed.
 *
 * The cut never lands mid-exchange: if the oldest surviving message is an
 * assistant turn, it is dropped too, so the history always starts with a user
 * (or system) message and alternation stays valid.
 */
export function trimHistory(messages: AiMessage[], limit: number): AiMessage[] {
  if (limit <= 0 || messages.length <= limit) return messages;
  let start = messages.length - limit;
  while (start < messages.length && messages[start].role === 'assistant') {
    start++;
  }
  return messages.slice(start);
}

/**
 * Enforces an overall chats limit: returns the `limit` most recently updated
 * chats. Use the returned list to know which chats to keep; delete the rest
 * from your storage.
 */
export function trimChats(chats: AiChatSummary[], limit: number): AiChatSummary[] {
  if (limit <= 0 || chats.length <= limit) return [...chats].sort(byUpdatedDesc);
  return [...chats].sort(byUpdatedDesc).slice(0, limit);
}

const byUpdatedDesc = (a: AiChatSummary, b: AiChatSummary): number =>
  b.updatedAt.getTime() - a.updatedAt.getTime();
