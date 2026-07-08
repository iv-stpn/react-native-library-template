import type { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    label: 'Press me',
    onPress: fn(),
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};

/** Pressing the button fires `onPress` exactly once. */
export const FiresOnPress: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Press me' }));
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

/** A disabled button is exposed as disabled and ignores presses. */
export const IgnoresPressWhenDisabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Press me' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    // A disabled Pressable has `pointer-events: none`, so a real user cannot
    // click it; dispatch the event directly to prove onPress is still guarded.
    await fireEvent.click(button);
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

export default meta;
