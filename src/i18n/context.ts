import { createContext, useContext } from 'react';
import type { JuneauLabels } from './types';
import { juneauEn } from './locales/en';

export const JuneauLabelsContext = createContext<JuneauLabels>(juneauEn);

/**
 * Returns the active label set. Falls back to English defaults for any
 * key not provided by the consumer's `labels` prop on `JuneauProvider`.
 */
export function useLabels(): JuneauLabels {
  return useContext(JuneauLabelsContext);
}
