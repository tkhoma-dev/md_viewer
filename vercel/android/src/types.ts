export type TreeNode =
  | {
      type: 'dir';
      name: string;
      path: string;
      children: TreeNode[];
    }
  | {
      type: 'file';
      name: string;
      path: string;
    };

export function isFileNode(
  node: TreeNode,
): node is Extract<TreeNode, { type: 'file' }> {
  return node.type === 'file';
}
