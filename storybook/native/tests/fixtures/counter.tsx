import { Button } from '@template/ui/button';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

// Test fixture for the on-device Button tests. vitest-mobile drives REAL native
// taps against a REAL RN app, so there is no Node-side callback spy — a press is
// observed through a visible state change instead. This wraps `Button` so its
// `onPress` bumps a counter rendered under `testID="count"`.
export function Counter(props: { disabled?: boolean; loading?: boolean }) {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return (
    <View>
      <Text testID="count">{String(count)}</Text>
      <Button label="Increment" onPress={increment} disabled={props.disabled} loading={props.loading} testID="increment" />
    </View>
  );
}
