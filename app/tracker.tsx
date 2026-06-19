import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Modal } from 'react-native';
import { Portal } from '../src/components/Portal';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../src/theme';
import { applications as initialApps, Application, Status } from '../src/data/feed';
import { Menu } from '../src/components/Menu';
import { Glow } from '../src/components/Glow';

const statusColor: Record<Status, string> = { accepted: colors.green, confirmed: colors.green, review: colors.amber, rejected: colors.red };
const statusIcon: Record<Status, any> = { accepted: 'checkmark', confirmed: 'checkmark', review: 'time-outline', rejected: 'close' };
const statusLabel: Record<Status, string> = { accepted: 'Accepted', confirmed: 'Confirmed', review: 'In review', rejected: 'Not selected' };

export default function Tracker() {
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const [sb, setSb] = useState<{ width: number; height: number } | null>(null);
  const [apps, setApps] = useState<Application[]>(initialApps);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const detail = openIdx != null ? apps[openIdx] : null;

  const confirm = () => {
    if (openIdx == null) return;
    setApps((a) => a.map((x, i) => (i === openIdx ? { ...x, status: 'confirmed' } : x)));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}><Ionicons name="menu" size={20} color="#fff" /></Pressable>
        <Text style={styles.htitle}>Tracker</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn}><Ionicons name="notifications-outline" size={19} color="#fff" /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 6 }}>
        {apps.map((a, i) => (
          <Pressable key={a.title} style={styles.card} onPress={() => setOpenIdx(i)}>
            {a.img ? <Image source={a.img} style={styles.thumb} /> : <View style={styles.letter}><Text style={styles.letterText}>{a.letter}</Text></View>}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{a.title}</Text>
              <Text style={styles.sub} numberOfLines={1}>{a.org.split(' · ')[0]} · {a.applied}</Text>
            </View>
            <View style={[styles.ring, { backgroundColor: statusColor[a.status] }]}>
              <Ionicons name={statusIcon[a.status]} size={11} color="#fff" />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Portal visible={detail != null} animationType="slide" onRequestClose={() => setOpenIdx(null)}>
        <View style={[styles.detail, { paddingTop: insets.top }]}>
          <LinearGradient pointerEvents="none" colors={[statusColor[detail?.status ?? 'review'] + '14', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }} />
          <View style={styles.dTop}>
            <Pressable style={styles.iconBtn} onPress={() => setOpenIdx(null)}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
            <Text style={styles.dTopTitle}>Application</Text>
          </View>
          {detail && (
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 30 }}>
              <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                {detail.img ? <Image source={detail.img} style={styles.dIco} /> : <View style={[styles.dIco, styles.letter]}><Text style={styles.letterText}>{detail.letter}</Text></View>}
                <View style={{ flex: 1 }}><Text style={styles.dTitle}>{detail.title}</Text><Text style={styles.sub}>{detail.org}</Text></View>
              </View>
              <View style={styles.dTags}>{detail.tags.map((t) => <View key={t} style={styles.miniChip}><Text style={styles.miniChipText}>{t}</Text></View>)}</View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                <View style={{ flex: 1 }}><Text style={styles.dlabel}>APPLIED</Text><Text style={styles.dval}>{detail.applied.replace('Applied ', '')}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.dlabel}>JOINING</Text><Text style={styles.dval}>{detail.joining ?? '—'}</Text></View>
              </View>
              <View style={[styles.pill, { backgroundColor: statusColor[detail.status] + '22', borderColor: statusColor[detail.status] + '66', marginTop: 16 }]}>
                <View style={[styles.pillDot, { backgroundColor: statusColor[detail.status] }]} />
                <Text style={[styles.pillText, { color: statusColor[detail.status] === colors.green ? colors.greenSoft : statusColor[detail.status] === colors.amber ? colors.amberSoft : colors.redSoft }]}>{statusLabel[detail.status]}</Text>
              </View>
              <Text style={styles.ih}>DESCRIPTION</Text>
              <Text style={styles.ibody}>{detail.desc}</Text>
              <Text style={styles.ih}>REQUIREMENTS</Text>
              {detail.reqs.map((r) => (
                <View key={r} style={{ flexDirection: 'row', gap: 8, marginBottom: 7 }}>
                  <Text style={{ color: colors.textFaint }}>•</Text><Text style={styles.req}>{r}</Text>
                </View>
              ))}
              <Text style={styles.ih}>STIPEND</Text>
              <Text style={styles.dPay}>{detail.pay}</Text>
            </ScrollView>
          )}
          {detail?.status === 'accepted' && (
            <View style={{ padding: 22, paddingBottom: insets.bottom + 14 }}>
              <Pressable style={styles.confirm} onPress={confirm}><Text style={styles.confirmText}>Confirm your spot</Text></Pressable>
            </View>
          )}
          {detail?.status === 'confirmed' && (
            <View style={{ padding: 22, paddingBottom: insets.bottom + 14 }}>
              <View style={[styles.confirm, { backgroundColor: 'rgba(34,197,94,0.18)' }]}><Text style={[styles.confirmText, { color: colors.greenSoft }]}>✓ Spot confirmed</Text></View>
            </View>
          )}
        </View>
      </Portal>

      <Menu visible={menu} onClose={() => setMenu(false)} current="/tracker" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  htitle: { color: '#fff', fontFamily: font.semibold, fontSize: 19, letterSpacing: -0.3 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 18, marginBottom: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  thumb: { width: 40, height: 40, borderRadius: 12 },
  letter: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#3a3a42', alignItems: 'center', justifyContent: 'center' },
  letterText: { color: '#fff', fontFamily: font.semibold, fontSize: 15 },
  title: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  sub: { color: colors.textDim, fontFamily: font.regular, fontSize: 11.5, marginTop: 2 },
  ring: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  detail: { flex: 1, backgroundColor: colors.bg },
  dTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6 },
  dTopTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 15 },
  dIco: { width: 56, height: 56, borderRadius: 16 },
  dTitle: { color: '#fff', fontFamily: font.bold, fontSize: 20, letterSpacing: -0.4 },
  dTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  miniChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  miniChipText: { color: '#fff', fontFamily: font.medium, fontSize: 11 },
  dlabel: { color: colors.textFaint, fontFamily: font.semibold, fontSize: 10.5, letterSpacing: 0.3 },
  dval: { color: '#fff', fontFamily: font.semibold, fontSize: 14, marginTop: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: font.semibold, fontSize: 11.5 },
  ih: { color: colors.textDim, fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.4, marginTop: 22, marginBottom: 8 },
  ibody: { color: 'rgba(255,255,255,0.72)', fontFamily: font.light, fontSize: 13, lineHeight: 21 },
  req: { color: 'rgba(255,255,255,0.72)', fontFamily: font.light, fontSize: 12.5, flex: 1, lineHeight: 19 },
  dPay: { color: '#fff', fontFamily: font.semibold, fontSize: 16 },
  confirm: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  confirmText: { color: '#06210f', fontFamily: font.bold, fontSize: 15 },
});
