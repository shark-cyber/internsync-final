import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Animated, PanResponder, useWindowDimensions, Modal, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, Accent } from '../theme';
import { Opportunity, notifications } from '../data/feed';
import { Menu } from './Menu';
import { Chip } from './ui';
import { Glow } from './Glow';

const accentHex: Record<Accent, string> = {
  internship: colors.internship, scholarship: colors.scholarship, extracurricular: colors.extracurricular,
};
const filtersFor: Record<Accent, { label: string; opts: string[] }[]> = {
  internship: [
    { label: 'Job type', opts: ['Internship', 'Full-time', 'Part-time', 'Contract'] },
    { label: 'Work mode', opts: ['Remote', 'On-site', 'Hybrid'] },
    { label: 'Experience', opts: ['Entry', 'Mid', 'Senior'] },
  ],
  scholarship: [
    { label: 'Award type', opts: ['Merit-based', 'Need-based', 'Research', 'Athletic'] },
    { label: 'Level', opts: ['High school', 'Undergraduate', 'Graduate', 'PhD'] },
  ],
  extracurricular: [
    { label: 'Category', opts: ['Sports', 'Arts', 'Academic', 'Volunteer', 'Music', 'Tech'] },
    { label: 'Commitment', opts: ['One-time', 'Weekly', 'Monthly'] },
    { label: 'Cost', opts: ['Free', 'Paid'] },
  ],
};

export default function Feed({ data, accent, current }: { data: Opportunity[]; accent: Accent; current: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const THRESHOLD = Math.max(90, width * 0.26);
  const [idx, setIdx] = useState(0);
  const [menu, setMenu] = useState(false);
  const [notif, setNotif] = useState(false);
  const [filter, setFilter] = useState(false);
  const [info, setInfo] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');
  const [deck, setDeck] = useState<{ width: number; height: number } | null>(null);
  const pos = useRef(new Animated.ValueXY()).current;
  const accentCol = accentHex[accent];
  const card = data[idx];
  const hasUnread = notifications.some((n) => n.unread);

  const rotate = pos.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg'] });
  const saveOp = pos.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOp = pos.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 950); };

  const next = () => { pos.setValue({ x: 0, y: 0 }); setIdx((i) => i + 1); };
  const decide = (dir: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(pos, { toValue: { x: dir * width * 1.3, y: 0 }, duration: 280, useNativeDriver: true }).start(() => {
      showToast(dir > 0 ? 'Saved' : 'Passed');
      next();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy * 0.15 }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) decide(1);
        else if (g.dx < -THRESHOLD) decide(-1);
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
      },
    })
  ).current;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* glow */}
      <LinearGradient colors={[accentCol + '00', accentCol + '22', accentCol + '00']} style={styles.glow} pointerEvents="none" />

      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}><Ionicons name="menu" size={20} color="#fff" /></Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn} onPress={() => setNotif(true)}>
          <Ionicons name="notifications-outline" size={19} color="#fff" />
          {hasUnread && <View style={styles.dot} />}
        </Pressable>
      </View>

      {/* deck */}
      <View style={styles.deck} onLayout={(e) => setDeck(e.nativeEvent.layout)}>
        {deck && (
          <Glow
            width={deck.width}
            height={deck.height}
            rect={{ x: 16, y: 16, w: deck.width - 32, h: deck.height - 32, r: 28 }}
          />
        )}
        {!card ? (
          <View style={[styles.card, styles.empty, { borderColor: accentCol + '55' }]}>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySub}>Check back soon for new matches.</Text>
          </View>
        ) : (
          <Animated.View
            {...pan.panHandlers}
            style={[styles.card, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}
          >
            {card.img ? (
              <Image source={card.img} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient colors={['#3b3b46', '#17171c']} style={StyleSheet.absoluteFill} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(5,5,8,0.3)', 'rgba(5,5,8,0.96)']}
              locations={[0.35, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            {/* filter chip */}
            <Pressable style={styles.cardFilter} onPress={() => setFilter(true)}>
              <Ionicons name="options-outline" size={18} color="#fff" />
            </Pressable>
            <View style={[styles.tag, { backgroundColor: accentCol + '88', borderColor: accentCol }]}>
              <Text style={styles.tagText}>{card.tag}</Text>
            </View>
            {/* swipe labels */}
            <Animated.View style={[styles.lbl, styles.lblSave, { opacity: saveOp }]}><Text style={styles.lblSaveText}>SAVE</Text></Animated.View>
            <Animated.View style={[styles.lbl, styles.lblPass, { opacity: passOp }]}><Text style={styles.lblPassText}>PASS</Text></Animated.View>

            <View style={styles.body}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.meta}>{card.meta}</Text>
              <Text style={[styles.pay, { color: '#fff' }]}>{card.pay}</Text>
              <View style={styles.chips}>
                {card.chips.map((c) => (
                  <View key={c} style={styles.miniChip}><Text style={styles.miniChipText}>{c}</Text></View>
                ))}
              </View>
              <Text style={styles.desc} numberOfLines={2}>{card.desc}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* actions */}
      {card && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable style={[styles.act, styles.reject]} onPress={() => decide(-1)}><Ionicons name="close" size={22} color="#fff" /></Pressable>
          <Pressable style={[styles.act, styles.infoBtn]} onPress={() => setInfo(true)}><Ionicons name="add" size={20} color="#fff" /></Pressable>
          <Pressable style={[styles.act, styles.apply]} onPress={() => decide(1)}><Ionicons name="checkmark" size={24} color="#fff" /></Pressable>
        </View>
      )}

      {!!toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 96 }]}><Text style={styles.toastText}>{toast}</Text></View>
      )}

      {/* notifications */}
      <Sheet visible={notif} onClose={() => setNotif(false)} title="Notifications">
        {notifications.map((n, i) => (
          <View key={i} style={styles.notifRow}>
            <View style={[styles.notifDot, !n.unread && { backgroundColor: 'rgba(255,255,255,0.22)' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.notifT}>{n.t}</Text>
              <Text style={styles.notifS}>{n.s}</Text>
            </View>
            <Text style={styles.notifTime}>{n.time}</Text>
          </View>
        ))}
      </Sheet>

      {/* filter */}
      <Sheet visible={filter} onClose={() => setFilter(false)} title="Filters">
        {filtersFor[accent].map((g) => (
          <View key={g.label}>
            <Text style={styles.flabel}>{g.label}</Text>
            <View style={styles.chipWrap}>
              {g.opts.map((o) => (
                <Chip key={o} label={o} selected={!!picked[g.label + o]} onPress={() => setPicked((p) => ({ ...p, [g.label + o]: !p[g.label + o] }))} />
              ))}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <Pressable style={styles.reset} onPress={() => setPicked({})}><Text style={styles.resetText}>Reset</Text></Pressable>
          <Pressable style={styles.applyBtn} onPress={() => setFilter(false)}><Text style={styles.applyText}>Apply</Text></Pressable>
        </View>
      </Sheet>

      {/* info */}
      <Sheet visible={info} onClose={() => setInfo(false)} title={card?.title ?? ''}>
        {card && (
          <>
            <View style={[styles.tag, { alignSelf: 'flex-start', position: 'relative', top: 0, right: 0, marginBottom: 12, backgroundColor: accentCol + '33', borderColor: accentCol + '66' }]}>
              <Text style={styles.tagText}>{card.tag}</Text>
            </View>
            <Text style={styles.meta}>{card.meta}</Text>
            <Text style={[styles.pay, { marginTop: 4 }]}>{card.pay}</Text>
            <Text style={styles.ih}>ABOUT</Text>
            <Text style={styles.ibody}>{card.desc}</Text>
            <Pressable style={styles.visit}><Text style={styles.visitText}>Visit website  ↗</Text></Pressable>
          </>
        )}
      </Sheet>

      <Menu visible={menu} onClose={() => setMenu(false)} current={current} />
    </View>
  );
}

/* ---- shared bottom sheet ---- */
function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.sheetScrim} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.grip} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={{ marginTop: 12 }}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  dot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: '#f43f5e', borderWidth: 1.5, borderColor: colors.bg },
  deck: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline, zIndex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  emptyTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 17 },
  emptySub: { color: colors.textFaint, fontFamily: font.regular, fontSize: 12, marginTop: 8 },
  cardFilter: { position: 'absolute', top: 14, left: 14, width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,18,26,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  tag: { position: 'absolute', top: 16, right: 16, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.lg, borderWidth: 1 },
  tagText: { color: '#fff', fontFamily: font.semibold, fontSize: 11 },
  lbl: { position: 'absolute', top: 60, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 2, borderRadius: 10 },
  lblSave: { left: 18, borderColor: '#5fd08a' }, lblSaveText: { color: '#5fd08a', fontFamily: font.bold, fontSize: 14, letterSpacing: 1.5 },
  lblPass: { right: 18, borderColor: '#f08585' }, lblPassText: { color: '#f08585', fontFamily: font.bold, fontSize: 14, letterSpacing: 1.5 },
  body: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 },
  title: { color: '#fff', fontFamily: font.semibold, fontSize: 24, letterSpacing: -0.5 },
  meta: { color: 'rgba(255,255,255,0.78)', fontFamily: font.regular, fontSize: 13, marginTop: 8 },
  pay: { color: '#fff', fontFamily: font.semibold, fontSize: 15, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  miniChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  miniChipText: { color: '#fff', fontFamily: font.medium, fontSize: 11 },
  desc: { color: 'rgba(255,255,255,0.62)', fontFamily: font.light, fontSize: 12, marginTop: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, paddingTop: 8 },
  act: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  reject: { width: 54, height: 54, backgroundColor: colors.red },
  infoBtn: { width: 46, height: 46, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  apply: { width: 60, height: 60, backgroundColor: colors.green },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(20,20,24,0.85)', borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.lg },
  toastText: { color: '#fff', fontFamily: font.semibold, fontSize: 12.5 },
  // sheet
  sheetScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,6,10,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '82%', backgroundColor: 'rgba(20,20,24,0.97)', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 22, paddingTop: 14 },
  grip: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 20, letterSpacing: -0.3 },
  notifRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', paddingVertical: 12, borderTopWidth: 1, borderColor: colors.hairline },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f43f5e', marginTop: 5 },
  notifT: { color: '#fff', fontFamily: font.semibold, fontSize: 13 },
  notifS: { color: colors.textDim, fontFamily: font.regular, fontSize: 11.5, marginTop: 2 },
  notifTime: { color: colors.textFaint, fontFamily: font.regular, fontSize: 10.5 },
  flabel: { color: colors.textDim, fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 18, marginBottom: 9 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reset: { paddingHorizontal: 20, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  resetText: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  applyBtn: { flex: 1, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  applyText: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  ih: { color: colors.textDim, fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.4, marginTop: 18, marginBottom: 8 },
  ibody: { color: 'rgba(255,255,255,0.72)', fontFamily: font.light, fontSize: 13, lineHeight: 21 },
  visit: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong, marginTop: 22 },
  visitText: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
});
