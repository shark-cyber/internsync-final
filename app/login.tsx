import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../src/theme';

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const go = () => router.replace('/home');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image source={require('../assets/img/welcome-bg.jpg')} style={styles.bgImg} resizeMode="cover" />
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      <LinearGradient pointerEvents="none" colors={['rgba(8,8,10,0.5)', 'rgba(8,8,10,0.35)', 'rgba(8,8,10,0.8)']} style={StyleSheet.absoluteFill} />

      <View style={[styles.top, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.x}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: insets.bottom + 20, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log into{'\n'}your account</Text>

        <View style={styles.field}>
          <TextInput style={styles.input} placeholder="Username/Email" placeholderTextColor="rgba(255,255,255,0.75)" autoCapitalize="none" keyboardType="email-address" />
        </View>

        <View style={styles.field}>
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.75)" secureTextEntry={!showPw} />
          <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={10} style={styles.forgot}>
            <Text style={styles.forgotText}>{showPw ? 'Hide' : 'Forgot?'}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.remember} onPress={() => setRemember((r) => !r)}>
          <View style={[styles.box, remember && styles.boxOn]}>{remember && <Ionicons name="checkmark" size={13} color="#111" />}</View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>

        <Pressable style={styles.login} onPress={go}><Text style={styles.loginText}>Log In</Text></Pressable>

        <View style={styles.orRow}><View style={styles.line} /><Text style={styles.or}>or</Text><View style={styles.line} /></View>

        <Pressable style={styles.social} onPress={go}><Ionicons name="logo-apple" size={18} color="#fff" /><Text style={styles.socialText}>Continue with Apple</Text></Pressable>
        <Pressable style={styles.social} onPress={go}><Ionicons name="logo-google" size={17} color="#fff" /><Text style={styles.socialText}>Continue with Google</Text></Pressable>

        <View style={{ flex: 1 }} />
        <Text style={styles.switch}>Don't have an account? <Text style={styles.link} onPress={() => router.replace('/signup')}>Sign Up</Text></Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  top: { paddingHorizontal: 26 },
  x: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontFamily: font.bold, fontSize: 30, letterSpacing: -0.6, lineHeight: 36, marginTop: 24, marginBottom: 34 },
  field: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 26, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, color: '#fff', fontFamily: font.regular, fontSize: 15, paddingVertical: 8 },
  forgot: { paddingLeft: 10 },
  forgotText: { color: 'rgba(255,255,255,0.85)', fontFamily: font.medium, fontSize: 13 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 24 },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: '#fff', borderColor: '#fff' },
  rememberText: { color: 'rgba(255,255,255,0.85)', fontFamily: font.regular, fontSize: 13 },
  login: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#161616' },
  loginText: { color: '#fff', fontFamily: font.semibold, fontSize: 15 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  or: { color: 'rgba(255,255,255,0.5)', fontFamily: font.regular, fontSize: 12 },
  social: { height: 50, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  socialText: { color: '#fff', fontFamily: font.semibold, fontSize: 13.5 },
  switch: { color: 'rgba(255,255,255,0.7)', fontFamily: font.regular, fontSize: 13, textAlign: 'center', marginTop: 24 },
  link: { color: '#fff', fontFamily: font.semibold },
});
