import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AiChatSummary } from '../../core/types';
import { AiChatHistoryList } from './AiChatHistoryList';

describe('AiChatHistoryList — dates', () => {
  it('shows a consumer-formatted date label as given', () => {
    render(<AiChatHistoryList chats={[{ id: 'c1', title: 'Invoices', dateLabel: '12. 11.' }]} onSelect={() => {}} />);

    expect(screen.getByText('12. 11.')).toBeTruthy();
  });

  it('prefers the label over updatedAt', () => {
    const updatedAt = new Date(2026, 0, 5);
    render(
      <AiChatHistoryList chats={[{ id: 'c1', title: 'Invoices', updatedAt, dateLabel: 'today' }]} onSelect={() => {}} />
    );

    expect(screen.getByText('today')).toBeTruthy();
    expect(screen.queryByText(updatedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))).toBeNull();
  });

  it('still formats updatedAt for a plain chat summary', () => {
    const updatedAt = new Date(2026, 0, 5);
    const summary: AiChatSummary = { id: 'c1', title: 'Invoices', createdAt: updatedAt, updatedAt };
    render(<AiChatHistoryList chats={[summary]} onSelect={() => {}} />);

    expect(screen.getByText(updatedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))).toBeTruthy();
  });

  it('renders no date without either', () => {
    const { container } = render(<AiChatHistoryList chats={[{ id: 'c1', title: 'Invoices' }]} onSelect={() => {}} />);

    expect(container.querySelector('li')?.textContent).toBe('Invoices');
  });
});
