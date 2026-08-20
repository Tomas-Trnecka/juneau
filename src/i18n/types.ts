/**
 * All user-facing strings rendered by Juneau components.
 *
 * Pass a partial or full object to `JuneauProvider` via the `labels` prop.
 * Any key you omit falls back to the English default from `juneauEn`.
 */
export type JuneauLabels = {
  // AiSidebar
  sidebarTitle: string;
  clearConversation: string;
  resetConversation: string;
  minimizeSidebar: string;
  expandSidebar: string;

  // AiMessageBubble
  userLabel: string;

  // AiInput
  inputPlaceholder: string;
  sendMessage: string;
  stopMessage: string;

  // AiTypingIndicator
  typingMessage: string;
  connectingMessage: string;
  actionAddFile: string;
  actionQuickActions: string;
  actionNew: string;
  actionHistory: string;
  actionRules: string;

  // AiMessageList — empty state
  emptyStateText: string;
  emptyStateHint: string;

  // AiProposalCard — fallback labels when the proposal doesn't specify its own
  proposalConfirm: string;
  proposalCancel: string;
  // AiProposalCard — badges shown once a proposal is resolved
  proposalConfirmed: string;
  proposalCancelled: string;
  proposalExpired: string;

  // AiError
  errorDismiss: string;

  // AiChatHistoryList
  historyEmpty: string;
  historyDeleteChat: string;
};
