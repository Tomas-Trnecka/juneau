import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiChatHeader } from './AiChatHeader';

/** The actions container that holds consumer chrome plus the built-in buttons. */
function actionButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button'));
}

describe('AiChatHeader — headerActions slot', () => {
  it('renders consumer chrome in the header', () => {
    render(<AiChatHeader headerActions={<button>Settings</button>} />);

    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
  });

  // The slot must not require the built-in buttons to be present.
  it('renders the actions area for a slot alone, with no reset or minimize', () => {
    render(<AiChatHeader headerActions={<button>Settings</button>} />);

    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
  });

  it('places consumer chrome before the built-in buttons', () => {
    const { container } = render(
      <AiChatHeader headerActions={<button>Settings</button>} onMinimize={() => {}} />
    );

    expect(actionButtons(container)[0].textContent).toBe('Settings');
  });

  it('keeps the minimize button working alongside the slot', () => {
    const onMinimize = vi.fn();
    render(<AiChatHeader headerActions={<button>Settings</button>} onMinimize={onMinimize} />);

    screen.getByLabelText('Minimize').click();

    expect(onMinimize).toHaveBeenCalledOnce();
  });

  it('renders no actions area when neither a slot nor a button is given', () => {
    const { container } = render(<AiChatHeader />);

    expect(actionButtons(container)).toHaveLength(0);
  });

  // Juneau must not interpret the slot — it is opaque consumer content.
  it('does not wrap or alter the supplied node', () => {
    render(<AiChatHeader headerActions={<span data-testid="chrome">x</span>} />);

    expect(screen.getByTestId('chrome').tagName).toBe('SPAN');
  });
});
