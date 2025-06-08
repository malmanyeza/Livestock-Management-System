import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyBold: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
  },
});
