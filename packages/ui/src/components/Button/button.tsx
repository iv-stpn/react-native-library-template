import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fontSizes, radii, spacing } from '../../theme/tokens';

function getButtonOpacity(inactive: boolean, pressed: boolean) {
  if (inactive) return 0.5;
  if (pressed) return 0.7;
  return 1;
}

function variantStyles(variant: ButtonVariant, pressed: boolean, inactive: boolean): ViewStyle {
  if (inactive && variant !== 'ghost') return { backgroundColor: colors.disabled };
  switch (variant) {
    case 'primary':
      return { backgroundColor: pressed ? colors.primaryPressed : colors.primary };
    case 'secondary':
      return { backgroundColor: pressed ? colors.secondaryPressed : colors.secondary };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        opacity: getButtonOpacity(inactive, pressed),
      };
    default:
      return {};
  }
}

function labelStyles(variant: ButtonVariant, inactive: boolean) {
  if (inactive && variant !== 'ghost') return { color: colors.textDisabled };
  return { color: variant === 'primary' ? colors.textInverse : colors.textPrimary };
}

function spinnerColor(variant: ButtonVariant): typeof colors.textInverse | typeof colors.textPrimary {
  return variant === 'primary' ? colors.textInverse : colors.textPrimary;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, minHeight: 32 },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 40 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 48 },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: fontSizes.sm },
  md: { fontSize: fontSizes.md },
  lg: { fontSize: fontSizes.lg },
});

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

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
  /** Style override for the outer pressable. */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label; falls back to `label`. */
  accessibilityLabel?: string;
  /** Test identifier. */
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  const accessibilityState = useMemo(() => ({ disabled: inactive, busy: loading }), [inactive, loading]);
  const buttonStyles = useCallback(
    ({ pressed }: { pressed: boolean }) => [styles.base, sizeStyles[size], variantStyles(variant, pressed, inactive), style],
    [size, variant, inactive, style],
  );

  const textStyles = useCallback(
    () => [styles.label, labelSizeStyles[size], labelStyles(variant, inactive)],
    [size, variant, inactive],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={accessibilityState}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor(variant)} testID="button-spinner" />
      ) : (
        <Text style={textStyles()}>{label}</Text>
      )}
    </Pressable>
  );
}
