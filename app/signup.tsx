import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Portal } from '../src/components/Portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../src/theme';

const STEPS = ['email', 'code', 'name', 'birthday', 'interests', 'job', 'plan'] as const;
const CTA: Record<string, string> = { email: 'Continue', code: 'Verify', name: 'Continue', birthday: 'Continue', interests: 'Continue', job: 'Continue', plan: 'Continue' };
const INTERESTS = ['Software', 'Engineering', 'Design', 'Product', 'Data & AI', 'Marketing', 'Finance', 'Consulting', 'Sales', 'Business', 'Healthcare', 'Education', 'Law', 'Media', 'Science'];

export default function Signup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Record<string, boolean>>({ Internship: true });
  const [plan, setPlan] = useState<'free' | 'premium'>('premium');
  const [pay, setPay] = useState(false);
  const [done, setDone] = useState(false);
  const [method, setMethod] = useState<'apple' | 'card'>('card');
  const [payState, setPayState] = useState<'form' | 'proc' | 'ok'>('form');

  const step = STEPS[i];
  const toggle = (k: string) => setPicked((p) => ({ ...p, [k]: !p[k] }));
  const back = () => (i === 0 ? router.back() : setI(i - 1));
  const next = () => {
    if (step === 'email' && !/.+@.+\..+/.test(email)) return;
    if (step === 'name' && !name.trim()) return;
    if (i < STEPS.length - 1) setI(i + 1);
    else if (plan === 'premium') { setPayState('form'); setPay(true); }
    else setDone(true);
  };

  if (done) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneTitle}>You're all set{name ? `, ${name.trim()}` : ''}!</Text>
          <Text style={styles.doneSub}>Your profile is ready. Let's find opportunities made for you.</Text>
          <Pressable style={styles.cta} onPress={() => router.replace('/home')}><Text style={styles.ctaText}>Get started</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable style={styles.iconBtn} onPress={back}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${((i + 1) / STEPS.length) * 100}%` }]} /></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        {step === 'email' && <Field title="What's your email?" sub="We'll use this to secure your account and send a code.">
          <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textFaint} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        </Field>}
        {step === 'code' && <Field title="Enter the code" sub={`We sent a 6-digit code to ${email || 'your email'}.`}>
          <View style={styles.codeRow}>{[0, 1, 2, 3, 4, 5].map((n) => <TextInput key={n} style={styles.codeBox} maxLength={1} keyboardType="number-pad" />)}</View>
        </Field>}
        {step === 'name' && <Field title="What's your first name?" sub="This is how you'll appear across the app.">
          <TextInput style={styles.input} placeholder="First name" placeholderTextColor={colors.textFaint} value={name} onChangeText={setName} />
        </Field>}
        {step === 'birthday' && <Field title="When's your birthday?" sub="You must be at least 16. We won't show this publicly.">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM" placeholderTextColor={colors.textFaint} keyboardType="number-pad" maxLength={2} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="DD" placeholderTextColor={colors.textFaint} keyboardType="number-pad" maxLength={2} />
            <TextInput style={[styles.input, { flex: 1.4 }]} placeholder="YYYY" placeholderTextColor={colors.textFaint} keyboardType="number-pad" maxLength={4} />
          </View>
        </Field>}
        {step === 'interests' && <Field title="What are your career interests?" sub="Pick the fields you want to work in.">
          <View style={styles.chipWrap}>{INTERESTS.map((c) => <Chip key={c} label={c} on={!!picked[c]} onPress={() => toggle(c)} />)}</View>
        </Field>}
        {step === 'job' && <Field title="Set up your work" sub="Tell us what you're looking for so we can match you.">
          <TextInput style={styles.input} placeholder="Desired role (e.g. Product Designer)" placeholderTextColor={colors.textFaint} />
          <Text style={styles.glabel}>WORK MODE</Text>
          <View style={styles.chipWrap}>{['Remote', 'Online', 'Hybrid'].map((c) => <Chip key={c} label={c} on={!!picked[c]} onPress={() => toggle(c)} />)}</View>
        </Field>}
        {step === 'plan' && <Field title="Swipe without limits" sub="Unlimited swipes and applications — never hit a daily cap.">
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <PlanCard label="Premium" price="$8/mo" desc="Unlimited swipes & applications" on={plan === 'premium'} badge onPress={() => setPlan('premium')} />
            <PlanCard label="Free" price="$0" desc="20 day one, then 5 each day" on={plan === 'free'} onPress={() => setPlan('free')} />
          </View>
        </Field>}
      </ScrollView>

      <View style={{ padding: 22, paddingBottom: insets.bottom + 14 }}>
        <Pressable style={styles.cta} onPress={next}><Text style={styles.ctaText}>{CTA[step]}</Text></Pressable>
        {step === 'plan' && <Text style={styles.fine}>Recurring billing. Cancel anytime.</Text>}
      </View>

      {/* PAYMENT */}
      <Portal visible={pay} animationType="slide" onRequestClose={() => setPay(false)}>
        <Pressable style={styles.scrim} onPress={() => setPay(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.grip} />
          {payState === 'form' && (
            <ScrollView>
              <View style={styles.payTop}>
                <Pressable style={styles.iconBtn} onPress={() => setPay(false)}><Ionicons name="chevron-back" size={18} color="#fff" /></Pressable>
                <Text style={styles.sheetTitle}>Payment Method</Text>
              </View>
              <PM label="Apple Pay" sub="Fast, secure checkout" icon={<Ionicons name="logo-apple" size={20} color="#000" />} on={method === 'apple'} onPress={() => setMethod('apple')} />
              <PM label="Credit or debit card" sub="Powered by Stripe" icon={<Ionicons name="card" size={20} color="#635bff" />} on={method === 'card'} onPress={() => setMethod('card')} />
              {method === 'card' && (
                <View style={{ marginTop: 4 }}>
                  <TextInput style={styles.input} placeholder="Card number" placeholderTextColor={colors.textFaint} keyboardType="number-pad" />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM / YY" placeholderTextColor={colors.textFaint} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="CVC" placeholderTextColor={colors.textFaint} keyboardType="number-pad" />
                  </View>
                  <TextInput style={styles.input} placeholder="Name on card" placeholderTextColor={colors.textFaint} />
                </View>
              )}
              <View style={styles.bd}>
                <Row k="Premium · Monthly" v="$8.00" /><Row k="Tax" v="$0.64" />
                <View style={styles.bdSep} /><Row k="Total" v="$8.64" total />
              </View>
              <Pressable style={styles.cta} onPress={() => { setPayState('proc'); setTimeout(() => setPayState('ok'), 1600); }}>
                <Text style={styles.ctaText}>{method === 'apple' ? 'Pay with Apple Pay' : 'Pay $8.64'}</Text>
              </Pressable>
              <Text style={styles.fine}>🔒 Secured by Stripe · Cancel anytime</Text>
            </ScrollView>
          )}
          {payState === 'proc' && <View style={{ alignItems: 'center', paddingVertical: 50 }}><ActivityIndicator color="#fff" /><Text style={[styles.doneSub, { marginTop: 16 }]}>Processing payment…</Text></View>}
          {payState === 'ok' && (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <View style={styles.check}><Ionicons name="checkmark" size={32} color="#fff" /></View>
              <Text style={styles.sheetTitle}>You're Premium</Text>
              <Text style={[styles.doneSub, { marginTop: 10, textAlign: 'center' }]}>Unlimited swipes and applications are now unlocked.</Text>
              <Pressable style={[styles.cta, { marginTop: 20 }]} onPress={() => { setPay(false); setDone(true); }}><Text style={styles.ctaText}>Continue</Text></Pressable>
            </View>
          )}
        </View>
      </Portal>
    </View>
  );
}

const Field = ({ title, sub, children }: any) => (
  <View><Text style={styles.h1}>{title}</Text><Text style={styles.sub}>{sub}</Text><View style={{ marginTop: 24 }}>{children}</View></View>
);
const Chip = ({ label, on, onPress }: any) => (
  <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text></Pressable>
);
const PlanCard = ({ label, price, desc, on, badge, onPress }: any) => (
  <Pressable onPress={onPress} style={[styles.plan, on && styles.planOn]}>
    {badge && <View style={styles.badge}><Text style={styles.badgeText}>BEST VALUE</Text></View>}
    <Text style={styles.planName}>{label}</Text>
    <Text style={styles.planPrice}>{price}</Text>
    <Text style={styles.planDesc}>{desc}</Text>
  </Pressable>
);
const PM = ({ label, sub, icon, on, onPress }: any) => (
  <Pressable onPress={onPress} style={[styles.pm, on && styles.pmOn]}>
    <View style={styles.pmIc}>{icon}</View>
    <View style={{ flex: 1 }}><Text style={styles.pmT}>{label}</Text><Text style={styles.pmS}>{sub}</Text></View>
    <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
  </Pressable>
);
const Row = ({ k, v, total }: any) => (
  <View style={styles.row}><Text style={[styles.rowK, total && styles.rowTotal]}>{k}</Text><Text style={[styles.rowV, total && styles.rowTotal]}>{v}</Text></View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: '#fff' },
  h1: { color: '#fff', fontFamily: font.bold, fontSize: 25, letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontFamily: font.regular, fontSize: 13, marginTop: 10, lineHeight: 19 },
  input: { height: 54, borderRadius: 14, paddingHorizontal: 16, marginBottom: 13, color: '#fff', fontFamily: font.regular, fontSize: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  codeRow: { flexDirection: 'row', gap: 9 },
  codeBox: { flex: 1, height: 56, borderRadius: 13, textAlign: 'center', color: '#fff', fontFamily: font.semibold, fontSize: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  glabel: { color: colors.textFaint, fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.4, marginTop: 10, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  chipOn: { backgroundColor: '#fff', borderColor: '#fff' },
  chipText: { color: '#fff', fontFamily: font.medium, fontSize: 13 }, chipTextOn: { color: '#111' },
  cta: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  ctaText: { color: '#fff', fontFamily: font.bold, fontSize: 15 },
  fine: { color: colors.textFaint, fontFamily: font.regular, fontSize: 10.5, textAlign: 'center', marginTop: 12 },
  // plan
  plan: { flex: 1, borderRadius: 22, padding: 18, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  planOn: { backgroundColor: '#232327', borderColor: colors.internship },
  badge: { position: 'absolute', top: -10, backgroundColor: colors.internship, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },
  badgeText: { color: '#fff', fontFamily: font.bold, fontSize: 9, letterSpacing: 0.4 },
  planName: { color: '#fff', fontFamily: font.bold, fontSize: 16 },
  planPrice: { color: '#fff', fontFamily: font.bold, fontSize: 26, marginTop: 4, letterSpacing: -1 },
  planDesc: { color: colors.textDim, fontFamily: font.regular, fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 15 },
  // done
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 34 },
  doneTitle: { color: '#fff', fontFamily: font.bold, fontSize: 27, letterSpacing: -0.6, textAlign: 'center' },
  doneSub: { color: colors.textDim, fontFamily: font.regular, fontSize: 13, textAlign: 'center', marginTop: 12, marginBottom: 28, lineHeight: 19 },
  // payment
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,6,10,0.6)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '92%', backgroundColor: 'rgba(20,20,24,0.98)', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 22, paddingTop: 14 },
  grip: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 14 },
  payTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  sheetTitle: { color: '#fff', fontFamily: font.semibold, fontSize: 19, letterSpacing: -0.3 },
  pm: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, marginBottom: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pmOn: { borderColor: colors.borderStrong, backgroundColor: colors.surface2 },
  pmIc: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pmT: { color: '#fff', fontFamily: font.semibold, fontSize: 14 }, pmS: { color: colors.textDim, fontFamily: font.regular, fontSize: 11, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: '#fff' }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  bd: { marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  rowK: { color: colors.textDim, fontFamily: font.regular, fontSize: 12.5 }, rowV: { color: '#fff', fontFamily: font.medium, fontSize: 12.5 },
  rowTotal: { color: '#fff', fontFamily: font.bold, fontSize: 15 },
  bdSep: { height: 1, backgroundColor: colors.hairline, marginVertical: 4 },
  check: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 16 },
});
