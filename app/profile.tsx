import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, font, radius } from '../src/theme';
import { Menu } from '../src/components/Menu';

type Act = { key: string; title: string; body: string; confirm: string; cancel: string; danger?: boolean; run?: () => void };

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [act, setAct] = useState<Act | null>(null);
  const [toast, setToast] = useState('');

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1100); };

  const ACTIONS: Act[] = [
    { key: 'email', title: 'Change email', body: 'Enter the new email for your account.', confirm: 'Save', cancel: 'Cancel', run: () => flash('Email updated') },
    { key: 'password', title: 'Change password', body: 'Set a new password (at least 8 characters).', confirm: 'Update', cancel: 'Cancel', run: () => flash('Password updated') },
    { key: 'upgrade', title: 'Upgrade to Premium', body: 'Unlock unlimited swipes and applications for $8/mo.', confirm: 'Upgrade · $8/mo', cancel: 'Maybe later', run: () => flash("You're Premium") },
    { key: 'cancel', title: 'Cancel Premium?', body: "You'll keep Premium until the end of your billing period, then move to Free.", confirm: 'Cancel plan', cancel: 'Keep Premium', danger: true, run: () => flash('Plan cancelled') },
    { key: 'logout', title: 'Log out?', body: "You'll need to sign in again to access your account.", confirm: 'Log out', cancel: 'Cancel', run: () => router.replace('/') },
    { key: 'delete', title: 'Delete account?', body: "This permanently deletes your account, profile and saved items. This can't be undone.", confirm: 'Delete account', cancel: 'Cancel', danger: true, run: () => router.replace('/') },
  ];

  const Section = ({ icon, title, children, action }: any) => (
    <View style={styles.section}>
      <View style={styles.secHead}>
        <View style={styles.si}><Ionicons name={icon} size={15} color="rgba(255,255,255,0.8)" /></View>
        <Text style={styles.secTitle}>{title}</Text>
        {action}
      </View>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
  const EditBtn = () => <View style={styles.secAct}><Ionicons name="create-outline" size={14} color="#fff" /></View>;

  return (
    <View style={styles.root}>
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
             : <View style={StyleSheet.absoluteFill}><View style={styles.initWrap}><Text style={styles.init}>EA</Text></View></View>}
      <LinearGradient pointerEvents="none" colors={['rgba(6,6,9,0.55)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130 }} />

      <View style={[styles.top, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.replace('/home')}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
        <Text style={styles.topTitle}>Profile</Text>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}><Ionicons name="menu" size={18} color="#fff" /></Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 200 }} showsVerticalScrollIndicator={false}>
        <View style={styles.spacer}>
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(8,8,10,0.2)', 'rgba(8,8,10,0.9)']} locations={[0.4, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.who}><Text style={styles.name}>Emelyn Angga</Text><Text style={styles.role}>UX Designer · UX Researcher</Text></View>
          <Pressable style={styles.cam} onPress={pickPhoto}><Ionicons name="camera-outline" size={18} color="#fff" /></Pressable>
        </View>

        <BlurView intensity={50} tint="dark" style={styles.panel}>
          <View style={styles.pgrip} />
          <Section icon="person-outline" title="Bio" action={<EditBtn />}>
            <Text style={styles.pText}>UX designer and researcher focused on clean, human-centred products. I love turning messy problems into simple, delightful flows.</Text>
          </Section>
          <Section icon="school-outline" title="Education" action={<View style={styles.secAct}><Ionicons name="add" size={16} color="#fff" /></View>}>
            <Text style={styles.itemT}>BSc Information Technology</Text><Text style={styles.itemS}>University of Oxford · Sep 2010 – Aug 2013</Text>
          </Section>
          <Section icon="sparkles-outline" title="Skills" action={<View style={styles.secAct}><Ionicons name="add" size={16} color="#fff" /></View>}>
            <View style={styles.chipWrap}>{['Leadership', 'Teamwork', 'Vision', 'Target oriented', 'Consistent'].map((c) => <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>)}</View>
          </Section>
          <Section icon="document-text-outline" title="Resume">
            <View style={styles.resume}>
              <View style={styles.pdf}><Text style={styles.pdfText}>PDF</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.itemT}>CV — Emelyn Angga</Text><Text style={styles.itemS}>867 Kb · 14 Feb 2024</Text></View>
              <View style={styles.secAct}><Ionicons name="cloud-upload-outline" size={14} color="#fff" /></View>
            </View>
          </Section>
          <Section icon="logo-linkedin" title="LinkedIn" action={<EditBtn />}>
            <Text style={[styles.pText, { textDecorationLine: 'underline' }]}>linkedin.com/in/emelyn-angga</Text>
          </Section>
          <Section icon="albums-outline" title="Common Application">
            <Pressable style={styles.caRow} onPress={() => router.push('/application')}>
              <View><Text style={styles.itemT}>Your standard application</Text><Text style={styles.itemS}>Fill once, apply anywhere</Text></View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          </Section>
          <Section icon="settings-outline" title="Account">
            <View style={{ gap: 8 }}>
              {ACTIONS.map((a) => (
                <Pressable key={a.key} style={styles.setRow} onPress={() => setAct(a)}>
                  <Text style={[styles.setText, a.danger && a.key === 'delete' && { color: colors.redSoft }]}>{a.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </Pressable>
              ))}
            </View>
          </Section>
          <View style={{ height: insets.bottom + 24 }} />
        </BlurView>
      </ScrollView>

      {/* settings confirm sheet */}
      <Modal visible={!!act} transparent animationType="slide" onRequestClose={() => setAct(null)} statusBarTranslucent>
        <Pressable style={styles.scrim} onPress={() => setAct(null)}><BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} /></Pressable>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.pgrip} />
          {act && (
            <>
              <Text style={styles.sheetTitle}>{act.title}</Text>
              {(act.key === 'email' || act.key === 'password') && (
                <TextInput placeholder={act.key === 'email' ? 'you@example.com' : 'New password'} placeholderTextColor={colors.textFaint}
                  secureTextEntry={act.key === 'password'} style={styles.input} />
              )}
              {act.key !== 'email' && act.key !== 'password' && <Text style={[styles.pText, { marginTop: 6 }]}>{act.body}</Text>}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
                <Pressable style={styles.ghost} onPress={() => setAct(null)}><Text style={styles.ghostText}>{act.cancel}</Text></Pressable>
                <Pressable style={[styles.save, act.danger && { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.4)' }]}
                  onPress={() => { const r = act.run; setAct(null); r && r(); }}>
                  <Text style={[styles.saveText, act.danger && { color: colors.redSoft }]}>{act.confirm}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>

      {!!toast && <View style={[styles.toast, { bottom: insets.bottom + 24 }]}><Text style={styles.toastText}>{toast}</Text></View>}
      <Menu visible={menu} onClose={() => setMenu(false)} current="/profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  initWrap: { position: 'absolute', top: 70, left: 0, right: 0, height: 150, alignItems: 'center', justifyContent: 'center' },
  init: { color: 'rgba(255,255,255,0.92)', fontFamily: font.semibold, fontSize: 62, letterSpacing: 3 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,24,0.5)', borderWidth: 1, borderColor: colors.borderStrong },
  topTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  spacer: { height: 218, justifyContent: 'flex-end' },
  who: { position: 'absolute', left: 20, right: 70, bottom: 16 },
  name: { color: '#fff', fontFamily: font.semibold, fontSize: 23, letterSpacing: -0.5 },
  role: { color: 'rgba(255,255,255,0.78)', fontFamily: font.regular, fontSize: 12, marginTop: 3 },
  cam: { position: 'absolute', right: 18, bottom: 16, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,24,0.6)', borderWidth: 1, borderColor: colors.borderStrong },
  panel: { backgroundColor: 'rgba(20,20,24,0.55)', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 16, paddingTop: 8, minHeight: 600, overflow: 'hidden' },
  pgrip: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', alignSelf: 'center', marginVertical: 10 },
  section: { borderTopWidth: 1, borderColor: colors.hairline, paddingVertical: 16 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  si: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  secTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 13.5, flex: 1 },
  secAct: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  pText: { color: 'rgba(255,255,255,0.68)', fontFamily: font.light, fontSize: 12.5, lineHeight: 20 },
  itemT: { color: '#fff', fontFamily: font.semibold, fontSize: 13 },
  itemS: { color: colors.textDim, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipText: { color: '#fff', fontFamily: font.regular, fontSize: 11.5 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  pdf: { width: 38, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  pdfText: { color: 'rgba(255,255,255,0.85)', fontFamily: font.bold, fontSize: 9 },
  caRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  setText: { color: '#fff', fontFamily: font.medium, fontSize: 13 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,6,10,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,24,0.97)', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 22, paddingTop: 14 },
  sheetTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 19, marginBottom: 4 },
  input: { height: 50, borderRadius: 13, paddingHorizontal: 14, marginTop: 14, color: '#fff', fontFamily: font.regular, fontSize: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { paddingHorizontal: 20, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  ghostText: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  save: { flex: 1, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  saveText: { color: '#fff', fontFamily: font.semibold, fontSize: 14 },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(20,20,24,0.85)', borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.lg },
  toastText: { color: '#fff', fontFamily: font.semibold, fontSize: 12.5 },
});
