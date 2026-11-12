import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { AiMessage } from '../../core/types';
import { AiChat } from './AiChat';

const messages: AiMessage[] = [
  { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hello' }], createdAt: new Date() },
];

const baseProps: ComponentProps<typeof AiChat> = {
  messages,
  input: '',
  isLoading: false,
  isConnecting: false,
  error: null,
  onInputChange: () => {},
  onSend: () => {},
  onProposalConfirm: () => {},
  onProposalCancel: () => {},
};

const slot = (): Element | null => document.querySelector('[data-juneau-above-input]');

/** Direct children of the chat root, as their data-juneau names, in DOM order. */
function chatChildren(): (string | null)[] {
  const root = document.querySelector("[data-juneau='chat']");
  return Array.from(root?.children ?? []).map(el => el.getAttribute('data-juneau'));
}

describe('AiChat — aboveInput slot', () => {
  it('renders the slot between the messages and the input', () => {
    render(<AiChat {...baseProps} aboveInput={<span>Feedback</span>} />);

    expect(slot()?.textContent).toBe('Feedback');
    expect(chatChildren()).toEqual(['message-list', 'above-input', 'input']);
  });

  it('renders the slot below the error banner', () => {
    render(<AiChat {...baseProps} error='Oops' aboveInput={<span>Feedback</span>} />);

    expect(chatChildren()).toEqual(['message-list', 'error', 'above-input', 'input']);
  });

  it('renders no wrapper when the prop is omitted', () => {
    render(<AiChat {...baseProps} />);

    expect(slot()).toBeNull();
    expect(chatChildren()).toEqual(['message-list', 'input']);
  });

  it('renders no wrapper when the prop is null', () => {
    render(<AiChat {...baseProps} aboveInput={null} />);

    expect(slot()).toBeNull();
  });
});

describe('AiChat — centred empty layout', () => {
  const centred = { ...baseProps, messages: [], centerInputWhenEmpty: true };
  const startChildren = (): (string | null)[] =>
    Array.from(document.querySelector("[data-juneau='chat-start']")?.firstElementChild?.children ?? []).map(el =>
      el.getAttribute('data-juneau')
    );

  it('stacks the empty state, the input and the content below it while there are no messages', () => {
    render(
      <AiChat
        {...centred}
        emptyState={<div data-juneau='hero'>Hi</div>}
        belowInput={<span>Ideas</span>}
      />
    );

    expect(startChildren()).toEqual(['hero', 'input', 'below-input']);
    expect(document.querySelector("[data-juneau='message-list']")).toBeNull();
  });

  it('keeps the error and the slot above the input in the centred column', () => {
    render(<AiChat {...centred} error='Oops' aboveInput={<span>Notice</span>} emptyState={<p />} />);

    expect(startChildren()).toEqual([null, 'error', 'above-input', 'input']);
  });

  it('falls back to the default empty state when none is given', () => {
    render(<AiChat {...centred} />);

    expect(document.querySelector("[data-juneau='empty-state']")).not.toBeNull();
  });

  it('pins the input to the bottom and drops the content below it once there are messages', () => {
    render(<AiChat {...baseProps} centerInputWhenEmpty belowInput={<span>Ideas</span>} />);

    expect(chatChildren()).toEqual(['message-list', 'input']);
    expect(document.querySelector("[data-juneau='below-input']")).toBeNull();
  });

  it('keeps the default layout for an empty chat without the option', () => {
    render(<AiChat {...baseProps} messages={[]} belowInput={<span>Ideas</span>} />);

    expect(chatChildren()).toEqual(['message-list', 'input']);
  });
});
