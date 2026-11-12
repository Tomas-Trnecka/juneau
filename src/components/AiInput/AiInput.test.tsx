import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AiInput } from './AiInput';

const props = { value: 'Hi', onChange: () => {}, onSend: () => {}, isLoading: false };

describe('AiInput — data hooks', () => {
  it('marks the send button', () => {
    render(<AiInput {...props} />);

    expect(document.querySelector("[data-juneau='input-send']")).not.toBeNull();
    expect(document.querySelector("[data-juneau='input-stop']")).toBeNull();
  });

  it('marks the stop button that replaces it while streaming', () => {
    render(<AiInput {...props} isLoading onStop={() => {}} />);

    expect(document.querySelector("[data-juneau='input-stop']")).not.toBeNull();
    expect(document.querySelector("[data-juneau='input-send']")).toBeNull();
  });
});
