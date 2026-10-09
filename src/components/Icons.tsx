import { View } from 'react-native';

interface IconProps {
  size: number;
  color: string;
  /** Stroke thickness. Defaults to roughly a tenth of `size`. */
  thickness?: number;
}

/**
 * Chevron drawn with two borders on a rotated square, so the package stays
 * dependency free (no SVG, no icon font).
 */
export function ArrowIcon({ size, color, thickness }: IconProps) {
  const stroke = thickness ?? Math.max(2, Math.round(size / 10));
  return (
    <View
      accessible={false}
      style={{
        width: size * 0.55,
        height: size * 0.55,
        borderTopWidth: stroke,
        borderRightWidth: stroke,
        borderColor: color,
        borderRadius: 1,
        transform: [{ rotate: '45deg' }, { translateX: -size * 0.08 }],
      }}
    />
  );
}

/** Check mark, drawn the same way as {@link ArrowIcon}. */
export function CheckIcon({ size, color, thickness }: IconProps) {
  const stroke = thickness ?? Math.max(2, Math.round(size / 10));
  return (
    <View
      accessible={false}
      style={{
        width: size * 0.35,
        height: size * 0.6,
        borderRightWidth: stroke,
        borderBottomWidth: stroke,
        borderColor: color,
        borderRadius: 1,
        transform: [{ rotate: '45deg' }, { translateY: -size * 0.06 }],
      }}
    />
  );
}
