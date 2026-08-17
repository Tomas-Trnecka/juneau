// ─── Core types ───────────────────────────────────────────────────────────────
export type {
  AiMessage,
  AiMessageRole,
  AiMessagePart,
  AiTextPart,
  AiTablePart as AiTablePartType,
  AiProposalPart,
  AiProposal,
  AiActivityPart as AiActivityPartType,
  AiActivityStatus,
  AiErrorPart,
  AiBackendAdapter,
  AiAdapterInput,
  AiStreamEvent,
  AiStreamTextEvent,
  AiStreamPartEvent,
  AiStreamDoneEvent,
  AiStreamErrorEvent,
  // Wire protocol — what Juneau-compatible backends should stream
  JuneauWireEvent,
  JuneauWireText,
  JuneauWireActivity,
  JuneauWirePart,
  JuneauWireDone,
  JuneauWireError,
} from './core/types';

export { consumeStream, delay, getMessageText } from './core/stream';

// ─── Adapters ─────────────────────────────────────────────────────────────────
export { mockAdapter } from './adapters/mockAdapter';
export { createSseAdapter } from './adapters/createSseAdapter';
export type { SseAdapterOptions, SseEventParser } from './adapters/createSseAdapter';
export { createFetchStreamAdapter } from './adapters/createFetchStreamAdapter';
export type { FetchStreamAdapterOptions, FetchChunkParser } from './adapters/createFetchStreamAdapter';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAiChat } from './hooks/useAiChat';
export type { UseAiChatOptions, UseAiChatReturn } from './hooks/useAiChat';

// ─── Provider ─────────────────────────────────────────────────────────────────
export { JuneauProvider } from './components/JuneauProvider/JuneauProvider';
export type { JuneauTheme } from './components/JuneauProvider/JuneauProvider';
export { AiChatProvider } from './context/AiChatProvider';
export { useAiChatContext } from './context/AiChatContext';
export type { AiChatContextValue } from './context/AiChatContext';

// ─── i18n ─────────────────────────────────────────────────────────────────────
export type { JuneauLabels } from './i18n/types';
export { juneauEn } from './i18n/locales/en';
export { juneauCs } from './i18n/locales/cs';

// ─── Components ───────────────────────────────────────────────────────────────
export { AiSidebar } from './components/AiSidebar/AiSidebar';
export { AiMessageList } from './components/AiMessageList/AiMessageList';
export { AiMessageBubble } from './components/AiMessageBubble/AiMessageBubble';
export { AiInput } from './components/AiInput/AiInput';
export type { AiInputAction } from './components/AiInput/AiInput';
export { AiTypingIndicator } from './components/AiTypingIndicator/AiTypingIndicator';
export { AiError } from './components/AiError/AiError';
export { AiMessagePartRenderer } from './components/parts/AiMessagePartRenderer';
export { AiTablePart } from './components/parts/AiTablePart';
export { AiProposalCard } from './components/parts/AiProposalCard';
export { AiActivityPart } from './components/parts/AiActivityPart';
