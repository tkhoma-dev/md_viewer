import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  resolveImageUrl,
  resolveMarkdownImageUrls,
} from '../utils/resolveMarkdownImages';
import { FullscreenImageModal } from './FullscreenImageModal';

type Props = {
  path: string | null;
  content: string | null;
  loading: boolean;
  error: string | null;
};

const markdownStyles = StyleSheet.create({
  body: {
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 26,
    fontWeight: '700',
    marginVertical: 10,
    color: '#0f172a',
  },
  heading2: {
    fontSize: 22,
    fontWeight: '600',
    marginVertical: 8,
    color: '#0f172a',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 6,
    color: '#0f172a',
  },
  code_inline: {
    backgroundColor: '#f1f5f9',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  fence: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 10,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  link: {
    color: '#0284c7',
  },
  image: {
    marginVertical: 10,
  },
});

export function MarkdownPreview({ path, content, loading, error }: Props) {
  const [fullscreenImage, setFullscreenImage] = useState<{
    uri: string;
    alt: string;
  } | null>(null);

  const resolvedContent = useMemo(
    () => (content ? resolveMarkdownImageUrls(content) : ''),
    [content],
  );

  const markdownRules = useMemo(
    () => ({
      image: (
        node: { key: string; attributes: { src?: string; alt?: string } },
        _children: unknown,
        _parent: unknown,
        styles: Record<string, object>,
      ) => {
        const src = node.attributes?.src ?? '';
        const uri = resolveImageUrl(src);
        if (!uri) {
          return null;
        }
        const alt = node.attributes?.alt ?? '';
        return (
          <Pressable
            key={node.key}
            accessibilityRole="button"
            accessibilityLabel={alt ? `View ${alt} fullscreen` : 'View image fullscreen'}
            onPress={() => setFullscreenImage({ uri, alt })}
            style={({ pressed }) => [
              thumbStyles.imageTapTarget,
              pressed && thumbStyles.imagePressed,
            ]}
          >
            <Image
              accessibilityLabel={alt || 'Image'}
              source={{ uri }}
              style={[
                styles.image,
                thumbStyles.imageThumb,
                thumbStyles.imageFixed,
              ]}
              resizeMode="contain"
            />
          </Pressable>
        );
      },
    }),
    [],
  );

  if (!path) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Select a markdown file from the tree.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.markdownWrap}>
        <Markdown style={markdownStyles} rules={markdownRules}>
          {resolvedContent}
        </Markdown>
      </View>
      <FullscreenImageModal
        visible={fullscreenImage != null}
        uri={fullscreenImage?.uri ?? null}
        alt={fullscreenImage?.alt}
        onClose={() => setFullscreenImage(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#b91c1c',
    textAlign: 'center',
  },
  markdownWrap: {
    paddingBottom: 24,
  },
});

const thumbStyles = StyleSheet.create({
  imageTapTarget: {
    alignSelf: 'stretch',
    width: '100%',
  },
  imageThumb: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  imageFixed: {
    width: '100%',
    height: 220,
  },
  imagePressed: {
    opacity: 0.85,
  },
});
