import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, font, radius } from '../src/theme';
import { useAuth } from '../src/contexts/AuthContext';

export default function Application() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [cv, setCv] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const fullName = [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ');

  const pickCv = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) setCv((res.assets[0].fileName || 'document') as string);
  };
  const submit = () => { setSent(true); setTimeout(() => router.back(), 1100); };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
        <Text style={styles.title}>Application</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <TextInput style={styles.fld} placeholder="Enter full name" placeholderTextColor={colors.textFaint} defaultValue={fullName} />
        <TextInput style={styles.fld} placeholder="Enter portfolio link" placeholderTextColor={colors.textFaint} autoCapitalize="none" />

        <Pressable style={[styles.upload, cv && styles.uploadHas]} onPress={pickCv}>
          <Ionicons name="cloud-upload-outline" size={30} color="#fff" />
          <Text style={styles.ut}>{cv ? cv : 'Upload CV'}</Text>
          <Text style={styles.us}>PDF or DOCX · up to 10 MB</Text>
        </Pressable>

        <TextInput style={styles.note} placeholder="write something…" placeholderTextColor={colors.textFaint} multiline />
      </ScrollView>

      <View style={{ padding: 18, paddingBottom: insets.bottom + 16 }}>
        <Pressable style={[styles.submit, sent && styles.submitDone]} onPress={submit}>
          <Text style={[styles.submitText, sent && { color: colors.greenSoft }]}>{sent ? '✓ Application submitted' : 'Submit Application'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  title: { color: '#fff', fontFamily: font.bold, fontSize: 15, letterSpacing: 0.3 },
  fld: { height: 52, borderRadius: 14, paddingHorizontal: 16, marginBottom: 13, color: '#fff', fontFamily: font.regular, fontSize: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  upload: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderStyle: 'dashed', borderRadius: 16, paddingVertical: 26, paddingHorizontal: 16, marginBottom: 13, alignItems: 'center', gap: 10 },
  uploadHas: { borderStyle: 'solid', borderColor: 'rgba(34,197,94,0.5)', backgroundColor: 'rgba(34,197,94,0.08)' },
  ut: { color: '#fff', fontFamily: font.semibold, fontSize: 13 },
  us: { color: colors.textFaint, fontFamily: font.regular, fontSize: 10.5 },
  note: { minHeight: 120, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderStyle: 'dashed', borderRadius: 16, padding: 14, color: '#fff', fontFamily: font.regular, fontSize: 13, textAlignVertical: 'top' },
  submit: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
  submitDone: { backgroundColor: 'rgba(34,197,94,0.18)' },
  submitText: { color: '#fff', fontFamily: font.bold, fontSize: 14 },
});
