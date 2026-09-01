import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AiMessageBubble } from './AiMessageBubble';
import type { AiMessage, AiMessagePart } from '../../core/types';

function makeMessage(parts: AiMessagePart[]): AiMessage {
  return { id: 'm1', role: 'assistant', parts, createdAt: new Date() };
}

function renderBubble(parts: AiMessagePart[]) {
  return render(
    <AiMessageBubble
      message={makeMessage(parts)}
      onProposalConfirm={() => {}}
      onProposalCancel={() => {}}
    />
  );
}

function segments(container: HTMLElement, kind: 'bubble' | 'block') {
  return Array.from(container.querySelectorAll(`[data-juneau-segment="${kind}"]`));
}

describe('AiMessageBubble segmentation', () => {
  it('keeps consecutive text parts in a single bubble', () => {
    const { container } = renderBubble([
      { type: 'text', text: 'one' },
      { type: 'text', text: 'two' },
    ]);

    expect(segments(container, 'bubble')).toHaveLength(1);
    expect(segments(container, 'block')).toHaveLength(0);
  });

  it('renders each card part as its own full-width block outside the bubble', () => {
    const { container } = renderBubble([
      { type: 'text', text: 'Here you go:' },
      { type: 'entity', entity: { id: 'e1', title: 'Acme', fields: [] } },
      { type: 'entity', entity: { id: 'e2', title: 'Globex', fields: [] } },
      { type: 'text', text: 'Anything else?' },
    ]);

    // Two prose runs stay bubbled, each card becomes a standalone block.
    expect(segments(container, 'bubble')).toHaveLength(2);
    expect(segments(container, 'block')).toHaveLength(2);
  });

  it('treats activity parts as inline chat chrome, not cards', () => {
    const { container } = renderBubble([
      { type: 'text', text: 'Working…' },
      { type: 'activity', label: 'Loading invoices', status: 'running' },
    ]);

    expect(segments(container, 'bubble')).toHaveLength(1);
    expect(segments(container, 'block')).toHaveLength(0);
  });

  it('still renders a bubble for an empty message', () => {
    const { container } = renderBubble([]);

    expect(segments(container, 'bubble')).toHaveLength(1);
  });
});
