import { describe, it, expect } from 'vitest';
import { serializeForStorage, deserializeMessages, trimHistory, trimChats, isProposalPart } from './history';
import type { AiChatSummary, AiMessage } from './types';

const msg = (role: AiMessage['role'], parts: AiMessage['parts'], id = 'm1'): AiMessage => ({
  id,
  role,
  parts,
  createdAt: new Date('2025-01-10T10:00:00Z'),
});

describe('serializeForStorage', () => {
  it('converts createdAt to an ISO string', () => {
    const stored = serializeForStorage([msg('user', [{ type: 'text', text: 'hi' }])]);
    expect(stored[0].createdAt).toBe('2025-01-10T10:00:00.000Z');
  });

  it('marks unresolved proposals as expired', () => {
    const stored = serializeForStorage([
      msg('assistant', [
        { type: 'proposal', proposal: { id: 'p1', title: 'Do it' } },
      ]),
    ]);
    const part = stored[0].parts[0];
    expect(part.type).toBe('proposal');
    if (isProposalPart(part)) {
      expect(part.proposal.resolved).toBe('expired');
    }
  });

  it('keeps already-resolved proposals untouched', () => {
    const stored = serializeForStorage([
      msg('assistant', [
        { type: 'proposal', proposal: { id: 'p1', title: 'Done', resolved: 'confirmed' } },
      ]),
    ]);
    const part = stored[0].parts[0];
    if (isProposalPart(part)) {
      expect(part.proposal.resolved).toBe('confirmed');
    }
  });

  it('drops running activity parts but keeps done ones', () => {
    const stored = serializeForStorage([
      msg('assistant', [
        { type: 'activity', title: 'Searching', status: 'running' },
        { type: 'activity', title: 'Searched', status: 'done' },
        { type: 'text', text: 'result' },
      ]),
    ]);
    expect(stored[0].parts).toHaveLength(2);
    expect(stored[0].parts[0]).toMatchObject({ type: 'activity', status: 'done' });
  });

  it('round-trips entity and entity-list parts unchanged', () => {
    const entityParts: AiMessage['parts'] = [
      {
        type: 'entity',
        entityType: 'record',
        entity: {
          id: 'e1',
          title: 'Record one',
          fields: [{ label: 'Status', value: 'Approved', badge: 'success' }],
        },
      },
      {
        type: 'entity-list',
        title: 'Results',
        entities: [{ title: 'A' }, { title: 'B' }],
      },
    ];
    const stored = serializeForStorage([msg('assistant', entityParts)]);
    const restored = deserializeMessages(stored);
    expect(restored[0].parts).toEqual(entityParts);
  });

  it('does not mutate the input messages', () => {
    const original = msg('assistant', [
      { type: 'proposal', proposal: { id: 'p1', title: 'Do it' } },
    ]);
    serializeForStorage([original]);
    const part = original.parts[0];
    if (isProposalPart(part)) {
      expect(part.proposal.resolved).toBeUndefined();
    }
  });
});

describe('deserializeMessages', () => {
  it('revives createdAt as a Date after a JSON round-trip', () => {
    const original = [msg('user', [{ type: 'text', text: 'hi' }])];
    const roundTripped = JSON.parse(JSON.stringify(serializeForStorage(original)));
    const restored = deserializeMessages(roundTripped);
    expect(restored[0].createdAt).toBeInstanceOf(Date);
    expect(restored[0].createdAt.getTime()).toBe(original[0].createdAt.getTime());
  });

  it('preserves rich parts through the round-trip', () => {
    const original = [
      msg('assistant', [
        { type: 'table', columns: ['a'], rows: [{ a: 1 }] },
        { type: 'my-custom', foo: 'bar' },
      ]),
    ];
    const restored = deserializeMessages(
      JSON.parse(JSON.stringify(serializeForStorage(original)))
    );
    expect(restored[0].parts).toEqual(original[0].parts);
  });
});

describe('trimHistory', () => {
  const conversation: AiMessage[] = [
    msg('user', [{ type: 'text', text: 'q1' }], 'u1'),
    msg('assistant', [{ type: 'text', text: 'a1' }], 'a1'),
    msg('user', [{ type: 'text', text: 'q2' }], 'u2'),
    msg('assistant', [{ type: 'text', text: 'a2' }], 'a2'),
    msg('user', [{ type: 'text', text: 'q3' }], 'u3'),
  ];

  it('returns messages unchanged when under the limit', () => {
    expect(trimHistory(conversation, 10)).toBe(conversation);
  });

  it('keeps the most recent messages within the limit', () => {
    const trimmed = trimHistory(conversation, 3);
    expect(trimmed.map(m => m.id)).toEqual(['u2', 'a2', 'u3']);
  });

  it('never starts the trimmed history with an assistant message', () => {
    const trimmed = trimHistory(conversation, 4);
    // limit 4 would start at 'a1' — the cut moves forward to 'u2'
    expect(trimmed.map(m => m.id)).toEqual(['u2', 'a2', 'u3']);
  });

  it('returns messages unchanged when limit is zero or negative', () => {
    expect(trimHistory(conversation, 0)).toBe(conversation);
  });
});

describe('trimChats', () => {
  const chat = (id: string, updated: string): AiChatSummary => ({
    id,
    title: id,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date(updated),
  });

  it('keeps the most recently updated chats', () => {
    const chats = [
      chat('old', '2025-01-01T00:00:00Z'),
      chat('newest', '2025-01-10T00:00:00Z'),
      chat('middle', '2025-01-05T00:00:00Z'),
    ];
    const kept = trimChats(chats, 2);
    expect(kept.map(c => c.id)).toEqual(['newest', 'middle']);
  });

  it('sorts without trimming when under the limit', () => {
    const chats = [
      chat('old', '2025-01-01T00:00:00Z'),
      chat('new', '2025-01-10T00:00:00Z'),
    ];
    expect(trimChats(chats, 5).map(c => c.id)).toEqual(['new', 'old']);
  });
});
