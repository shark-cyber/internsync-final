import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, ScrollView, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../src/theme';
import { savedItems, Saved as SavedT } from '../src/data/feed';
import { Menu } from '../src/components/Menu';
import { Glow } from '../src/components/Glow';

export default function Saved() {
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const [sb, setSb] = useState<{ width: number; height: number } | null>(null);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<SavedT | null>(null);
  const [unsaved, setUnsaved] = useState<Record<string, boolean>>({});

  const list = savedItems.filter((s) => (s.title + s.sub).toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}><Ionicons name="menu" size={20} color="#fff" /></Pressable>
        <Text style={styles.htitle}>Saved</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn}><Ionicons name="notifications-outline" size={19} color="#fff" /></Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 6 }}>
        {list.map((s) => (
          <Pressable key={s.title} style={[styles.card, unsaved[s.title] && { opacity: 0.45 }]} onPress={() => setDetail(s)}>
            {s.img ? <Image source={s.img} style={styles.thumb} /> : <View style={styles.letter}><Text style={styles.letterText}>{s.letter}</Text></View>}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{s.title}</Text>
              <Text style={styles.sub} numberOfLines={1}>{s.sub}</Text>
            </View>
            <Pressable hitSlop={10} style={styles.book} onPress={() => setUnsaved((u) => ({ ...u, [s.title]: !u[s.title] }))}>
              <Ionicons name={unsaved[s.title] ? 'bookmark-outline' : 'bookmark'} size={15} color="#fff" />
            </Pressable>
          </Pressable>
        ))}
        {list.length === 0 && <Text style={styles.empty}>No saved opportunities match.</Text>}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        <View style={{ flex: 1 }} onLayout={(e) => setSb(e.nativeEvent.layout)}>
          {sb && <Glow width={sb.width} height={sb.height} rect={{ x: 0, y: 0, w: sb.width, h: sb.height, r: 21 }} blur={12} />}
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.textDim} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search saved…" placeholderTextColor={colors.textFaint} style={styles.searchInput} />
        </View>
        </View>
        <Pressable style={styles.filterBtn}><Ionicons name="options-outline" size={18} color="#fff" /></Pressable>
      </View>

      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)} statusBarTranslucent>
        <Pressable style={styles.scrim} onPress={() => setDetail(null)}><BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} /></Pressable>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.grip} />
          {detail && (
            <>
              <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                {detail.img ? <Image source={detail.img} style={styles.dIco} /> : <View style={[styles.dIco, styles.letter]}><Text style={styles.letterText}>{detail.letter}</Text></View>}
                <View style={{ flex: 1 }}><Text style={styles.dTitle}>{detail.title}</Text><Text style={styles.sub}>{detail.sub}</Text></View>
              </View>
              <Text style={[styles.pay, { marginTop: 14 }]}>{detail.pay}</Text>
              <Text style={styles.ih}>ABOUT</Text>
              <Text style={styles.ibody}>{detail.desc}</Text>
              <Pressable style={styles.visit}><Text style={styles.visitText}>View opportunity  ↗</Text></Pressable>
            </>
          )}
        </View>
      </Modal>

      <Menu visible={menu} onClose={() => setMenu(false)} current="/saved" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  htitle: { color: '#fff', fontFamily: font.semibold, fontSize: 19, letterSpacing: -0.3 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, borderRadius: radius.lg, marginBottom: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  thumb: { width: 48, height: 48, borderRadius: 14 },
  letter: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#3a3a42', alignItems: 'center', justifyContent: 'center' },
  letterText: { color: '#fff', fontFamily: font.semibold, fontSize: 16 },
  title: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  sub: { color: colors.textDim, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  book: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  empty: { color: colors.textFaint, fontFamily: font.regular, fontSize: 13, textAlign: 'center', paddingTop: 40 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 24, paddingTop: 6 },
  search: { height: 42, borderRadius: 21, zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, backgroundColor: '#0e0e12', borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, color: '#fff', fontFamily: font.regular, fontSize: 13 },
  filterBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,6,10,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,24,0.97)', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 22, paddingTop: 14 },
  grip: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 16 },
  dIco: { width: 54, height: 54, borderRadius: 15 },
  dTitle: { color: '#fff', fontFamily: font.bold, fontSize: 19, letterSpacing: -0.3 },
  pay: { color: '#fff', fontFamily: font.semibold, fontSize: 15 },
  ih: { color: colors.textDim, fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.4, marginTop: 18, marginBottom: 8 },
  ibody: { color: 'rgba(255,255,255,0.72)', fontFamily: font.light, fontSize: 13, lineHeight: 21 },
  visit: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong, marginTop: 22 },
  visitText: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
});
