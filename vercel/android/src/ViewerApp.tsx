import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMdFile, fetchMdsTree } from './api/mds';
import { FileTree } from './components/FileTree';
import { MarkdownPreview } from './components/MarkdownPreview';
import { getHttpDebugLog, clearHttpDebugLog } from './api/httpDebug';
import {
  clearResolvedApiBase,
  getApiBase,
  getApiBaseCandidates,
} from './config';
import type { TreeNode } from './types';

export function ViewerApp() {
  const { width } = useWindowDimensions();
  const splitView = width >= 720;

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [mobilePane, setMobilePane] = useState<'tree' | 'file'>('tree');
  const [showDebug, setShowDebug] = useState(false);
  const [debugTick, setDebugTick] = useState(0);

  const loadTree = useCallback(async () => {
    setTreeError(null);
    try {
      const next = await fetchMdsTree();
      setTree(next);
    } catch (e) {
      setTreeError(e instanceof Error ? e.message : String(e));
    } finally {
      setTreeLoading(false);
      setRefreshing(false);
      setDebugTick(t => t + 1);
    }
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  const onSelectFile = useCallback(
    async (path: string) => {
      setSelectedPath(path);
      setFileLoading(true);
      setFileError(null);
      setContent(null);
      if (!splitView) {
        setMobilePane('file');
      }
      try {
        const text = await fetchMdFile(path);
        setContent(text);
      } catch (e) {
        setFileError(e instanceof Error ? e.message : String(e));
      } finally {
        setFileLoading(false);
      }
    },
    [splitView],
  );

  const onRefresh = useCallback(() => {
    clearResolvedApiBase();
    clearHttpDebugLog();
    setRefreshing(true);
    void loadTree();
    if (selectedPath) {
      void onSelectFile(selectedPath);
    }
  }, [loadTree, onSelectFile, selectedPath]);

  const treePanel = (
    <ScrollView
      style={styles.treeScroll}
      contentContainerStyle={styles.treeScrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      {treeLoading && !tree.length ? (
        <ActivityIndicator style={styles.spinner} color="#0284c7" />
      ) : null}
      {treeError ? (
        <Text style={styles.errorBanner}>{treeError}</Text>
      ) : null}
      <FileTree
        tree={tree}
        selectedPath={selectedPath}
        onSelectFile={onSelectFile}
      />
    </ScrollView>
  );

  const filePanel = (
    <ScrollView
      style={styles.fileScroll}
      contentContainerStyle={styles.fileScrollContent}
    >
      {selectedPath ? (
        <Text style={styles.filePath} numberOfLines={2}>
          {selectedPath}
        </Text>
      ) : null}
      <MarkdownPreview
        path={selectedPath}
        content={content}
        loading={fileLoading}
        error={fileError}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {!splitView && mobilePane === 'file' ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setMobilePane('tree')}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>← Files</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>MD Viewer</Text>
        )}
      </View>

      {splitView ? (
        <View style={styles.split}>
          <View style={styles.treePane}>{treePanel}</View>
          <View style={styles.divider} />
          <View style={styles.filePane}>{filePanel}</View>
        </View>
      ) : mobilePane === 'tree' ? (
        <View style={styles.fill}>{treePanel}</View>
      ) : (
        <View style={styles.fill}>{filePanel}</View>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setShowDebug(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.apiFoot} numberOfLines={1}>
          API: {getApiBase()} — tap for debug
        </Text>
      </TouchableOpacity>
      {showDebug ? (
        <ScrollView style={styles.debugPanel} nestedScrollEnabled>
          <Text style={styles.debugTitle}>API debug (refresh #{debugTick})</Text>
          <Text style={styles.debugMeta}>
            Candidates:{'\n'}
            {getApiBaseCandidates().join('\n')}
          </Text>
          {getHttpDebugLog().map((row, i) => (
            <View key={`${row.at}-${i}`} style={styles.debugRow}>
              <Text style={styles.debugUrl} selectable>
                {row.status} {row.url}
              </Text>
              <Text style={styles.debugBody} selectable>
                {row.body || '(empty)'}
              </Text>
            </View>
          ))}
          {!getHttpDebugLog().length ? (
            <Text style={styles.debugMeta}>
              No requests logged yet. Pull to refresh the tree.
            </Text>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e0f2fe',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#bae6fd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  split: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  treePane: {
    width: '38%',
    maxWidth: 320,
    minWidth: 200,
    backgroundColor: '#fff',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e2e8f0',
  },
  divider: {
    width: 0,
  },
  filePane: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fill: {
    flex: 1,
    backgroundColor: '#fff',
  },
  treeScroll: {
    flex: 1,
  },
  treeScrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  fileScroll: {
    flex: 1,
  },
  fileScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  filePath: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  spinner: {
    marginVertical: 24,
  },
  errorBanner: {
    color: '#b91c1c',
    fontSize: 14,
    padding: 12,
    marginBottom: 8,
  },
  apiFoot: {
    fontSize: 10,
    color: '#64748b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  debugPanel: {
    maxHeight: 220,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  debugTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  debugMeta: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  debugRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#334155',
    paddingVertical: 6,
  },
  debugUrl: {
    color: '#7dd3fc',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  debugBody: {
    color: '#cbd5e1',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
