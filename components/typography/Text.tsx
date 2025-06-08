import { Text as RNText, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { Colors } from '../../theme/colors';

type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type ColorKey = keyof typeof Colors;
type ColorValue = `${ColorKey}.${ColorShade}` | string;

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body2' | 'caption' | 'button';
  color?: ColorValue;
  weight?: 'regular' | 'medium' | 'bold';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Text({
  style,
  variant = 'body',
  color = 'neutral.800',
  weight = 'regular',
  align,
  children,
  ...props
}: TextProps) {
  // Parse color like 'primary.500' into the actual color value
  let colorValue = color;
  if (typeof color === 'string' && color.includes('.')) {
    const [colorName, shade] = color.split('.');
    const shadeNum = parseInt(shade, 10);
    if (
      colorName in Colors &&
      !isNaN(shadeNum) &&
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].includes(shadeNum)
    ) {
      colorValue = Colors[colorName as ColorKey][shadeNum as ColorShade];
    }
  }

  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        styles[weight],
        align && { textAlign: align },
        { color: colorValue },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  h5: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  h6: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body2: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  bold: {
    fontWeight: '700',
  },
});