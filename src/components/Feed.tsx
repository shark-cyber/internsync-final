import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Portal } from "./Portal";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, Accent } from "../theme";
import { Menu } from "./Menu";
import { Chip } from "./ui";
import { Glow } from "./Glow";
import { api } from "../lib/api";
import { useRouter } from "expo-router";

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
}

// Type for notification data from API
interface Notif {
  _id: string;
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

const accentHex: Record<Accent, string> = {
  internship: colors.internship,
  scholarship: colors.scholarship,
  extracurricular: colors.extracurricular,
};
const filtersFor: Record<Accent, { label: string; opts: string[] }[]> = {
  internship: [
    {
      label: "Job type",
      opts: ["Internship", "Full-time", "Part-time", "Contract"],
    },
    { label: "Work mode", opts: ["Remote", "On-site", "Hybrid"] },
    { label: "Experience", opts: ["Entry", "Mid", "Senior"] },
  ],
  scholarship: [
    {
      label: "Award type",
      opts: ["Merit-based", "Need-based", "Research", "Athletic"],
    },
    {
      label: "Level",
      opts: ["High school", "Undergraduate", "Graduate", "PhD"],
    },
  ],
  extracurricular: [
    {
      label: "Category",
      opts: ["Sports", "Arts", "Academic", "Volunteer", "Music", "Tech"],
    },
    { label: "Commitment", opts: ["One-time", "Weekly", "Monthly"] },
    { label: "Cost", opts: ["Free", "Paid"] },
  ],
};

// Persistence helpers
const getFiltersStorageKey = (accent: Accent) => `internsync-filters-${accent}`;

const loadSavedFilters = async (
  accent: Accent,
): Promise<Record<string, boolean>> => {
  try {
    const key = getFiltersStorageKey(accent);
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Failed to load filters:", error);
    return {};
  }
};

const saveFilters = async (
  accent: Accent,
  filters: Record<string, boolean>,
) => {
  try {
    const key = getFiltersStorageKey(accent);
    await AsyncStorage.setItem(key, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save filters:", error);
  }
};

export default function Feed({
  accent,
  current,
}: {
  accent: Accent;
  current: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const THRESHOLD = Math.max(90, width * 0.26);
  const [menu, setMenu] = useState(false);
  const [notif, setNotif] = useState(false);
  const [filter, setFilter] = useState(false);
  const [info, setInfo] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");
  const [deck, setDeck] = useState<{ width: number; height: number } | null>(
    null,
  );
  const pos = useRef(new Animated.ValueXY()).current;
  const accentCol = accentHex[accent];
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const hasUnread = notifications.some((n) => !n.read);

  // Helper to format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const result = await api.notifications.list();
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotifLoading(false);
    }
  };

  // Mark notification as read
  const markNotifRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (error: any) {
      console.error("Error marking notification read:", error);
    }
  };

  // Extract selected filter values
  const getSelectedFilters = (currentPicked: Record<string, boolean>) => {
    const jobTypes: string[] = [];
    const workModes: string[] = [];
    const experienceLevels: string[] = [];

    Object.entries(currentPicked).forEach(([key, selected]) => {
      if (selected) {
        const actualKey = key.replace(/^(Job type|Work mode|Experience)/, "");
        if (
          ["Internship", "Full-time", "Part-time", "Contract"].includes(
            actualKey,
          )
        ) {
          jobTypes.push(actualKey);
        } else if (["Remote", "On-site", "Hybrid"].includes(actualKey)) {
          workModes.push(actualKey);
        } else if (["Entry", "Mid", "Senior"].includes(actualKey)) {
          experienceLevels.push(actualKey);
        }
      }
    });

    return { jobTypes, workModes, experienceLevels };
  };

  // Handle apply filters
  const applyFilters = async () => {
    await saveFilters(accent, picked);
    setFilter(false);
    fetchNextJob(picked);
  };

  // Handle reset filters
  const resetFilters = async () => {
    const resetPicked = {};
    setPicked(resetPicked);
    await saveFilters(accent, resetPicked);
    setFilter(false);
    fetchNextJob(resetPicked);
  };

  const rotate = pos.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const saveOp = pos.x.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const passOp = pos.x.interpolate({
    inputRange: [-THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 950);
  };

  const resetCardPosition = () => {
    Animated.spring(pos, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const isSwipeLimitError = (error: any) =>
    error?.status === 429 ||
    /free tier swipe limit reached/i.test(error?.message || "");

  // Fetch next job
  const fetchNextJob = async (currentPicked = picked) => {
    setLoading(true);
    try {
      const { jobTypes, workModes, experienceLevels } =
        getSelectedFilters(currentPicked);
      const result = await api.swipe.getNext(
        accent,
        jobTypes,
        workModes,
        experienceLevels,
      );
      if (result.success && result.data) {
        setCurrentJob(result.data);
      } else {
        setCurrentJob(null);
      }
    } catch (error: any) {
      console.error("Error fetching job:", error);
      Alert.alert("Error", error.message || "Failed to load opportunities");
      setCurrentJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const saved = await loadSavedFilters(accent);
      setPicked(saved);
      fetchNextJob(saved);
    };
    init();
  }, [accent]);

  useEffect(() => {
    if (notif) {
      fetchNotifications();
    }
  }, [notif]);

  const handleSwipe = async (
    action: "like" | "dislike" | "superlike" | "skip" | "apply",
  ) => {
    if (!currentJob?._id) return;

    try {
      if (action === "apply") {
        // Create application when applying (swipe right or checkmark button)
        await api.applications.createApplication(currentJob._id);
        showToast("Application Submitted!");
      } else {
        // Use swipe action for save/like/dislike
        await api.swipe.action(currentJob._id, action);
        showToast(
          action === "like" || action === "superlike" ? "Saved" : "Passed",
        );
      }

      // Reset position and fetch next job
      pos.setValue({ x: 0, y: 0 });
      await fetchNextJob();
    } catch (error: any) {
      console.error("Error during swipe:", error);
      resetCardPosition();

      if (isSwipeLimitError(error)) {
        setLimitMessage(
          error.message ||
            "Free tier swipe limit reached. Upgrade to Premium to continue.",
        );
        return;
      }

      Alert.alert("Error", error.message || "Failed to complete action");
    }
  };

  const decide = (dir: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(pos, {
      toValue: { x: dir * width * 1.3, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(async () => {
      await handleSwipe(dir > 0 ? "apply" : "dislike");
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy * 0.15 }),
      onPanResponderRelease: async (_, g) => {
        if (g.dx > THRESHOLD) {
          decide(1);
        } else if (g.dx < -THRESHOLD) {
          decide(-1);
        } else {
          Animated.spring(pos, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    }),
  ).current;

  // Helper to clean up URLs with extra quotes/backticks
  const cleanUrl = (url?: string) => {
    if (!url) return undefined;
    return url.replace(/^[\s`'"]+|[\s`'"]+$/g, "").trim();
  };

  // Helper to format job data for display
  const getJobDisplay = (job: Job) => {
    return {
      title: job.title || "Opportunity",
      meta: [job.company?.name, job.location, job.isRemote ? "Remote" : null]
        .filter(Boolean)
        .join(" • "),
      pay: job.description?.stipend?.amount
        ? `${job.description.stipend.amount}/month`
        : "",
      chips: [...(job.tags || []), ...(job.categories || [])].slice(0, 3),
      desc: job.description?.details || "No description available",
      tag: job.categories?.[0] || accent,
    };
  };

  const displayData = currentJob ? getJobDisplay(currentJob) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => setMenu(true)}>
          <Ionicons name="menu" size={20} color="#fff" />
        </Pressable>
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
            rect={{
              x: 16,
              y: 16,
              w: deck.width - 32,
              h: deck.height - 32,
              r: 28,
            }}
          />
        )}
        {loading ? (
          <View
            style={[
              styles.card,
              styles.empty,
              { borderColor: accentCol + "55" },
            ]}
          >
            <ActivityIndicator color="#fff" />
            <Text style={[styles.emptySub, { marginTop: 12 }]}>
              Loading opportunities...
            </Text>
          </View>
        ) : !currentJob ? (
          <View
            style={[
              styles.card,
              styles.empty,
              { borderColor: accentCol + "55" },
            ]}
          >
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySub}>
              Check back soon for new matches.
            </Text>
          </View>
        ) : (
          <Pressable style={styles.cardPressable} onPress={() => setInfo(true)}>
            <Animated.View
              {...pan.panHandlers}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: pos.x },
                    { translateY: pos.y },
                    { rotate },
                  ],
                },
              ]}
            >
              {cleanUrl(currentJob.bannerImageUrl) ? (
                <Image
                  source={{ uri: cleanUrl(currentJob.bannerImageUrl)! }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : cleanUrl(currentJob.company?.logoUrl) ? (
                <Image
                  source={{ uri: cleanUrl(currentJob.company?.logoUrl)! }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: "#1a1a22", zIndex: 0 },
                  ]}
                />
              )}
              <LinearGradient
                pointerEvents="none"
                colors={["transparent", "rgba(5,5,8,0.3)", "rgba(5,5,8,0.96)"]}
                locations={[0.35, 0.55, 1]}
                style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
              />
              {/* filter chip */}
              <Pressable
                style={styles.cardFilter}
                onPress={() => setFilter(true)}
              >
                <Ionicons name="options-outline" size={18} color="#fff" />
              </Pressable>
              <View
                style={[
                  styles.tag,
                  { backgroundColor: accentCol + "88", borderColor: accentCol },
                ]}
              >
                <Text style={styles.tagText}>{displayData?.tag}</Text>
              </View>
              {/* swipe labels */}
              <Animated.View
                style={[styles.lbl, styles.lblSave, { opacity: saveOp }]}
              >
                <Text style={styles.lblSaveText}>SAVE</Text>
              </Animated.View>
              <Animated.View
                style={[styles.lbl, styles.lblPass, { opacity: passOp }]}
              >
                <Text style={styles.lblPassText}>PASS</Text>
              </Animated.View>

              <View style={styles.foreground}>
                <View style={styles.body}>
                  <Text style={styles.title}>{displayData?.title}</Text>
                  <Text style={styles.meta}>{displayData?.meta}</Text>
                  <Text style={[styles.pay, { color: "#fff" }]}>
                    {displayData?.pay}
                  </Text>
                  <View style={styles.chips}>
                    {(displayData?.chips || []).map((c, i) => (
                      <View key={i} style={styles.miniChip}>
                        <Text style={styles.miniChipText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.desc} numberOfLines={2}>
                    {displayData?.desc}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Pressable>
        )}
      </View>

      {/* actions */}
      {currentJob && !loading && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable
            style={[styles.act, styles.reject]}
            onPress={() => decide(-1)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.act, styles.infoBtn]}
            onPress={() => handleSwipe("like")}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.act, styles.apply]}
            onPress={() => handleSwipe("apply")}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </Pressable>
        </View>
      )}

      {!!toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 96 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* notifications */}
      <Sheet
        visible={notif}
        onClose={() => setNotif(false)}
        title="Notifications"
      >
        {notifLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color="#fff" />
            <Text style={[styles.notifT, { marginTop: 12 }]}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <Text
            style={{
              color: colors.textFaint,
              fontFamily: font.regular,
              fontSize: 13,
              textAlign: "center",
              paddingTop: 40,
            }}
          >
            No notifications yet.
          </Text>
        ) : (
          notifications.map((n) => (
            <Pressable
              key={n._id}
              style={styles.notifRow}
              onPress={() => !n.read && markNotifRead(n._id)}
            >
              <View
                style={[
                  styles.notifDot,
                  n.read && { backgroundColor: "rgba(255,255,255,0.22)" },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.notifT}>{n.title}</Text>
                <Text style={styles.notifS}>{n.body}</Text>
              </View>
              <Text style={styles.notifTime}>{formatTime(n.createdAt)}</Text>
            </Pressable>
          ))
        )}
      </Sheet>

      {/* filter */}
      <Sheet visible={filter} onClose={() => setFilter(false)} title="Filters">
        {filtersFor[accent].map((g) => (
          <View key={g.label}>
            <Text style={styles.flabel}>{g.label}</Text>
            <View style={styles.chipWrap}>
              {g.opts.map((o) => (
                <Chip
                  key={o}
                  label={o}
                  selected={!!picked[g.label + o]}
                  onPress={() =>
                    setPicked((p) => ({ ...p, [g.label + o]: !p[g.label + o] }))
                  }
                />
              ))}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
          <Pressable style={styles.reset} onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </Sheet>

      {/* info */}
      <Sheet
        visible={info}
        onClose={() => setInfo(false)}
        title={currentJob?.title || "Opportunity"}
      >
        {currentJob && displayData && (
          <>
            <View
              style={[
                styles.tag,
                {
                  alignSelf: "flex-start",
                  position: "relative",
                  top: 0,
                  right: 0,
                  marginBottom: 12,
                  backgroundColor: accentCol + "33",
                  borderColor: accentCol + "66",
                },
              ]}
            >
              <Text style={styles.tagText}>{displayData.tag}</Text>
            </View>
            <Text style={styles.meta}>{displayData.meta}</Text>
            <Text style={[styles.pay, { marginTop: 4 }]}>
              {displayData.pay}
            </Text>
            <Text style={styles.ih}>ABOUT</Text>
            <Text style={styles.ibody}>{displayData.desc}</Text>
            <Pressable style={styles.visit}>
              <Text style={styles.visitText}>View opportunity ↗</Text>
            </Pressable>
          </>
        )}
      </Sheet>

      <Sheet
        visible={!!limitMessage}
        onClose={() => setLimitMessage("")}
        title="Daily Limit Reached"
      >
        <Text style={styles.limitBody}>{limitMessage}</Text>
        <View style={styles.limitActions}>
          <Pressable style={styles.reset} onPress={() => setLimitMessage("")}>
            <Text style={styles.resetText}>Maybe later</Text>
          </Pressable>
          <Pressable
            style={styles.applyBtn}
            onPress={() => {
              setLimitMessage("");
              router.push("/profile");
            }}
          >
            <Text style={styles.applyText}>Upgrade</Text>
          </Pressable>
        </View>
      </Sheet>

      <Menu visible={menu} onClose={() => setMenu(false)} current={current} />
    </View>
  );
}

/* ---- shared bottom sheet ---- */
function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Portal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetScrim} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.grip} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={{ marginTop: 12 }}>{children}</ScrollView>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: "absolute", left: 0, right: 0, bottom: 0, height: 260 },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#f43f5e",
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  deck: { flex: 1, padding: 16 },
  cardPressable: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: "#111115",
    zIndex: 1,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d11",
  },
  emptyTitle: { color: "#fff", fontFamily: font.semibold, fontSize: 17 },
  emptySub: {
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 8,
  },
  cardFilter: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18,18,26,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    zIndex: 3,
  },
  tag: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    zIndex: 3,
  },
  tagText: { color: "#fff", fontFamily: font.semibold, fontSize: 11 },
  lbl: {
    position: "absolute",
    top: 60,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 10,
    zIndex: 3,
  },
  lblSave: { left: 18, borderColor: "#5fd08a" },
  lblSaveText: {
    color: "#5fd08a",
    fontFamily: font.bold,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  lblPass: { right: 18, borderColor: "#f08585" },
  lblPassText: {
    color: "#f08585",
    fontFamily: font.bold,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  body: {
    width: "100%",
    padding: 20,
  },
  foreground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    zIndex: 3,
  },
  title: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  meta: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: font.regular,
    fontSize: 13,
    marginTop: 8,
  },
  pay: { color: "#fff", fontFamily: font.semibold, fontSize: 15, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  miniChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  miniChipText: { color: "#fff", fontFamily: font.medium, fontSize: 11 },
  desc: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: font.light,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    paddingTop: 8,
  },
  act: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
  reject: { width: 54, height: 54, backgroundColor: colors.red },
  infoBtn: {
    width: 46,
    height: 46,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  apply: { width: 60, height: 60, backgroundColor: colors.green },
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
  // sheet
  sheetScrim: {
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
    maxHeight: "82%",
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
    marginBottom: 14,
  },
  sheetTitle: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  notifRow: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.hairline,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f43f5e",
    marginTop: 5,
  },
  notifT: { color: "#fff", fontFamily: font.semibold, fontSize: 13 },
  notifS: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  notifTime: {
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 10.5,
  },
  flabel: {
    color: colors.textDim,
    fontFamily: font.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 9,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reset: {
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  resetText: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  applyBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  applyText: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  limitBody: {
    color: "rgba(255,255,255,0.74)",
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  limitActions: { flexDirection: "row", gap: 10, marginTop: 22 },
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
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginTop: 22,
  },
  visitText: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
});
