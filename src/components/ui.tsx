import React from 'react';
import { Text, Pressable, View, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors, radius, font } from '../theme';

export function GlassButton({
  label, onPress, style, textStyle, icon,
}: { label: string; onPress?: () => void; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; icon?: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.glass, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }, style]}
    >
      {icon}
      <Text style={[styles.glassText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function Tag({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[styles.tag, color ? { backgroundColor: color + '55', borderColor: color + '99' } : null]}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    width: '100%', height: 50, borderRadius: radius.pill, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong,
  },
  glassText: { color: colors.text, fontFamily: font.semibold, fontSize: 14 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
  },
  chipOn: { backgroundColor: '#fff', borderColor: '#fff' },
  chipText: { color: colors.text, fontFamily: font.medium, fontSize: 12.5 },
  chipTextOn: { color: '#111' },
  tag: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  tagText: { color: '#fff', fontFamily: font.semibold, fontSize: 11 },
});
