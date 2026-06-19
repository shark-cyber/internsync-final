import React from 'react';
import { Modal, Platform, View } from 'react-native';

// Cross-platform overlay host.
// Native: a real Modal (full device). Web: an absolutely-positioned layer
// INSIDE the current screen, so it stays within the phone frame instead of
// covering the whole browser window.
export function Portal({
  visible,
  onRequestClose,
  animationType = 'slide',
  children,
}: {
  visible: boolean;
  onRequestClose?: () => void;
  animationType?: 'slide' | 'fade' | 'none';
  children: React.ReactNode;
}) {
  if (!visible) return null;
  if (Platform.OS === 'web') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
        {children}
      </View>
    );
  }
  return (
    <Modal visible transparent statusBarTranslucent animationType={animationType} onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}
