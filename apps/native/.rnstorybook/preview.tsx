import type { Preview } from '@storybook/react';
import { View } from 'react-native';

const preview: Preview = {
  decorators: [
    (Story) => (
      // biome-ignore lint/plugin: exception for storybook preview
      <View style={{ flex: 1, alignItems: 'flex-start', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'plain',
      values: [
        { name: 'plain', value: '#ffffff' },
        { name: 'dark', value: '#18181b' },
      ],
    },
  },
};

export default preview;
