import type { AiStreamEvent, JuneauWireEvent } from '../core/types';

/**
 * Parses a single JSON string as a Juneau wire protocol event and maps it
 * to one or more AiStreamEvents.
 *
 * Used by both createSseAdapter and createFetchStreamAdapter as their default
 * parser when the backend streams Juneau-compatible JSON.
 *
 * Returns an empty array for unrecognised or unparseable input — never throws.
 */
export function parseJuneauWire(raw: string): AiStreamEvent[] {
  if (!raw || raw === '[DONE]') return [];

  let wire: JuneauWireEvent;
  try {
    wire = JSON.parse(raw) as JuneauWireEvent;
  } catch {
    return [];
  }

  switch (wire.type) {
    case 'text':
      return wire.text ? [{ type: 'text', text: wire.text }] : [];

    case 'activity':
      return [{
        type: 'part',
        part: {
          type: 'activity',
          id: wire.id,
          title: wire.title,
          description: wire.description,
          status: wire.status,
          metadata: wire.metadata,
        },
      }];

    case 'part':
      return [{ type: 'part', part: wire.part }];

    case 'done':
      return [{ type: 'done' }];

    case 'error':
      return [{ type: 'error', message: wire.message }];

    default:
      return [];
  }
}
