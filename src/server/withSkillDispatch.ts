import type { SkillDispatchOptions } from './types';
import { selectSkillsById } from './skillIndex';
import { streamToWire } from './streamToWire';

function wireError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
}

function wireDone(): string {
  return `data: ${JSON.stringify({ type: 'done' })}\n\n`;
}

/**
 * Extracts the text payload from wire SSE chunks' `data: {json}` lines.
 * Returns '' for non-text events or unparseable lines.
 */
function extractWireText(chunk: string): string {
  let text = '';
  for (const line of chunk.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    try {
      const event = JSON.parse(line.slice(6)) as { type?: string; text?: string };
      if (event.type === 'text' && typeof event.text === 'string') {
        text += event.text;
      }
    } catch {
      // Not JSON — ignore
    }
  }
  return text;
}

/**
 * Resolves the full message history from a consumed ai-sdk StreamTextResult.
 * Mirrors the same logic used in withToolRecovery — see that file for rationale.
 */
async function resolveMessages(result: {
  messages?: PromiseLike<unknown[]>;
  response?: PromiseLike<{ messages?: unknown[] }>;
}): Promise<unknown[] | null> {
  if (result.messages) {
    const messages = await result.messages;
    if (Array.isArray(messages) && messages.length > 0) return messages;
  }
  if (result.response) {
    const response = await result.response;
    if (Array.isArray(response?.messages) && response.messages.length > 0) {
      return response.messages;
    }
  }
  return null;
}

/**
 * Deliberate 2-phase skill dispatch pattern.
 *
 * Phase 1: stream with a compact skill index (buildSkillIndex) as the system
 *   prompt and thin tool definitions. The model picks a skill by calling one
 *   of the tools — calledSkillIds is populated as tools fire.
 *
 * Phase 2: always runs when at least one skill was called. Receives:
 *   - the full workflow instructions for the called skills (selectSkillsById)
 *   - the complete phase 1 message history (user + tool-call + tool-result turns)
 *   The model is called again without tools so it reads the instructions and
 *   produces a text response.
 *
 * If no skill was called in phase 1 (the model answered directly), the phase 1
 * text is emitted as-is and the stream ends — no phase 2 needed.
 *
 * This is distinct from withToolRecovery: phase 2 here is unconditional and
 * intentional, not a fallback for failure or Gemini silent-response scenarios.
 *
 * Errors thrown by phase 2 are emitted as wire error events, never swallowed.
 */
export async function* withSkillDispatch(options: SkillDispatchOptions): AsyncIterable<string> {
  const { phase1, phase2, skillSet, onFinish, debug = false } = options;

  if (debug) {
    console.debug('[juneau] withSkillDispatch → phase 1 start');
  }

  let accumulatedText = '';
  let producedText = false;

  const result1 = phase1();

  for await (const chunk of streamToWire(result1.fullStream, skillSet, { debug })) {
    accumulatedText += extractWireText(chunk);
    if (chunk.includes('"type":"text"')) producedText = true;

    // Hold back the done event — we may continue with phase 2
    if (chunk.includes('"type":"done"')) continue;

    yield chunk;
  }

  if (debug) {
    console.debug(
      `[juneau] withSkillDispatch → phase 1 complete, calledSkillIds=[${skillSet.calledSkillIds.join(', ')}], textProduced=${producedText}`
    );
  }

  // No skill was called — model answered directly, we're done
  if (skillSet.calledSkillIds.length === 0) {
    if (debug) {
      console.debug('[juneau] withSkillDispatch → no skill called, emitting done');
    }
    onFinish?.({ text: accumulatedText });
    yield wireDone();
    return;
  }

  // Resolve the full phase 1 history (incl. tool-call + tool-result turns)
  const fullMessages = await resolveMessages(result1);

  if (!fullMessages) {
    // Shouldn't happen in practice, but fail loudly rather than silently
    if (debug) {
      console.debug('[juneau] withSkillDispatch → could not resolve phase 1 history, emitting error');
    }
    yield wireError('withSkillDispatch: could not resolve phase 1 message history for phase 2');
    return;
  }

  const instructions = selectSkillsById(skillSet, skillSet.calledSkillIds);

  if (debug) {
    console.debug(
      `[juneau] withSkillDispatch → phase 2 start, instructions length=${instructions.length}, history turns=${fullMessages.length}`
    );
  }

  try {
    for await (const chunk of streamToWire(phase2(instructions, fullMessages).fullStream, undefined, { debug })) {
      accumulatedText += extractWireText(chunk);
      if (chunk.includes('"type":"done"')) continue;
      yield chunk;
    }

    if (debug) {
      console.debug('[juneau] withSkillDispatch → phase 2 complete');
    }

    onFinish?.({ text: accumulatedText });
    yield wireDone();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (debug) {
      console.debug(`[juneau] withSkillDispatch → phase 2 FAILED: "${message}"`);
    }
    yield wireError(message);
  }
}
