import type { CSSProperties, ReactNode } from 'react';
import '../../styles/tokens.css';
import { JuneauLabelsContext } from '../../i18n/context';
import { juneauEn } from '../../i18n/locales/en';
import type { JuneauLabels } from '../../i18n/types';
import styles from './JuneauProvider.module.css';

export type { JuneauLabels };

export type JuneauTheme = {
  colorPrimary?: string;
  colorPrimaryDark?: string;
  colorPrimaryLight?: string;
  colorPrimaryBorder?: string;
  colorAccent?: string;
  colorAccentDark?: string;
  colorAccentLight?: string;
  colorAccentBorder?: string;
  colorSurface?: string;
  colorSurfaceRaised?: string;
  colorSurfaceHover?: string;
  colorBorder?: string;
  colorBorderSubtle?: string;
  colorTextPrimary?: string;
  colorTextSecondary?: string;
  colorTextMuted?: string;
  colorTextFaint?: string;
  colorTextInverse?: string;
  colorAssistantAvatar?: string;
  radiusSm?: string;
  radiusMd?: string;
  radiusLg?: string;
  /** Override the font family used across all Juneau components. */
  fontFamily?: string;
};

type Props = {
  children: ReactNode;
  theme?: JuneauTheme;
  /**
   * Override any subset of UI strings. Unspecified keys fall back to English.
   * Use the exported `juneauCs` or `juneauEn` objects, or build your own from `JuneauLabels`.
   */
  labels?: Partial<JuneauLabels>;
  /**
   * Sets the sidebar title globally for every `AiSidebar` rendered inside this
   * provider. Equivalent to overriding `labels.sidebarTitle` but more
   * discoverable — no need to spread the whole labels object just to set a name.
   *
   * A `title` prop passed directly to `AiSidebar` still takes precedence.
   *
   * @example
   * <JuneauProvider defaultTitle="Tappeer AI">…</JuneauProvider>
   */
  defaultTitle?: string;
  className?: string;
  style?: CSSProperties;
};

export function JuneauProvider({ children, theme, labels, defaultTitle, className, style }: Props) {
  const resolvedLabels: JuneauLabels = {
    ...juneauEn,
    ...(defaultTitle ? { sidebarTitle: defaultTitle } : {}),
    ...labels,
  };

  const themeVars = theme ? buildThemeVars(theme) : undefined;

  return (
    <JuneauLabelsContext.Provider value={resolvedLabels}>
      <div
        className={[styles.root, className].filter(Boolean).join(' ')}
        style={{ ...themeVars, ...style }}
      >
        {children}
      </div>
    </JuneauLabelsContext.Provider>
  );
}

function buildThemeVars(theme: JuneauTheme): CSSProperties {
  const map: Record<string, string | undefined> = {
    '--juneau-color-primary':          theme.colorPrimary,
    '--juneau-color-primary-dark':     theme.colorPrimaryDark,
    '--juneau-color-primary-light':    theme.colorPrimaryLight,
    '--juneau-color-primary-border':   theme.colorPrimaryBorder,
    '--juneau-color-accent':           theme.colorAccent,
    '--juneau-color-accent-dark':      theme.colorAccentDark,
    '--juneau-color-accent-light':     theme.colorAccentLight,
    '--juneau-color-accent-border':    theme.colorAccentBorder,
    '--juneau-color-surface':          theme.colorSurface,
    '--juneau-color-surface-raised':   theme.colorSurfaceRaised,
    '--juneau-color-surface-hover':    theme.colorSurfaceHover,
    '--juneau-color-border':           theme.colorBorder,
    '--juneau-color-border-subtle':    theme.colorBorderSubtle,
    '--juneau-color-text-primary':     theme.colorTextPrimary,
    '--juneau-color-text-secondary':   theme.colorTextSecondary,
    '--juneau-color-text-muted':       theme.colorTextMuted,
    '--juneau-color-text-faint':       theme.colorTextFaint,
    '--juneau-color-text-inverse':     theme.colorTextInverse,
    '--juneau-color-assistant-avatar': theme.colorAssistantAvatar,
    '--juneau-radius-sm':              theme.radiusSm,
    '--juneau-radius-md':              theme.radiusMd,
    '--juneau-radius-lg':              theme.radiusLg,
    '--juneau-font-family':            theme.fontFamily,
  };

  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => v !== undefined)
  ) as CSSProperties;
}
