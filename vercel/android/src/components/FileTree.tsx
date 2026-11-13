import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TreeNode } from '../types';
import { isFileNode } from '../types';

const FOLDER_MARKER = '_folder.md';

type Props = {
  tree: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
};

function FileTreeNode({
  node,
  depth,
  selectedPath,
  onSelectFile,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const pad = 8 + depth * 14;

  if (isFileNode(node)) {
    if (node.name === FOLDER_MARKER) {
      return null;
    }
    const active = node.path === selectedPath;
    return (
      <Pressable
        onPress={() => onSelectFile(node.path)}
        style={[styles.row, { paddingLeft: pad }, active && styles.rowActive]}
      >
        <Text style={styles.fileIcon}>📄</Text>
        <Text
          style={[styles.label, active && styles.labelActive]}
          numberOfLines={2}
        >
          {node.name}
        </Text>
      </Pressable>
    );
  }

  const visibleChildren = node.children.filter(
    ch => !isFileNode(ch) || ch.name !== FOLDER_MARKER,
  );
  return (
    <View>
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={[styles.row, styles.folderRow, { paddingLeft: pad }]}
      >
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
        <Text style={styles.folderIcon}>📁</Text>
        <Text style={[styles.label, styles.folderLabel]} numberOfLines={2}>
          {node.name}
        </Text>
      </Pressable>
      {open &&
        visibleChildren.map(child => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        ))}
    </View>
  );
}

export function FileTree({ tree, selectedPath, onSelectFile }: Props) {
  const render = useCallback(
    () =>
      tree.map(node => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      )),
    [tree, selectedPath, onSelectFile],
  );

  if (!tree.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No markdown files in storage.</Text>
      </View>
    );
  }

  return <View style={styles.root}>{render()}</View>;
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingRight: 8,
    borderRadius: 8,
  },
  rowActive: {
    backgroundColor: '#e0f2fe',
  },
  folderRow: {
    backgroundColor: 'transparent',
  },
  chevron: {
    width: 14,
    fontSize: 12,
    color: '#64748b',
  },
  fileIcon: {
    fontSize: 14,
  },
  folderIcon: {
    fontSize: 14,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },
  labelActive: {
    color: '#0c4a6e',
    fontWeight: '600',
  },
  folderLabel: {
    fontWeight: '600',
    color: '#475569',
  },
  empty: {
    padding: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});
