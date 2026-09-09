import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AiChatProvider } from '../../context/AiChatProvider';
import { mockAdapter } from '../../adapters/mockAdapter';
import { AiSidebar } from './AiSidebar';

const withProvider = (ui: ReactNode) =>
  render(<AiChatProvider adapter={mockAdapter}>{ui}</AiChatProvider>);

/** The chat body only renders while expanded, so its presence reports the state. */
const isExpanded = (): boolean => document.querySelector("[data-juneau='chat']") !== null;

// fireEvent wraps the click in act(), so the re-render lands before the next assertion.
const toggle = (label: string) => fireEvent.click(screen.getByLabelText(label));

describe('AiSidebar — collapsed state', () => {
  it('owns its state and starts expanded when uncontrolled', () => {
    withProvider(<AiSidebar />);

    expect(isExpanded()).toBe(true);

    toggle('Minimize');
    expect(isExpanded()).toBe(false);
  });

  it('reports every toggle so the consumer can persist it', () => {
    const onMinimizedChange = vi.fn();
    withProvider(<AiSidebar onMinimizedChange={onMinimizedChange} />);

    toggle('Minimize');
    expect(onMinimizedChange).toHaveBeenCalledWith(true);

    toggle('Expand');
    expect(onMinimizedChange).toHaveBeenLastCalledWith(false);
  });

  it('honours a controlled collapsed value', () => {
    withProvider(<AiSidebar minimized />);

    expect(isExpanded()).toBe(false);
  });

  // Controlled means the parent decides — the sidebar must not flip itself.
  it('does not self-toggle when controlled, only reports intent', () => {
    const onMinimizedChange = vi.fn();
    withProvider(<AiSidebar minimized onMinimizedChange={onMinimizedChange} />);

    toggle('Expand');

    expect(onMinimizedChange).toHaveBeenCalledWith(false);
    expect(isExpanded()).toBe(false);
  });
});

describe('AiSidebar — badge slot', () => {
  it('renders a consumer badge in the header', () => {
    withProvider(<AiSidebar badge={<span>1</span>} />);

    expect(document.querySelector("[data-juneau='header-badge']")?.textContent).toBe('1');
  });

  it('renders no badge slot when none is given', () => {
    withProvider(<AiSidebar />);

    expect(document.querySelector("[data-juneau='header-badge']")).toBeNull();
  });

  // The badge must survive collapsing — that is the whole point of it.
  it('keeps the badge visible while collapsed', () => {
    withProvider(<AiSidebar minimized badge={<span>1</span>} />);

    expect(isExpanded()).toBe(false);
    expect(document.querySelector("[data-juneau='header-badge']")?.textContent).toBe('1');
  });
});
