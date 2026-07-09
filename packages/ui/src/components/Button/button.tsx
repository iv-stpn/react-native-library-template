import { cva, type VariantProps } from 'class-variance-authority';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, type StyleProp, Text, type ViewStyle } from 'react-native';

// Uniwind resolves these Tailwind classes at build time. Pressable exposes the
// `active:` (pressed) and `disabled:` pseudo-variants; Text has neither, so its
// disabled color is driven by the `disabled` cva variant below.
//
// On web, react-native-web renders Pressable as a focusable `div[role=button]`,
// which gets the browser's UA outline on *every* focus (including mouse clicks) —
// unlike a native `<button>`. The `web:`-scoped classes suppress that always-on
// outline and restore a keyboard-only focus ring; they compile to `@supports`
// blocks the native bundler skips, so native styling is unaffected.
const FOCUS_RING =
  'web:focus:outline-none web:focus-visible:ring-2 web:focus-visible:ring-indigo-500 web:focus-visible:ring-offset-2';

const container = cva(`flex-row items-center justify-center self-start rounded-lg ${FOCUS_RING}`, {
  variants: {
    variant: {
      primary: 'bg-indigo-600 active:bg-indigo-700 disabled:bg-zinc-200',
      secondary: 'bg-indigo-100 active:bg-indigo-200 disabled:bg-zinc-200',
      ghost: 'border border-zinc-300 active:opacity-70 disabled:opacity-50',
    },
    size: {
      sm: 'min-h-8 px-3 py-1',
      md: 'min-h-10 px-4 py-2',
      lg: 'min-h-12 px-6 py-3',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

const label = cva('font-semibold', {
  variants: {
    variant: { primary: '', secondary: '', ghost: '' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
    disabled: { true: '', false: '' },
  },
  compoundVariants: [
    { variant: 'primary', disabled: false, class: 'text-white' },
    { variant: 'secondary', disabled: false, class: 'text-zinc-900' },
    { variant: 'ghost', disabled: false, class: 'text-zinc-900' },
    // Muted label for disabled primary/secondary; ghost keeps its color and the
    // container dims via `disabled:opacity-50`.
    { variant: 'primary', disabled: true, class: 'text-zinc-400' },
    { variant: 'secondary', disabled: true, class: 'text-zinc-400' },
    { variant: 'ghost', disabled: true, class: 'text-zinc-900' },
  ],
  defaultVariants: { variant: 'primary', size: 'md', disabled: false },
});

export type ButtonVariant = NonNullable<VariantProps<typeof container>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof container>['size']>;

export type ButtonProps = {
  /** Text rendered inside the button. */
  label: string;
  /** Called when the button is pressed. */
  onPress?: () => void;
  /** Visual style of the button. @default 'primary' */
  variant?: ButtonVariant;
  /** Size of the button. @default 'md' */
  size?: ButtonSize;
  /** Disables interaction and applies a muted style. @default false */
  disabled?: boolean;
  /** Shows a spinner instead of the label and disables interaction. @default false */
  loading?: boolean;
  /** Extra Tailwind classes merged onto the outer pressable. */
  className?: string;
  /** Style override for the outer pressable. */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label; falls back to `label`. */
  accessibilityLabel?: string;
  /** Test identifier. */
  testID?: string;
};

export function Button({
  label: text,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  const accessibilityState = useMemo(() => ({ disabled: inactive, busy: loading }), [inactive, loading]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={accessibilityState}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      className={container({ variant, size, className })}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          colorClassName={variant === 'primary' ? 'text-white' : 'text-zinc-900'}
          testID="button-spinner"
        />
      ) : (
        <Text className={label({ variant, size, disabled: inactive })}>{text}</Text>
      )}
    </Pressable>
  );
}
