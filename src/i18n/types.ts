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

  // AiInput
  inputPlaceholder: string;
  sendMessage: string;
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

  // AiError
  errorDismiss: string;
};
