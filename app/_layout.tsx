import 'react-native-gesture-handler';
import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 700;

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const content = (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  );

  // On web, frame the app at phone size so it previews like a device.
  if (isWeb) {
    const frameH = Math.min(height - 24, 900);
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 412,
            height: frameH,
            backgroundColor: colors.bg,
            borderRadius: 40,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            // @ts-ignore web-only shadow
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          }}
        >
          {content}
        </View>
      </GestureHandlerRootView>
    );
  }

  // On tablets / large screens, keep the phone-first UI centered at a sane width.
  if (isTablet) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000', alignItems: 'center' }}>
        <View style={{ flex: 1, width: 480, maxWidth: '100%', backgroundColor: colors.bg }}>{content}</View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      {content}
    </GestureHandlerRootView>
  );
}
