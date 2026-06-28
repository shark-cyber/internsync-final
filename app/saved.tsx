import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { Portal } from "../src/components/Portal";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../src/theme";
import { Menu } from "../src/components/Menu";
import { Glow } from "../src/components/Glow";
import { api } from "../src/lib/api";

// Types for job data
interface Job {
  _id: string;
  title: string;
  bannerImageUrl?: string;
  company?: { name: string; logoUrl?: string };
  description?: { details?: string; stipend?: { amount?: string | number } };
  location?: string;
  tags?: string[];
  categories?: string[];
  jobType?: string;
  isRemote?: boolean;
  applicationDeadline?: Date;
  sourceUrl?: string;
  applyMode?: "external" | "native";
  sourceType?: "csv" | "web";
}

interface SavedItem {
  swipeId: string;
  job: Job;
  swipedAt: Date;
  action: string;
}

export default function Saved() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [menu, setMenu] = useState(false);
  const [sb, setSb] = useState<{ width: number; height: number } | null>(null);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Job | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  // Helper to clean up URLs with extra quotes/backticks
  const cleanUrl = (url?: string) => {
    if (!url) return undefined;
    return url.replace(/^[\s`'"]+|[\s`'"]+$/g, "").trim();
  };

  // Fetch saved jobs
  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const result = await api.swipe.getLiked({ limit: 50 });
      console.log("api.swipe.getLiked returned:", result);
      if (result.success && result.data) {
        const normalizedItems = result.data
          .map((item: any) => {
            const job = item?.job || item?.jobId || item;
            console.log("Processing item:", item, "job:", job);
            if (!job?._id) return null;

            return {
              swipeId: item.swipeId || item._id || job._id,
              job,
              swipedAt: new Date(item.swipedAt || item.updatedAt || Date.now()),
              action: item.action || "like",
            };
          })
          .filter(Boolean);

        console.log("Normalized items:", normalizedItems);
        setSavedItems(normalizedItems as SavedItem[]);
      }
    } catch (error: any) {
      console.error("Error fetching saved jobs:", error);
      Alert.alert("Error", error.message || "Failed to load saved items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchSavedJobs();
  }, [authLoading, user]);

  const filteredItems = savedItems.filter((item) =>
    (
      (item.job.title || "") +
      (item.job.company?.name || "") +
      (item.job.categories || []).join(" ")
    )
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  const formatJobType = (jobType?: string) => {
    if (!jobType) return "Internship";
    const normalized = jobType.replace(/[-_]/g, " ").trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  // Helper to format job data for display
  const getJobDisplay = (job: Job) => {
    const fallbackTitle =
      job.company?.name && job.jobType
        ? `${formatJobType(job.jobType)} at ${job.company.name}`
        : job.company?.name || formatJobType(job.jobType);

    return {
      title: job.title?.trim() || fallbackTitle,
      sub: [job.company?.name, job.location, job.isRemote ? "Remote" : null]
        .filter(Boolean)
        .join(" • "),
      pay: job.description?.stipend?.amount
        ? `${job.description.stipend.amount}/month`
        : "",
      desc: job.description?.details || "No description available",
      letter: job.title?.[0] || "?",
    };
  };

  const unsaveJob = async (job: Job) => {
    if (!job?._id || busyJobId) return;
    setBusyJobId(job._id);
    try {
      await api.swipe.action(job._id, "dislike");
      setSavedItems((prev) => prev.filter((item) => item.job._id !== job._id));
      if (detail?._id === job._id) {
        setDetail(null);
      }
    } catch (error: any) {
      console.error("Error unsaving job:", error);
      Alert.alert("Error", error.message || "Failed to unsave internship");
    } finally {
      setBusyJobId(null);
    }
  };

  const applyToSavedJob = async (job: Job) => {
    if (!job?._id || busyJobId) return;
    setBusyJobId(job._id);
    try {
      const sourceUrl = cleanUrl(job.sourceUrl);
      const isExternal =
        job.sourceType === "csv" || job.applyMode === "external";
      if (isExternal && sourceUrl) {
        await Linking.openURL(sourceUrl);
        return;
      }

      await api.applications.createApplication(job._id);
      Alert.alert("Success", "Application submitted successfully");
    } catch (error: any) {
      console.error("Error applying to saved job:", error);
      Alert.alert("Error", error.message || "Failed to apply to internship");
    } finally {
      setBusyJobId(null);
    }
  };

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}>
          <Ionicons name="menu" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.htitle}>Saved</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={19} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color="#fff" />
          <Text style={[styles.empty, { marginTop: 12 }]}>
            Loading saved items...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 6 }}
        >
          {filteredItems.map((item) => {
            const displayData = getJobDisplay(item.job);
            return (
              <Pressable
                key={item.swipeId}
                style={styles.card}
                onPress={() => setDetail(item.job)}
              >
                {cleanUrl(item.job.bannerImageUrl) ? (
                  <Image
                    source={{ uri: cleanUrl(item.job.bannerImageUrl)! }}
                    style={styles.thumb}
                  />
                ) : cleanUrl(item.job.company?.logoUrl) ? (
                  <Image
                    source={{ uri: cleanUrl(item.job.company?.logoUrl)! }}
                    style={styles.thumb}
                  />
                ) : (
                  <View style={styles.letter}>
                    <Text style={styles.letterText}>{displayData.letter}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {displayData.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {displayData.sub}
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    hitSlop={10}
                    style={[styles.book, styles.applyMini]}
                    onPress={() => applyToSavedJob(item.job)}
                    disabled={busyJobId === item.job._id}
                  >
                    <Ionicons
                      name="paper-plane-outline"
                      size={15}
                      color="#fff"
                    />
                  </Pressable>
                  <Pressable
                    hitSlop={10}
                    style={styles.book}
                    onPress={() => unsaveJob(item.job)}
                    disabled={busyJobId === item.job._id}
                  >
                    <Ionicons name="trash-outline" size={15} color="#fff" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
          {filteredItems.length === 0 && (
            <Text style={styles.empty}>No saved items yet.</Text>
          )}
        </ScrollView>
      )}

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        <View style={{ flex: 1 }} onLayout={(e) => setSb(e.nativeEvent.layout)}>
          {sb && (
            <Glow
              width={sb.width}
              height={sb.height}
              rect={{ x: 0, y: 0, w: sb.width, h: sb.height, r: 21 }}
              blur={12}
            />
          )}
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={colors.textDim} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search saved…"
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
            />
          </View>
        </View>
        <Pressable style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} color="#fff" />
        </Pressable>
      </View>

      <Portal
        visible={!!detail}
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setDetail(null)}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.grip} />
          {detail &&
            (() => {
              const displayData = getJobDisplay(detail);
              return (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 13,
                      alignItems: "center",
                    }}
                  >
                    {cleanUrl(detail.bannerImageUrl) ? (
                      <Image
                        source={{ uri: cleanUrl(detail.bannerImageUrl)! }}
                        style={styles.dIco}
                      />
                    ) : cleanUrl(detail.company?.logoUrl) ? (
                      <Image
                        source={{ uri: cleanUrl(detail.company?.logoUrl)! }}
                        style={styles.dIco}
                      />
                    ) : (
                      <View style={[styles.dIco, styles.letter]}>
                        <Text style={styles.letterText}>
                          {displayData.letter}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dTitle}>{displayData.title}</Text>
                      <Text style={styles.sub}>{displayData.sub}</Text>
                    </View>
                  </View>
                  <Text style={[styles.pay, { marginTop: 14 }]}>
                    {displayData.pay}
                  </Text>
                  <Text style={styles.ih}>ABOUT</Text>
                  <Text style={styles.ibody}>{displayData.desc}</Text>
                  <View style={styles.sheetActions}>
                    <Pressable
                      style={[styles.visit, styles.secondaryAction]}
                      onPress={() => unsaveJob(detail)}
                      disabled={busyJobId === detail._id}
                    >
                      <Text style={styles.visitText}>
                        {busyJobId === detail._id ? "Please wait..." : "Unsave"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.visit}
                      onPress={() => applyToSavedJob(detail)}
                      disabled={busyJobId === detail._id}
                    >
                      <Text style={styles.visitText}>
                        {busyJobId === detail._id ? "Please wait..." : "Apply"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              );
            })()}
        </View>
      </Portal>

      <Menu visible={menu} onClose={() => setMenu(false)} current="/saved" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  htitle: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 11,
    borderRadius: radius.lg,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  thumb: { width: 48, height: 48, borderRadius: 14 },
  letter: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3a3a42",
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: { color: "#fff", fontFamily: font.semibold, fontSize: 16 },
  title: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  sub: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 2,
  },
  book: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  applyMini: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  empty: {
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 13,
    textAlign: "center",
    paddingTop: 40,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  search: {
    height: 42,
    borderRadius: 21,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: "#0e0e12",
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontFamily: font.regular,
    fontSize: 13,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,6,10,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20,20,24,0.97)",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  grip: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 16,
  },
  dIco: { width: 54, height: 54, borderRadius: 15 },
  dTitle: {
    color: "#fff",
    fontFamily: font.bold,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  pay: { color: "#fff", fontFamily: font.semibold, fontSize: 15 },
  ih: {
    color: colors.textDim,
    fontFamily: font.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    marginTop: 18,
    marginBottom: 8,
  },
  ibody: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: font.light,
    fontSize: 13,
    lineHeight: 21,
  },
  visit: {
    height: 52,
    flex: 1,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginTop: 22,
  },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 22 },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  visitText: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
});
