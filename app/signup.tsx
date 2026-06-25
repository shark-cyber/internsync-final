import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { Portal } from "../src/components/Portal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { colors, font, radius } from "../src/theme";
import { api } from "../src/lib/api";
import {
  auth,
  createUserWithEmailAndPassword,
  getIdToken,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  getFirebaseErrorMessage,
} from "../src/lib/firebase";
import { syncOrCreateSocialUser } from "../src/lib/socialAuth";

WebBrowser.maybeCompleteAuthSession();

const STEPS = [
  "email",
  "code",
  "password",
  "name",
  "birthday",
  "interests",
  "job",
  "plan",
] as const;
const CTA: Record<string, string> = {
  email: "Send Verification Code",
  code: "Verify",
  password: "Continue",
  name: "Continue",
  birthday: "Continue",
  interests: "Continue",
  job: "Continue",
  plan: "Continue",
};
const INTERESTS = [
  "Software",
  "Engineering",
  "Design",
  "Product",
  "Data & AI",
  "Marketing",
  "Finance",
  "Consulting",
  "Sales",
  "Business",
  "Healthcare",
  "Education",
  "Law",
  "Media",
  "Science",
];

export default function Signup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [plan, setPlan] = useState<"free" | "premium">("premium");
  const [pay, setPay] = useState(false);
  const [done, setDone] = useState(false);
  const [payState, setPayState] = useState<"form" | "proc" | "ok">("form");
  const [loading, setLoading] = useState(false);
  const [birthday, setBirthday] = useState({ month: "", day: "", year: "" });
  const [desiredRole, setDesiredRole] = useState("");
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useAuthRequest({
      clientId:
        process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        "",
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ["profile", "email"],
      responseType: "id_token",
    });

  const step = STEPS[i];
  const toggle = (k: string) => setPicked((p) => ({ ...p, [k]: !p[k] }));
  const back = () => (i === 0 ? router.back() : setI(i - 1));

  const getInterests = () =>
    Object.keys(picked).filter((k) => INTERESTS.includes(k));
  const getWorkModes = () =>
    Object.keys(picked).filter((k) =>
      ["Remote", "Online", "Hybrid"].includes(k),
    );

  const getDateOfBirthIso = () => {
    if (!birthday.month || !birthday.day || !birthday.year) {
      return undefined;
    }

    return new Date(
      parseInt(birthday.year),
      parseInt(birthday.month) - 1,
      parseInt(birthday.day),
    ).toISOString();
  };

  const getSocialSignupOptions = () => ({
    firstName: firstName.trim() || undefined,
    lastName: lastName.trim() || undefined,
    dateOfBirth: getDateOfBirthIso(),
    interests: getInterests(),
    jobPreferences: {
      roles: desiredRole.trim() ? [desiredRole.trim()] : [],
      types: getWorkModes(),
    },
    isPremium: plan === "premium",
  });

  useEffect(() => {
    if (!googleResponse) return;

    const handleGoogleResponse = async () => {
      if (googleResponse.type !== "success") {
        setLoading(false);
        return;
      }

      try {
        const idToken =
          googleResponse.authentication?.idToken ||
          (googleResponse.params as Record<string, string> | undefined)
            ?.id_token;
        const accessToken =
          googleResponse.authentication?.accessToken ||
          (googleResponse.params as Record<string, string> | undefined)
            ?.access_token;

        if (!idToken && !accessToken) {
          throw new Error("Google did not return a usable sign-in token.");
        }

        const credential = GoogleAuthProvider.credential(
          idToken || null,
          accessToken || null,
        );
        const userCredential = await signInWithCredential(auth, credential);
        await syncOrCreateSocialUser(
          userCredential.user,
          getSocialSignupOptions(),
        );
        router.replace("/home");
      } catch (error: any) {
        console.error("Google signup error:", error);
        Alert.alert("Google Sign-Up Failed", getFirebaseErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    handleGoogleResponse();
  }, [
    googleResponse,
    birthday,
    desiredRole,
    firstName,
    lastName,
    picked,
    plan,
    router,
  ]);

  const handleNext = async () => {
    if (loading) return;

    try {
      // Step 1: Send OTP
      if (step === "email") {
        if (!/.+@.+\..+/.test(email)) {
          Alert.alert("Invalid Email", "Please enter a valid email address");
          return;
        }
        setLoading(true);
        await api.post("/v1/auth/signup/send-otp", { email });
        Alert.alert("Success", "Verification code sent to your email");
        setI(i + 1);
        return;
      }

      // Step 2: Verify OTP
      if (step === "code") {
        const enteredCode = code.join("");
        if (enteredCode.length !== 6) {
          Alert.alert("Invalid Code", "Please enter the 6-digit code");
          return;
        }
        setLoading(true);
        await api.post("/v1/auth/signup/verify-otp", {
          email,
          otp: enteredCode,
        });
        setI(i + 1);
        return;
      }

      // Step 3: Create password
      if (step === "password") {
        if (password.length < 6) {
          Alert.alert(
            "Invalid Password",
            "Password must be at least 6 characters",
          );
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert("Password Mismatch", "Passwords do not match");
          return;
        }
        setI(i + 1);
        return;
      }

      // Step 4: Name
      if (step === "name") {
        if (!firstName.trim()) {
          Alert.alert("Invalid Name", "Please enter your first name");
          return;
        }
        setI(i + 1);
        return;
      }

      // Step 5: Birthday
      if (step === "birthday") {
        // Validate birthday is filled and user is at least 16
        const { month, day, year } = birthday;
        if (!month || !day || !year) {
          Alert.alert("Invalid Birthday", "Please enter your birthday");
          return;
        }
        const birthDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 16) {
          Alert.alert("Too Young", "You must be at least 16 years old");
          return;
        }
        setI(i + 1);
        return;
      }

      // Last step: Handle plan
      if (i >= STEPS.length - 1) {
        if (plan === "premium") {
          setPayState("form");
          setPay(true);
        } else {
          await completeSignup();
        }
      } else {
        setI(i + 1);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    setLoading(true);
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await getIdToken(userCredential.user);

      // Format date of birth
      const dateOfBirth = getDateOfBirthIso();

      // Finalize on backend with all collected data
      await api.post(
        "/v1/auth/signup/finalize",
        {
          uid: userCredential.user.uid,
          email,
          firstName,
          lastName,
          dateOfBirth,
          interests: getInterests(),
          jobPreferences: {
            roles: desiredRole ? [desiredRole] : [],
            types: getWorkModes(),
          },
          isPremium: plan === "premium",
        },
        { Authorization: `Bearer ${idToken}` },
      );

      // Also update user profile in backend
      await api.put(
        "/v1/user/profile",
        {
          firstName,
          lastName,
          dateOfBirth,
          interests: getInterests(),
        },
        { Authorization: `Bearer ${idToken}` },
      );

      setDone(true);
    } catch (error: any) {
      console.error("Signup completion error:", error);
      Alert.alert("Error", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        const userCredential = await signInWithPopup(auth, provider);
        await syncOrCreateSocialUser(
          userCredential.user,
          getSocialSignupOptions(),
        );
        router.replace("/home");
        return;
      }

      if (!googleRequest) {
        throw new Error(
          "Google sign-in is not configured yet. Add the Expo Google client IDs to your environment.",
        );
      }

      const result = await promptGoogleAsync();
      if (result.type !== "success") {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Google signup error:", error);
      setLoading(false);
      Alert.alert("Google Sign-Up Failed", getFirebaseErrorMessage(error));
    }
  };

  const handleAppleSignup = async () => {
    setLoading(true);
    try {
      let providerUser;

      if (Platform.OS === "web") {
        const provider = new OAuthProvider("apple.com");
        const userCredential = await signInWithPopup(auth, provider);
        providerUser = userCredential.user;
      } else if (Platform.OS === "ios") {
        const rawNonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          rawNonce,
        );
        const appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });

        if (!appleCredential.identityToken) {
          throw new Error("Apple did not return an identity token.");
        }

        const provider = new OAuthProvider("apple.com");
        const credential = provider.credential({
          idToken: appleCredential.identityToken,
          rawNonce,
        });
        const userCredential = await signInWithCredential(auth, credential);
        providerUser = userCredential.user;
      } else {
        throw new Error(
          "Apple sign-in is only available on iOS or the web preview.",
        );
      }

      await syncOrCreateSocialUser(providerUser, getSocialSignupOptions());
      router.replace("/home");
    } catch (error: any) {
      console.error("Apple signup error:", error);
      Alert.alert("Apple Sign-Up Failed", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneTitle}>
            You're all set{firstName ? `, ${firstName.trim()}` : ""}!
          </Text>
          <Text style={styles.doneSub}>
            Your profile is ready. Let's find opportunities made for you.
          </Text>
          <Pressable style={styles.cta} onPress={() => router.replace("/home")}>
            <Text style={styles.ctaText}>Get started</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable style={styles.iconBtn} onPress={back}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              { width: `${((i + 1) / STEPS.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === "email" && (
          <Field
            title="What's your email?"
            sub="We'll use this to secure your account and send a code."
          >
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.or}>or sign up with</Text>
              <View style={styles.line} />
            </View>
            <Pressable
              style={styles.social}
              onPress={handleAppleSignup}
              disabled={loading}
            >
              <Ionicons name="logo-apple" size={18} color="#fff" />
              <Text style={styles.socialText}>Sign up with Apple</Text>
            </Pressable>
            <Pressable
              style={styles.social}
              onPress={handleGoogleSignup}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={17} color="#fff" />
              <Text style={styles.socialText}>Sign up with Google</Text>
            </Pressable>
          </Field>
        )}

        {step === "code" && (
          <Field
            title="Enter the code"
            sub={`We sent a 6-digit code to ${email || "your email"}.`}
          >
            <View style={styles.codeRow}>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <TextInput
                  key={n}
                  style={styles.codeBox}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={code[n]}
                  onChangeText={(val) => handleCodeChange(n, val)}
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </View>
          </Field>
        )}

        {step === "password" && (
          <Field
            title="Create a password"
            sub="Make sure it's at least 6 characters long."
          >
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
          </Field>
        )}

        {step === "name" && (
          <Field
            title="What's your first and last name?"
            sub="This is how you'll appear across the app."
          >
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={colors.textFaint}
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.textFaint}
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />
          </Field>
        )}

        {step === "birthday" && (
          <Field
            title="When's your birthday?"
            sub="You must be at least 16. We won't show this publicly."
          >
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="MM"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                maxLength={2}
                value={birthday.month}
                onChangeText={(t) => setBirthday((p) => ({ ...p, month: t }))}
                editable={!loading}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="DD"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                maxLength={2}
                value={birthday.day}
                onChangeText={(t) => setBirthday((p) => ({ ...p, day: t }))}
                editable={!loading}
              />
              <TextInput
                style={[styles.input, { flex: 1.4 }]}
                placeholder="YYYY"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                maxLength={4}
                value={birthday.year}
                onChangeText={(t) => setBirthday((p) => ({ ...p, year: t }))}
                editable={!loading}
              />
            </View>
          </Field>
        )}

        {step === "interests" && (
          <Field
            title="What are your career interests?"
            sub="Pick the fields you want to work in."
          >
            <View style={styles.chipWrap}>
              {INTERESTS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  on={!!picked[c]}
                  onPress={() => toggle(c)}
                />
              ))}
            </View>
          </Field>
        )}

        {step === "job" && (
          <Field
            title="Set up your work"
            sub="Tell us what you're looking for so we can match you."
          >
            <TextInput
              style={styles.input}
              placeholder="Desired role (e.g. Product Designer)"
              placeholderTextColor={colors.textFaint}
              value={desiredRole}
              onChangeText={setDesiredRole}
              editable={!loading}
            />
            <Text style={styles.glabel}>WORK MODE</Text>
            <View style={styles.chipWrap}>
              {["Remote", "Online", "Hybrid"].map((c) => (
                <Chip
                  key={c}
                  label={c}
                  on={!!picked[c]}
                  onPress={() => toggle(c)}
                />
              ))}
            </View>
          </Field>
        )}

        {step === "plan" && (
          <Field
            title="Swipe without limits"
            sub="Unlimited swipes and applications — never hit a daily cap."
          >
            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <PlanCard
                label="Premium"
                price="$8/mo"
                desc="Unlimited swipes & applications"
                on={plan === "premium"}
                badge
                onPress={() => setPlan("premium")}
              />
              <PlanCard
                label="Free"
                price="$0"
                desc="20 day one, then 5 each day"
                on={plan === "free"}
                onPress={() => setPlan("free")}
              />
            </View>
          </Field>
        )}
      </ScrollView>

      <View style={{ padding: 22, paddingBottom: insets.bottom + 14 }}>
        <Pressable style={styles.cta} onPress={handleNext} disabled={loading}>
          <Text style={styles.ctaText}>
            {loading ? "Please wait..." : CTA[step]}
          </Text>
        </Pressable>
        {step === "plan" && (
          <Text style={styles.fine}>Recurring billing. Cancel anytime.</Text>
        )}
      </View>

      {/* PAYMENT */}
      <Portal
        visible={pay}
        animationType="slide"
        onRequestClose={() => setPay(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setPay(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.grip} />
          {payState === "form" && (
            <ScrollView>
              <View style={styles.payTop}>
                <Pressable style={styles.iconBtn} onPress={() => setPay(false)}>
                  <Ionicons name="chevron-back" size={18} color="#fff" />
                </Pressable>
                <Text style={styles.sheetTitle}>Upgrade to Premium</Text>
              </View>
              <View style={styles.bd}>
                <Row k="Premium · Monthly" v="$8.00" />
                <Row k="Tax" v="$0.64" />
                <View style={styles.bdSep} />
                <Row k="Total" v="$8.64" total />
              </View>
              <Pressable
                style={styles.cta}
                onPress={async () => {
                  try {
                    setPayState("proc");
                    await completeSignup(); // Complete signup first to create user
                    const session = await api.billing.createCheckoutSession({
                      successUrl: "internsync://signup/success",
                      cancelUrl: "internsync://signup/cancel",
                    });
                    if (session.success && session.checkoutUrl) {
                      await Linking.openURL(session.checkoutUrl);
                    }
                  } catch (error: any) {
                    console.error("Checkout error:", error);
                    setPayState("form");
                    Alert.alert(
                      "Error",
                      error.message || "Failed to start checkout",
                    );
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.ctaText}>
                  {loading ? "Processing..." : "Continue to Payment"}
                </Text>
              </Pressable>
              <Text style={styles.fine}>
                🔒 Secured by Stripe · Cancel anytime
              </Text>
            </ScrollView>
          )}
          {payState === "proc" && (
            <View style={{ alignItems: "center", paddingVertical: 50 }}>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.doneSub, { marginTop: 16 }]}>
                Starting checkout...
              </Text>
            </View>
          )}
        </View>
      </Portal>
    </View>
  );
}

const Field = ({ title, sub, children }: any) => (
  <View>
    <Text style={styles.h1}>{title}</Text>
    <Text style={styles.sub}>{sub}</Text>
    <View style={{ marginTop: 24 }}>{children}</View>
  </View>
);
const Chip = ({ label, on, onPress }: any) => (
  <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
    <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
  </Pressable>
);
const PlanCard = ({ label, price, desc, on, badge, onPress }: any) => (
  <Pressable onPress={onPress} style={[styles.plan, on && styles.planOn]}>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>BEST VALUE</Text>
      </View>
    )}
    <Text style={styles.planName}>{label}</Text>
    <Text style={styles.planPrice}>{price}</Text>
    <Text style={styles.planDesc}>{desc}</Text>
  </Pressable>
);
const Row = ({ k, v, total }: any) => (
  <View style={styles.row}>
    <Text style={[styles.rowK, total && styles.rowTotal]}>{k}</Text>
    <Text style={[styles.rowV, total && styles.rowTotal]}>{v}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  barFill: { height: 4, borderRadius: 2, backgroundColor: "#fff" },
  h1: {
    color: "#fff",
    fontFamily: font.bold,
    fontSize: 25,
    letterSpacing: -0.5,
  },
  sub: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },
  input: {
    height: 54,
    minWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 13,
    color: "#fff",
    fontFamily: font.regular,
    fontSize: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeRow: { flexDirection: "row", gap: 9 },
  codeBox: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: 13,
    textAlign: "center",
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  glabel: {
    color: colors.textFaint,
    fontFamily: font.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    marginTop: 10,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipOn: { backgroundColor: "#fff", borderColor: "#fff" },
  chipText: { color: "#fff", fontFamily: font.medium, fontSize: 13 },
  chipTextOn: { color: "#111" },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ctaText: { color: "#fff", fontFamily: font.bold, fontSize: 15 },
  fine: {
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 10.5,
    textAlign: "center",
    marginTop: 12,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  or: {
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 12,
  },
  social: {
    height: 50,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  socialText: { color: "#fff", fontFamily: font.semibold, fontSize: 13.5 },
  // plan
  plan: {
    flex: 1,
    minWidth: 0,
    minHeight: 210,
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  planOn: { backgroundColor: "#232327", borderColor: colors.internship },
  badge: {
    position: "absolute",
    top: -11,
    backgroundColor: colors.internship,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 11,
  },
  badgeText: {
    color: "#fff",
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.4,
  },
  planName: { color: "#fff", fontFamily: font.bold, fontSize: 17 },
  planPrice: {
    color: "#fff",
    fontFamily: font.bold,
    fontSize: 32,
    marginTop: 6,
    letterSpacing: -1,
  },
  planDesc: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },
  // done
  doneWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 34,
  },
  doneTitle: {
    color: "#fff",
    fontFamily: font.bold,
    fontSize: 27,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  doneSub: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 28,
    lineHeight: 19,
  },
  // payment
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,6,10,0.6)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "92%",
    backgroundColor: "rgba(20,20,24,0.98)",
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
  payTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  sheetTitle: {
    color: "#fff",
    fontFamily: font.semibold,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  pm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pmOn: { borderColor: colors.borderStrong, backgroundColor: colors.surface2 },
  pmIc: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pmT: { color: "#fff", fontFamily: font.semibold, fontSize: 14 },
  pmS: {
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 11,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: "#fff" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  bd: { marginVertical: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  rowK: { color: colors.textDim, fontFamily: font.regular, fontSize: 12.5 },
  rowV: { color: "#fff", fontFamily: font.medium, fontSize: 12.5 },
  rowTotal: { color: "#fff", fontFamily: font.bold, fontSize: 15 },
  bdSep: { height: 1, backgroundColor: colors.hairline, marginVertical: 4 },
  check: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 16,
  },
});
