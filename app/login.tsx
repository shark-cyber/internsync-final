import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { colors, font, radius } from "../src/theme";
import {
  auth,
  getIdToken,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
  getFirebaseErrorMessage,
} from "../src/lib/firebase";
import { api } from "../src/lib/api";
import { syncOrCreateSocialUser } from "../src/lib/socialAuth";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
  const canUseAppleAuth = Platform.OS === "ios" || Platform.OS === "web";
  const hasNativeGoogleClient =
    Platform.OS === "ios"
      ? Boolean(
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
            process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
        )
      : Platform.OS === "android"
        ? Boolean(
            process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
              process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
          )
        : true;

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
        await syncOrCreateSocialUser(userCredential.user);
        router.replace("/home");
      } catch (error: any) {
        console.error("Google login error:", error);
        Alert.alert("Google Sign-In Failed", getFirebaseErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    handleGoogleResponse();
  }, [googleResponse, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await getIdToken(userCredential.user);

      // Sync user with our backend
      await api.post(
        "/v1/user/sync",
        {},
        {
          Authorization: `Bearer ${idToken}`,
        },
      );

      // Navigate to home
      router.replace("/home");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        const userCredential = await signInWithPopup(auth, provider);
        await syncOrCreateSocialUser(userCredential.user);
        router.replace("/home");
        return;
      }

      if (!hasNativeGoogleClient) {
        throw new Error(
          "Google sign-in for the mobile app is not configured yet. Add the iOS and Android Google client IDs to Expo env variables and rebuild the app.",
        );
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
      console.error("Google login error:", error);
      setLoading(false);
      Alert.alert("Google Sign-In Failed", getFirebaseErrorMessage(error));
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      let providerUser: User;

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

      await syncOrCreateSocialUser(providerUser);
      router.replace("/home");
    } catch (error: any) {
      console.error("Apple login error:", error);
      Alert.alert("Apple Sign-In Failed", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image
        source={require("../assets/img/welcome-bg.jpg")}
        style={styles.bgImg}
        resizeMode="cover"
      />
      <BlurView
        intensity={40}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(8,8,10,0.5)", "rgba(8,8,10,0.35)", "rgba(8,8,10,0.8)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.top, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.x}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 20,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Log into{"\n"}your account</Text>

        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Username/Email"
            placeholderTextColor="rgba(255,255,255,0.75)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.75)"
            secureTextEntry={!showPw}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <Pressable
            onPress={() => setShowPw((s) => !s)}
            hitSlop={10}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPw ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="rgba(255,255,255,0.85)"
            />
          </Pressable>
        </View>

        <Pressable
          style={styles.remember}
          onPress={() => setRemember((r) => !r)}
        >
          <View style={[styles.box, remember && styles.boxOn]}>
            {remember && <Ionicons name="checkmark" size={13} color="#111" />}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>

        <Pressable
          style={styles.login}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.or}>or</Text>
          <View style={styles.line} />
        </View>

        {canUseAppleAuth && (
          <Pressable
            style={styles.social}
            onPress={handleAppleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={18} color="#fff" />
            <Text style={styles.socialText}>Continue with Apple</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.social}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={17} color="#fff" />
          <Text style={styles.socialText}>Continue with Google</Text>
        </Pressable>

        <View style={{ flex: 1 }} />
        <Text style={styles.switch}>
          Don't have an account?{" "}
          <Text style={styles.link} onPress={() => router.replace("/signup")}>
            Sign Up
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  top: { paddingHorizontal: 26 },
  x: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  title: {
    color: "#fff",
    fontFamily: font.bold,
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 36,
    marginTop: 24,
    marginBottom: 34,
  },
  field: {
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    marginBottom: 26,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: font.regular,
    fontSize: 15,
    paddingVertical: 8,
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  remember: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 24,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: "#fff", borderColor: "#fff" },
  rememberText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: font.regular,
    fontSize: 13,
  },
  login: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161616",
  },
  loginText: { color: "#fff", fontFamily: font.semibold, fontSize: 15 },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.18)" },
  or: {
    color: "rgba(255,255,255,0.5)",
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
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  socialText: { color: "#fff", fontFamily: font.semibold, fontSize: 13.5 },
  switch: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: font.regular,
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
  },
  link: { color: "#fff", fontFamily: font.semibold },
});
