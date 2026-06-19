import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, font } from '../src/theme';
import { GlassButton } from '../src/components/ui';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <ImageBackground source={require('../assets/img/welcome-bg.jpg')} style={styles.bg}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(10,10,12,0.55)', 'rgba(10,10,12,0.05)', 'rgba(10,10,12,0.5)', 'rgba(10,10,12,0.95)']}
        locations={[0, 0.3, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.top, { paddingTop: insets.top + 14 }]}>
        <Image source={require('../assets/img/logo-white.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.tagline}>YOUR JOURNEY STARTS HERE</Text>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <GlassButton label="Log in" onPress={() => router.push('/login')} style={{ marginBottom: 11 }} />
        <GlassButton label="Sign up" onPress={() => router.push('/signup')} />
        <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  top: { alignItems: 'center', paddingHorizontal: 24 },
  logo: { height: 34, width: 34, opacity: 0.95, marginBottom: 18 },
  title: { color: '#fff', fontFamily: font.semibold, fontSize: 40, letterSpacing: -1.2 },
  tagline: { color: 'rgba(255,255,255,0.72)', fontFamily: font.semibold, fontSize: 11, letterSpacing: 3, marginTop: 12 },
  actions: { marginTop: 'auto', paddingHorizontal: 26 },
  legal: { color: 'rgba(255,255,255,0.55)', fontFamily: font.regular, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
