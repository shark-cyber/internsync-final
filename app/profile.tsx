import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Portal } from "../src/components/Portal";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { colors, font, radius } from "../src/theme";
import { Menu } from "../src/components/Menu";
import { api } from "../src/lib/api";
import { useAuth } from "../src/contexts/AuthContext";
import {
  auth,
  updateEmail,
  updatePassword,
  getFirebaseErrorMessage,
} from "../src/lib/firebase";

type Act = {
  key: string;
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  danger?: boolean;
  component?: React.ReactNode;
  run?: (params?: any) => void | Promise<void>;
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    signOut,
    userProfile,
    loading: authLoading,
    refreshProfile,
  } = useAuth();
  const [menu, setMenu] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [act, setAct] = useState<Act | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState<{
    bio?: boolean;
    headline?: boolean;
    education?: boolean;
    skills?: boolean;
  }>({});

  // Edit fields
  const [editAboutMe, setEditAboutMe] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.profilePicture) {
      setPhoto(userProfile.profilePicture);
    }
    if (userProfile?.aboutMe) {
      setEditAboutMe(userProfile.aboutMe);
    }
    if (userProfile?.headline) {
      setEditHeadline(userProfile.headline);
    }
    if (userProfile?.resumeFileName) {
      setResumeFileName(userProfile.resumeFileName);
    }
  }, [userProfile]);

  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1100);
  };

  const handlePickPhoto = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let fileToUpload;

        if (Platform.OS === "web") {
          // On web, convert to File
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          fileToUpload = new File([blob], "profile.jpg", {
            type: asset.mimeType || "image/jpeg",
          });
        } else {
          fileToUpload = {
            uri: asset.uri,
            mimeType: asset.mimeType,
            name: "profile.jpg",
          };
        }

        const uploadResult = await api.user.uploadProfilePicture(fileToUpload);
        if (uploadResult.success && uploadResult.url) {
          setPhoto(uploadResult.url);
          await refreshProfile();
          flash("Profile picture updated!");
        }
      }
    } catch (error: any) {
      console.error("Error picking photo:", error);
      Alert.alert("Error", error.message || "Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handlePickResume = async () => {
    try {
      setUploading(true);

      // On native (and web with expo-document-picker), use document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      let fileToUpload;
      let fileName = "";
      if (Platform.OS === "web") {
        // On web, convert to File
        const asset = result.assets[0];
        fileName = asset.name;
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        fileToUpload = new File([blob], asset.name, { type: asset.mimeType });
      } else {
        // On native, use URI
        const asset = result.assets[0];
        fileName = asset.name;
        fileToUpload = {
          uri: asset.uri,
          mimeType: asset.mimeType,
          name: asset.name,
        };
      }

      const uploadResult = await api.user.uploadResume(fileToUpload);
      if (uploadResult.success) {
        setResumeFileName(fileName);
        await refreshProfile();
        flash("Resume uploaded!");
      }
    } catch (error: any) {
      console.error("Error picking resume:", error);
      if (error.message !== "No file selected") {
        Alert.alert("Error", error.message || "Failed to upload resume");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateHeadline = async () => {
    try {
      setSaving(true);
      await api.user.updateHeadline(editHeadline);
      await refreshProfile();
      setEditMode({ ...editMode, headline: false });
      flash("Headline updated!");
    } catch (error: any) {
      console.error("Error updating headline:", error);
      Alert.alert("Error", error.message || "Failed to update headline");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAboutMe = async () => {
    try {
      setSaving(true);
      await api.user.updateAboutMe(editAboutMe);
      await refreshProfile();
      setEditMode({ ...editMode, bio: false });
      flash("Bio updated!");
    } catch (error: any) {
      console.error("Error updating bio:", error);
      Alert.alert("Error", error.message || "Failed to update bio");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await api.user.deleteAccount();
      await signOut();
      router.replace("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", error.message || "Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }
      await updateEmail(user, newEmail);
      await refreshProfile();
      setNewEmail("");
      flash("Email updated!");
    } catch (error: any) {
      console.error("Error updating email:", error);
      Alert.alert("Error", getFirebaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert(
        "Error",
        "Please enter a password that is at least 8 characters long.",
      );
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }
      await updatePassword(user, newPassword);
      setNewPassword("");
      flash("Password updated!");
    } catch (error: any) {
      console.error("Error updating password:", error);
      Alert.alert("Error", getFirebaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const ACTIONS: Act[] = [
    {
      key: "email",
      title: "Change email",
      body: "Enter the new email for your account.",
      confirm: "Save",
      cancel: "Cancel",
      run: handleChangeEmail,
    },
    {
      key: "password",
      title: "Change password",
      body: "Set a new password (at least 8 characters).",
      confirm: "Update",
      cancel: "Cancel",
      run: handleChangePassword,
    },
    {
      key: "upgrade",
      title: "Upgrade to Premium",
      body: "Unlock unlimited swipes and applications for $8/mo.",
      confirm: "Upgrade · $8/mo",
      cancel: "Maybe later",
      run: async () => {
        try {
          const session = await api.billing.createCheckoutSession({
            successUrl: "internsync://profile/success",
            cancelUrl: "internsync://profile/cancel",
          });
          if (session.success && session.checkoutUrl) {
            await Linking.openURL(session.checkoutUrl);
          }
        } catch (error: any) {
          console.error("Checkout error:", error);
          Alert.alert("Error", error.message || "Failed to start checkout");
        }
      },
    },
    {
      key: "cancel",
      title: "Cancel Premium?",
      body: "You'll keep Premium until the end of your billing period, then move to Free.",
      confirm: "Cancel plan",
      cancel: "Keep Premium",
      danger: true,
      run: async () => {
        try {
          await api.billing.cancelSubscription({ atPeriodEnd: true });
          await refreshProfile();
          flash("Plan cancelled");
        } catch (error: any) {
          console.error("Cancel error:", error);
          Alert.alert(
            "Error",
            error.message || "Failed to cancel subscription",
          );
        }
      },
    },
    {
      key: "logout",
      title: "Log out?",
      body: "You'll need to sign in again to access your account.",
      confirm: "Log out",
      cancel: "Cancel",
      run: async () => {
        try {
          await signOut();
          router.replace("/");
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    },
    {
      key: "delete",
      title: "Delete account?",
      body: "This permanently deletes your account, profile and saved items. This can't be undone.",
      confirm: "Delete account",
      cancel: "Cancel",
      danger: true,
      run: handleDeleteAccount,
    },
  ];

  const Section = ({
    icon,
    title,
    children,
    action,
    onActionPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    children?: React.ReactNode;
    action?: React.ReactNode;
    onActionPress?: () => void;
  }) => (
    <View style={styles.section}>
      <View style={styles.secHead}>
        <View style={styles.si}>
          <Ionicons name={icon} size={15} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.secTitle}>{title}</Text>
        {action && (
          <Pressable style={styles.secAct} onPress={onActionPress}>
            {action}
          </Pressable>
        )}
      </View>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );

  if (authLoading) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // Helper to get full name or initials
  const fullName =
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ") ||
    "User";
  const initials =
    [userProfile?.firstName?.[0], userProfile?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "U";

  return (
    <View style={styles.root}>
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.initWrap}>
            <Text style={styles.init}>{initials}</Text>
          </View>
        </View>
      )}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(6,6,9,0.55)", "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 130 }}
      />

      <BlurView
        intensity={40}
        tint="dark"
        pointerEvents="none"
        style={[styles.headerBlur, { height: insets.top + 62 }]}
      />
      <View style={[styles.top, { paddingTop: insets.top + 16 }]}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => router.replace("/home")}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>Profile</Text>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}>
          <Ionicons name="menu" size={18} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.spacer}>
          <LinearGradient
            pointerEvents="none"
            colors={["transparent", "rgba(8,8,10,0.2)", "rgba(8,8,10,0.9)"]}
            locations={[0.4, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.who}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Text style={styles.name}>{fullName}</Text>
              {!editMode.headline && (
                <Pressable
                  style={{ padding: 4 }}
                  onPress={() => setEditMode({ ...editMode, headline: true })}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.textFaint}
                  />
                </Pressable>
              )}
            </View>
            {editMode.headline ? (
              <View style={{ width: "100%", gap: 8 }}>
                <TextInput
                  style={styles.headlineInput}
                  placeholder="Add a headline"
                  placeholderTextColor={colors.textFaint}
                  value={editHeadline}
                  onChangeText={setEditHeadline}
                  autoFocus
                  multiline
                />
                <View style={styles.editActions}>
                  <Pressable
                    style={[styles.btn, styles.btnSecondary]}
                    onPress={() => {
                      setEditHeadline(userProfile?.headline || "");
                      setEditMode({ ...editMode, headline: false });
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.btnTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={handleUpdateHeadline}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.role}>{userProfile?.headline || ""}</Text>
            )}
          </View>
          <Pressable
            style={styles.cam}
            onPress={handlePickPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="camera-outline" size={18} color="#fff" />
            )}
          </Pressable>
        </View>

        <BlurView intensity={50} tint="dark" style={styles.panel}>
          <View style={styles.pgrip} />

          <Section
            icon="person-outline"
            title="Bio"
            action={<Ionicons name="create-outline" size={14} color="#fff" />}
            onActionPress={() =>
              setEditMode({ ...editMode, bio: !editMode.bio })
            }
          >
            {editMode.bio ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.bioInput}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.textFaint}
                  value={editAboutMe}
                  onChangeText={setEditAboutMe}
                  autoFocus
                  multiline
                  editable={!saving}
                />
                <View style={styles.editActions}>
                  <Pressable
                    style={[styles.btn, styles.btnSecondary]}
                    onPress={() => {
                      setEditAboutMe(userProfile?.aboutMe || "");
                      setEditMode({ ...editMode, bio: false });
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.btnTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={handleUpdateAboutMe}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.pText}>
                {userProfile?.aboutMe || "No bio yet"}
              </Text>
            )}
          </Section>

          {userProfile?.education && userProfile.education.length > 0 && (
            <Section
              icon="school-outline"
              title="Education"
              action={<Ionicons name="add" size={16} color="#fff" />}
            >
              {userProfile.education.map((edu: any, index: number) => (
                <View key={edu._id || index} style={styles.educationItem}>
                  <Text style={styles.itemT}>
                    {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" ") ||
                      "Education"}
                  </Text>
                  <Text style={styles.itemS}>
                    {[
                      edu.institution,
                      edu.startDate
                        ? `· ${new Date(edu.startDate).getFullYear()}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                </View>
              ))}
            </Section>
          )}

          {userProfile?.skills && userProfile.skills.length > 0 && (
            <Section
              icon="sparkles-outline"
              title="Skills"
              action={<Ionicons name="add" size={16} color="#fff" />}
            >
              <View style={styles.chipWrap}>
                {userProfile.skills.map((skill: string, index: number) => (
                  <View key={skill + index} style={styles.chip}>
                    <Text style={styles.chipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          <Section icon="document-text-outline" title="Resume">
            <Pressable
              style={styles.resume}
              onPress={handlePickResume}
              disabled={uploading}
            >
              <View style={styles.pdf}>
                <Ionicons name="document-text-outline" size={24} color="#fff" />
                {uploading && (
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                    style={{ position: "absolute" }}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemT}>
                  {userProfile?.resumeUrl
                    ? userProfile.resumeFileName || resumeFileName || "Resume"
                    : "No resume uploaded"}
                </Text>
                <Text style={styles.itemS}>
                  {userProfile?.resumeUrl
                    ? "Click to replace"
                    : "Upload a resume"}
                </Text>
              </View>
              <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
            </Pressable>
          </Section>

          <Section icon="settings-outline" title="Account">
            <View style={{ gap: 8 }}>
              {ACTIONS.map((a) => (
                <Pressable
                  key={a.key}
                  style={styles.setRow}
                  onPress={() => setAct(a)}
                >
                  <Text
                    style={[
                      styles.setText,
                      a.danger &&
                        a.key === "delete" && { color: colors.redSoft },
                    ]}
                  >
                    {a.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textFaint}
                  />
                </Pressable>
              ))}
            </View>
          </Section>

          <View style={{ height: insets.bottom + 24 }} />
        </BlurView>
      </ScrollView>

      {/* settings confirm sheet */}
      <Portal
        visible={!!act}
        animationType="slide"
        onRequestClose={() => setAct(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setAct(null)}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
              <View style={styles.pgrip} />
              {act && (
                <>
                  <Text style={styles.sheetTitle}>{act.title}</Text>
                  {(act.key === "email" || act.key === "password") && (
                    <TextInput
                      placeholder={
                        act.key === "email" ? "you@example.com" : "New password"
                      }
                      placeholderTextColor={colors.textFaint}
                      secureTextEntry={act.key === "password"}
                      style={styles.input}
                      value={act.key === "email" ? newEmail : newPassword}
                      onChangeText={
                        act.key === "email" ? setNewEmail : setNewPassword
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                  {act.key !== "email" && act.key !== "password" && (
                    <Text style={[styles.pText, { marginTop: 6 }]}>
                      {act.body}
                    </Text>
                  )}
                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 22 }}
                  >
                    <Pressable
                      style={styles.ghost}
                      onPress={() => setAct(null)}
                      disabled={saving}
                    >
                      <Text style={styles.ghostText}>{act.cancel}</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.save,
                        act.danger && {
                          backgroundColor: "rgba(239,68,68,0.18)",
                          borderColor: "rgba(239,68,68,0.4)",
                        },
                      ]}
                      onPress={async () => {
                        const r = act.run;
                        setAct(null);
                        if (r) {
                          if (act.key === "delete" || act.key === "logout") {
                            await r();
                          } else {
                            r();
                          }
                        }
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.saveText,
                            act.danger && { color: colors.redSoft },
                          ]}
                        >
                          {act.confirm}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Portal>

      {!!toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <Menu visible={menu} onClose={() => setMenu(false)} current="/profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  initWrap: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  init: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: font.semibold,
    fontSize: 62,
    letterSpacing: 3,
  },
  headerBlur: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 4 },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,20,24,0.5)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  topTitle: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  spacer: { height: 218, justifyContent: "flex-end" },
  who: { position: "absolute", left: 20, right: 70, bottom: 16 },
  name: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  role: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 3,
  },
  headlineInput: {
    color: "#fff",
    fontFamily: font.regular,
    fontSize: 14,
    marginTop: 3,
    minHeight: 40,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.sm,
  },
  cam: {
    position: "absolute",
    right: 18,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,20,24,0.6)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  panel: {
    backgroundColor: "rgba(20,20,24,0.55)",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 600,
    overflow: "hidden",
  },
  pgrip: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignSelf: "center",
    marginVertical: 10,
  },
  section: {
    borderTopWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 16,
  },
  secHead: { flexDirection: "row", alignItems: "center", gap: 9 },
  si: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secTitle: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 13.5,
    flex: 1,
  },
  secAct: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pText: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: font.light,
    fontSize: 12.5,
    lineHeight: 20,
  },
  bioInput: {
    color: "#fff",
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.md,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  editContainer: { gap: 12 },
  editActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    minWidth: 80,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { color: "#fff", fontFamily: font.semibold, fontSize: 13 },
  btnTextSecondary: {
    color: colors.textFaint,
    fontFamily: font.semibold,
    fontSize: 13,
  },
  educationItem: { marginBottom: 12 },
  itemT: { color: "#fff", fontFamily: font.semibold, fontSize: 13 },
  itemS: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 2,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: "#fff", fontFamily: font.regular, fontSize: 11.5 },
  resume: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  pdf: {
    width: 38,
    height: 44,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  setText: { color: "#fff", fontFamily: font.medium, fontSize: 13 },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,6,9,0.45)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "92%",
  },
  sheet: {
    backgroundColor: "rgba(20,20,24,0.97)",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  sheetTitle: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 19,
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginTop: 14,
    color: "#fff",
    fontFamily: font.regular,
    fontSize: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghostText: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  save: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  saveText: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(20,20,24,0.85)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  toastText: { color: "#fff", fontFamily: font.semibold, fontSize: 12.5 },
});
