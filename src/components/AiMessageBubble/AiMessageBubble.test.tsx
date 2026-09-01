import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AiMessageBubble } from './AiMessageBubble';
import type { AiMessage, AiMessagePart } from '../../core/types';

function renderBubble(parts: AiMessagePart[], role: AiMessage['role'] = 'assistant') {
  return render(
    <AiMessageBubble
      message={{ id: 'm1', role, parts, createdAt: new Date() }}
      onProposalConfirm={() => {}}
      onProposalCancel={() => {}}
    />
  );
}

function segments(container: HTMLElement, kind: 'bubble' | 'card') {
  return Array.from(container.querySelectorAll(`[data-juneau-segment="${kind}"]`));
}

/** The wrapper is the message row that owns avatar placement. */
function wrapper(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

const CARD: AiMessagePart = { type: 'entity', entity: { id: 'e1', title: 'Acme', fields: [] } };

describe('AiMessageBubble — plain chat messages', () => {
  it('renders a text-only message as a single direct bubble child (no extra column)', () => {
    const { container } = renderBubble([
      { type: 'text', text: 'one' },
      { type: 'text', text: 'two' },
    ]);

    expect(segments(container, 'bubble')).toHaveLength(1);
    expect(segments(container, 'card')).toHaveLength(0);
    // The bubble must stay a direct child of the row — a wrapping column is what
    // previously broke avatar alignment for ordinary chat messages.
    expect(segments(container, 'bubble')[0].parentElement).toBe(wrapper(container));
  });

  it('keeps the assistant avatar as the first child of the row', () => {
    const { container } = renderBubble([{ type: 'text', text: 'hi' }]);
    const row = wrapper(container);

    expect(row.children.length).toBe(2);
    expect(row.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(row.lastElementChild?.getAttribute('data-juneau-segment')).toBe('bubble');
  });

  it('keeps the user avatar as the last child of the row', () => {
    const { container } = renderBubble([{ type: 'text', text: 'hi' }], 'user');
    const row = wrapper(container);

    expect(row.children.length).toBe(2);
    expect(row.firstElementChild?.getAttribute('data-juneau-segment')).toBe('bubble');
    expect(row.lastElementChild?.getAttribute('data-juneau-segment')).toBeNull();
  });

  it('treats activity and error parts as inline prose, not cards', () => {
    const { container } = renderBubble([
      { type: 'text', text: 'Working…' },
      { type: 'activity', label: 'Loading invoices', status: 'running' },
      { type: 'error', message: 'nope' },
    ]);

    expect(segments(container, 'bubble')).toHaveLength(1);
    expect(segments(container, 'card')).toHaveLength(0);
  });

  it('still renders a bubble for an empty message', () => {
    const { container } = renderBubble([]);

    expect(segments(container, 'bubble')).toHaveLength(1);
    expect(segments(container, 'card')).toHaveLength(0);
  });
});

describe('AiMessageBubble — messages carrying a card', () => {
  it('splits a card and its follow-up text into separate segments', () => {
    const { container } = renderBubble([
      { type: 'text', text: 'Here you go:' },
      CARD,
      { type: 'text', text: 'Anything else?' },
    ]);

    // Prose before and after the card stay bubbled; the card stands alone.
    expect(segments(container, 'bubble')).toHaveLength(2);
    expect(segments(container, 'card')).toHaveLength(1);
  });

  it('gives each consecutive card its own full-width segment', () => {
    const { container } = renderBubble([
      CARD,
      { type: 'entity', entity: { id: 'e2', title: 'Globex', fields: [] } },
    ]);

    expect(segments(container, 'card')).toHaveLength(2);
    expect(segments(container, 'bubble')).toHaveLength(0);
  });

  it('still renders the avatar exactly once alongside a card', () => {
    const { container } = renderBubble([CARD]);
    const row = wrapper(container);

    // Avatar + the card column — the avatar must not be duplicated or dropped.
    expect(row.children.length).toBe(2);
    expect(row.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('treats table and proposal parts as cards', () => {
    const { container } = renderBubble([
      { type: 'table', columns: ['A'], rows: [{ A: '1' }] },
      {
        type: 'proposal',
        proposal: { id: 'p1', title: 'Do it', description: 'desc' },
      },
    ]);

    expect(segments(container, 'card')).toHaveLength(2);
  });
});
