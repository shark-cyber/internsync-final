import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../src/theme';

function Option({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.opt, pressed && { opacity: 0.85 }]}>
      {icon}
      <Text style={styles.optText}>{label}</Text>
    </Pressable>
  );
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const go = () => router.replace('/home');
  return (
    <ImageBackground source={require('../assets/img/welcome-bg.jpg')} style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={['rgba(8,8,10,0.5)', 'rgba(8,8,10,0)']} locations={[0, 0.34]} style={StyleSheet.absoluteFill} />
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.hero}><Text style={styles.heroTitle}>Welcome</Text></View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <Text style={styles.h1}>Log in</Text>
        <Text style={styles.sub}>Choose how you'd like to continue</Text>
        <Option label="Continue with username" onPress={go} icon={<Ionicons name="person-outline" size={17} color="#fff" />} />
        <Option label="Continue with Google" onPress={go} icon={<Ionicons name="logo-google" size={17} color="#fff" />} />
        <Option label="Continue with Apple" onPress={go} icon={<Ionicons name="logo-apple" size={18} color="#fff" />} />
        <Text style={styles.switch}>New here? <Text style={styles.link} onPress={() => router.replace('/signup')}>Sign up</Text></Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 22 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  heroTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 22 },
  sheet: {
    backgroundColor: 'rgba(20,20,24,0.92)', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 26, paddingTop: 24,
  },
  h1: { color: '#fff', fontFamily: font.bold, fontSize: 24, letterSpacing: -0.3 },
  sub: { color: colors.textDim, fontFamily: font.regular, fontSize: 12.5, marginTop: 4, marginBottom: 22 },
  opt: {
    height: 52, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 12,
  },
  optText: { color: '#fff', fontFamily: font.semibold, fontSize: 13.5 },
  switch: { color: colors.textDim, fontFamily: font.regular, fontSize: 13, textAlign: 'center', marginTop: 14 },
  link: { color: '#fff', fontFamily: font.semibold },
});
