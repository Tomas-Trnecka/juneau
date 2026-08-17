import type { CSSProperties } from 'react';

type IconProps = {
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
};

export function IconWandMagicSparkles({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* Font Awesome "crow" solid (FA 6 free) — viewBox 0 0 640 512 */}
      <path d="M456 0c-48.6 0-88 39.4-88 88l0 29.2L12.5 390.6c-14 10.8-16.6 30.9-5.9 44.9s30.9 16.6 44.9 5.9L126.1 384l133.1 0 46.6 113.1c5 12.3 19.1 18.1 31.3 13.1s18.1-19.1 13.1-31.3L311.1 384l40.9 0c1.1 0 2.1 0 3.2 0l46.6 113.2c5 12.3 19.1 18.1 31.3 13.1s18.1-19.1 13.1-31.3l-42-102C484.9 354.1 544 280 544 192l0-64 0-8 80.5-20.1c8.6-2.1 13.8-10.8 11.6-19.4C629 52 603.4 32 574 32l-50.1 0C507.7 12.5 483.3 0 456 0zm0 64a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
    </svg>
  );
}

export function IconPaperPlane({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "paper-plane" solid */}
      <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s6.2-22.8 16.4-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
    </svg>
  );
}

export function IconPaperclip({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "paperclip" solid */}
      <path d="M364.2 83.8c-24.4-24.4-64-24.4-88.4 0l-184 184c-42.1 42.1-42.1 110.3 0 152.4s110.3 42.1 152.4 0l152-152c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-152 152c-64 64-167.6 64-231.6 0s-64-167.6 0-231.6l184-184c46.3-46.3 121.3-46.3 167.6 0s46.3 121.3 0 167.6l-176 176c-28.6 28.6-75 28.6-103.6 0s-28.6-75 0-103.6l144-144c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-144 144c-6.7 6.7-6.7 17.7 0 24.4s17.7 6.7 24.4 0l176-176c24.4-24.4 24.4-64 0-88.4z" />
    </svg>
  );
}

export function IconBolt({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "bolt" solid */}
      <path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288l111.5 0L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7l-111.5 0L349.4 44.6z" />
    </svg>
  );
}

export function IconPlus({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "plus" solid */}
      <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
    </svg>
  );
}

export function IconClockRotateLeft({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "clock-rotate-left" / "history" solid */}
      <path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9L0 168c0 13.3 10.7 24 24 24l110.1 0c21.4 0 32.1-25.9 17-41l-31.8-31.8C143.9 83.5 196.2 64 252.6 64C370.8 64 464 157.8 464 276c0 77.5-40.8 145.4-102 182.9c-15.1 9.2-19.9 29-10.7 44.1s29 19.9 44.1 10.7C471 467.5 528 378.4 528 276C528 124.1 404.5 0 252.6 0C186 0 125.3 26.4 80 70.2L75 75zM256 152c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z" />
    </svg>
  );
}

export function IconScroll({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 576 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "scroll" solid */}
      <path d="M0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 16 192 0 0-16c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-26.6 0c-25.8 50.9-72.7 88.5-129.4 99.8L384 416l32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-72.2C135.3 332.5 88.4 294.9 62.6 244L48 244c-26.5 0-48-21.5-48-48L0 80zM128 240c0 70.7 57.3 128 128 128s128-57.3 128-128l0-128L128 112l0 128zM512 176l0-64-64 0 0 64-48 0 0 16c0 8.8-.7 17.4-2 25.8c3.3 .1 6.6 .2 9.9 .2l56 0c26.5 0 48-21.5 48-48l0-64zM48 176c0 26.5 21.5 48 48 48l56 0c3.4 0 6.7-.1 9.9-.2c-1.3-8.4-2-17-2-25.8l0-16-48 0 0-64-64 0 0 58z" />
    </svg>
  );
}

export function IconWindowMinimize({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* Font Awesome "window-minimize" solid (FA 6 free) */}
      <path d="M32 416c-17.7 0-32 14.3-32 32s14.3 32 32 32l448 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 416z" />
    </svg>
  );
}

export function IconWindowRestore({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* Font Awesome "window-restore" solid (FA 6 free) */}
      <path d="M432 64L208 64c-8.8 0-16 7.2-16 16l0 16-64 0 0-16c0-44.2 35.8-80 80-80L432 0c44.2 0 80 35.8 80 80l0 224c0 44.2-35.8 80-80 80l-16 0 0-64 16 0c8.8 0 16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zM0 192c0-35.3 28.7-64 64-64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 192zm64 32c0 17.7 14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 192c-17.7 0-32 14.3-32 32z" />
    </svg>
  );
}

export function IconArrowRotateLeft({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      {/* FA "arrow-rotate-left" solid */}
      <path d="M125.7 160H176c17.7 0 32 14.3 32 32s-14.3 32-32 32H48c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32s32 14.3 32 32v51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z" />
    </svg>
  );
}

export function IconWarning({ className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}
