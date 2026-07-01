import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Portal } from "./Portal";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { colors, font, radius } from "../theme";
import { useAuth } from "../contexts/AuthContext";

type Item = { label: string; route: string };
const BROWSE: Item[] = [
  { label: "Internships", route: "/home" },
  { label: "Scholarships", route: "/scholarships" },
  { label: "Extracurriculars", route: "/extracurriculars" },
];
const LIBRARY: Item[] = [
  { label: "Saved", route: "/saved" },
  { label: "Tracker", route: "/tracker" },
];

export function Menu({
  visible,
  onClose,
  current,
}: {
  visible: boolean;
  onClose: () => void;
  current: string;
}) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const nav = (r: string) => {
    onClose();
    if (r !== current) router.replace(r as any);
  };

  // Get display name
  const displayName =
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ") ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Your profile";
  const initial = displayName.trim().charAt(0).toUpperCase() || "Y";
  const profileImage = userProfile?.profilePicture;

  const Row = ({ item }: { item: Item }) => (
    <Pressable
      onPress={() => nav(item.route)}
      style={[styles.row, current === item.route && styles.rowOn]}
    >
      <Text
        style={[styles.rowText, current === item.route && styles.rowTextOn]}
      >
        {item.label}
      </Text>
    </Pressable>
  );

  return (
    <Portal visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.menu}>
          <Text style={styles.sec}>BROWSE</Text>
          {BROWSE.map((i) => (
            <Row key={i.route} item={i} />
          ))}
          <Text style={styles.sec}>LIBRARY</Text>
          {LIBRARY.map((i) => (
            <Row key={i.route} item={i} />
          ))}
          <Text style={styles.sec}>ACCOUNT</Text>
          <Pressable
            onPress={() => nav("/profile")}
            style={[
              styles.row,
              { flexDirection: "row", alignItems: "center", gap: 10 },
              current === "/profile" && styles.rowOn,
            ]}
          >
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
            </View>
            <Text style={[styles.rowText, styles.rowTextOn]}>
              {displayName}
            </Text>
          </Pressable>
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,6,10,0.45)",
  },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: 19 },
  menu: {
    backgroundColor: "rgba(40,40,46,0.6)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 14,
    gap: 0,
  },
  sec: {
    color: "rgba(255,255,255,0.4)",
    fontFamily: font.semibold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
    marginLeft: 8,
  },
  row: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.sm },
  rowOn: { backgroundColor: "rgba(255,255,255,0.14)" },
  rowText: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: font.regular,
    fontSize: 14,
  },
  rowTextOn: { fontFamily: font.medium },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  avatarText: { color: "#fff", fontFamily: font.semibold, fontSize: 11 },
});
