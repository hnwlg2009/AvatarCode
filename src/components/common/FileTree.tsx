import React, { useState, useCallback } from 'react';
import styles from './FileTree.module.css';

export interface IFileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: IFileNode[];
  isOpen?: boolean;
}

interface FileTreeProps {
  files?: IFileNode[];
  onFileSelect: (path: string) => void;
  onContextMenu?: (path: string, isDirectory: boolean) => void;
  className?: string;
  rootPath?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files = [],
  onFileSelect,
  onContextMenu,
  className = '',
  rootPath = '/workspace',
}) => {
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());

  const toggleDir = useCallback((path: string) => {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback(
    (node: IFileNode) => {
      if (node.isDirectory) {
        toggleDir(node.path);
      } else {
        onFileSelect(node.path);
      }
    },
    [toggleDir, onFileSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: IFileNode) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.(node.path, node.isDirectory);
    },
    [onContextMenu]
  );

  const renderNode = useCallback(
    (node: IFileNode, depth: number = 0) => {
      const isOpen = node.isDirectory && openDirs.has(node.path);

      return (
        <div key={node.path} className={styles.node}>
          <div
            className={`${styles.nodeContent} ${node.isDirectory ? styles.directory : styles.file}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            <span className={styles.icon}>
              {node.isDirectory ? (
                isOpen ? (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path fill="currentColor" d="M4 4h8l2 4-2 4H4L2 8z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path fill="currentColor" d="M6 4l4 2-4 2-2-4z" />
                  </svg>
                )
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path fill="currentColor" d="M8 1l6 7-6 7L2 8z" />
                </svg>
              )}
            </span>
            <span className={styles.name}>{node.name}</span>
          </div>
          {node.isDirectory && isOpen && node.children && (
            <div className={styles.children}>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [openDirs, handleNodeClick, handleContextMenu]
  );

  return (
    <div className={`${styles.fileTree} ${className}`}>
      {files.length === 0 ? (
        <div className={styles.empty}>No files</div>
      ) : (
        files.map((file) => renderNode(file))
      )}
    </div>
  );
};

export default FileTree;
