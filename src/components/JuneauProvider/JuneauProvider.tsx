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
  colorErrorBg?: string;
  colorErrorBorder?: string;
  colorErrorText?: string;
  colorSuccessBg?: string;
  colorSuccessText?: string;
  colorWarningBg?: string;
  colorWarningText?: string;
  colorDangerBg?: string;
  colorDangerText?: string;
  radiusSm?: string;
  radiusMd?: string;
  radiusLg?: string;
  radiusFull?: string;
  fontSizeXs?: string;
  fontSizeSm?: string;
  fontSizeBase?: string;
  fontSizeMd?: string;
  fontSizeLg?: string;
  fontSizeXl?: string;
  fontSize2xl?: string;
  fontSize3xl?: string;
  /** Override the font family used across all Juneau components. */
  fontFamily?: string;
  /** Duration for all transitions, e.g. '0.2s'. */
  transitionFast?: string;
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
    '--juneau-color-error-bg':         theme.colorErrorBg,
    '--juneau-color-error-border':     theme.colorErrorBorder,
    '--juneau-color-error-text':       theme.colorErrorText,
    '--juneau-color-success-bg':       theme.colorSuccessBg,
    '--juneau-color-success-text':     theme.colorSuccessText,
    '--juneau-color-warning-bg':       theme.colorWarningBg,
    '--juneau-color-warning-text':     theme.colorWarningText,
    '--juneau-color-danger-bg':        theme.colorDangerBg,
    '--juneau-color-danger-text':      theme.colorDangerText,
    '--juneau-radius-sm':              theme.radiusSm,
    '--juneau-radius-md':              theme.radiusMd,
    '--juneau-radius-lg':              theme.radiusLg,
    '--juneau-radius-full':            theme.radiusFull,
    '--juneau-font-size-xs':           theme.fontSizeXs,
    '--juneau-font-size-sm':           theme.fontSizeSm,
    '--juneau-font-size-base':         theme.fontSizeBase,
    '--juneau-font-size-md':           theme.fontSizeMd,
    '--juneau-font-size-lg':           theme.fontSizeLg,
    '--juneau-font-size-xl':           theme.fontSizeXl,
    '--juneau-font-size-2xl':          theme.fontSize2xl,
    '--juneau-font-size-3xl':          theme.fontSize3xl,
    '--juneau-font-family':            theme.fontFamily,
    '--juneau-transition-fast':        theme.transitionFast,
  };

  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => v !== undefined)
  ) as CSSProperties;
}
