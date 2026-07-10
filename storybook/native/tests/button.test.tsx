import { Button } from '@template/ui/button';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-mobile/runtime';
import { Counter } from './fixtures/counter';

// vitest-mobile renders into a REAL React Native app on a booted simulator and
// drives REAL native taps — there is no Node-side spy, so a press is observed
// through a visible state change (the `Counter` fixture) rather than a mock.
// `render`, `.tap()`, and `expect.element(...)` are all async (they round-trip
// to the device), so every interaction and assertion is awaited. Queries target
// `testID`/visible text.
afterEach(async () => {
  await cleanup();
});

describe('Button', () => {
  it('renders its label', async () => {
    const screen = await render(<Button label="Save" testID="save" />);
    await expect.element(screen.getByTestId('save')).toContainText('Save');
  });

  it('increments the counter when pressed', async () => {
    const screen = await render(<Counter />);
    await expect.element(screen.getByTestId('count')).toHaveText('0');
    await screen.getByTestId('increment').tap();
    await expect.element(screen.getByTestId('count')).toHaveText('1');
  });

  it('does not fire onPress when disabled', async () => {
    const screen = await render(<Counter disabled={true} />);
    await screen.getByTestId('increment').tap();
    await expect.element(screen.getByTestId('count')).toHaveText('0');
  });

  it('shows a spinner instead of the label while loading', async () => {
    const screen = await render(<Counter loading={true} />);
    await expect.element(screen.getByTestId('button-spinner')).toBeVisible();
    expect(screen.queryByText('Increment')).toBe(null);
    await screen.getByTestId('increment').tap();
    await expect.element(screen.getByTestId('count')).toHaveText('0');
  });
});
