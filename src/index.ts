// ─── Core types ───────────────────────────────────────────────────────────────
export type {
  AiMessage,
  AiMessageRole,
  AiMessagePart,
  AiTextPart,
  AiTablePart as AiTablePartType,
  AiProposalPart,
  AiProposal,
  AiErrorPart,
  AiBackendAdapter,
  AiAdapterInput,
  AiStreamEvent,
  AiStreamTextEvent,
  AiStreamPartEvent,
  AiStreamDoneEvent,
  AiStreamErrorEvent,
} from './core/types';

export { consumeStream, delay } from './core/stream';

// ─── Adapters ─────────────────────────────────────────────────────────────────
export { mockAdapter } from './adapters/mockAdapter';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAiChat } from './hooks/useAiChat';
export type { UseAiChatOptions, UseAiChatReturn } from './hooks/useAiChat';

// ─── Provider ─────────────────────────────────────────────────────────────────
export { JuneauProvider } from './components/JuneauProvider/JuneauProvider';
export type { JuneauTheme } from './components/JuneauProvider/JuneauProvider';

// ─── i18n ─────────────────────────────────────────────────────────────────────
export type { JuneauLabels } from './i18n/types';
export { juneauEn } from './i18n/locales/en';
export { juneauCs } from './i18n/locales/cs';

// ─── Components ───────────────────────────────────────────────────────────────
export { AiSidebar } from './components/AiSidebar/AiSidebar';
export { AiMessageList } from './components/AiMessageList/AiMessageList';
export { AiMessageBubble } from './components/AiMessageBubble/AiMessageBubble';
export { AiInput } from './components/AiInput/AiInput';
export { AiTypingIndicator } from './components/AiTypingIndicator/AiTypingIndicator';
export { AiError } from './components/AiError/AiError';
export { AiMessagePartRenderer } from './components/parts/AiMessagePartRenderer';
export { AiTablePart } from './components/parts/AiTablePart';
export { AiProposalCard } from './components/parts/AiProposalCard';
