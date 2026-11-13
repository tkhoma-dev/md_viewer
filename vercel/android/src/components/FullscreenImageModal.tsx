import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  uri: string | null;
  alt?: string;
  onClose: () => void;
};

export function FullscreenImageModal({ visible, uri, alt, onClose }: Props) {
  if (!uri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onClose}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.imageWrap}>
          <Image
            accessibilityLabel={alt || 'Image fullscreen'}
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    color: '#e0f2fe',
    fontSize: 17,
    fontWeight: '600',
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
