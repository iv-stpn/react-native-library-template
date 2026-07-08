import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button label="Save" />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onPress when pressed', () => {
    const onPress = vi.fn();
    render(<Button label="Save" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = vi.fn();
    render(<Button label="Save" onPress={onPress} disabled={true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner instead of the label while loading', () => {
    const onPress = vi.fn();
    render(<Button label="Save" onPress={onPress} loading={true} />);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
