import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { JuneauProvider } from '../src/components/JuneauProvider/JuneauProvider';

const preview: Preview = {
  decorators: [
    (Story) => (
      <JuneauProvider>
        <div style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: '#F4F4F6',
          padding: '1.5rem',
          minHeight: '100vh',
        }}>
          <Story />
        </div>
      </JuneauProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
