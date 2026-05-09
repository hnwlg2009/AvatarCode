import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileTree, IFileNode } from '../../src/components/common/FileTree';

describe('FileTree', () => {
  const mockFiles: IFileNode[] = [
    {
      name: 'src',
      path: '/project/src',
      isDirectory: true,
      children: [
        {
          name: 'index.ts',
          path: '/project/src/index.ts',
          isDirectory: false,
        },
        {
          name: 'App.tsx',
          path: '/project/src/App.tsx',
          isDirectory: false,
        },
      ],
    },
    {
      name: 'package.json',
      path: '/project/package.json',
      isDirectory: false,
    },
  ];

  it('should render file tree', () => {
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={vi.fn()}
      />
    );

    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
  });

  it('should call onFileSelect when file is clicked', () => {
    const onFileSelect = vi.fn();
    
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={onFileSelect}
      />
    );

    fireEvent.click(screen.getByText('package.json'));
    expect(onFileSelect).toHaveBeenCalledWith('/project/package.json');
  });

  it('should toggle directory when clicked', () => {
    const onFileSelect = vi.fn();
    
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={onFileSelect}
      />
    );

    expect(screen.queryByText('index.ts')).not.toBeInTheDocument();

    // Click to expand directory
    fireEvent.click(screen.getByText('src'));
    expect(screen.getByText('index.ts')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('src'));
    expect(screen.queryByText('index.ts')).not.toBeInTheDocument();
  });

  it('should handle context menu', () => {
    const onContextMenu = vi.fn();
    
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={vi.fn()}
        onContextMenu={onContextMenu}
      />
    );

    fireEvent.contextMenu(screen.getByText('package.json'));
    expect(onContextMenu).toHaveBeenCalledWith('/project/package.json', false);

    fireEvent.contextMenu(screen.getByText('src'));
    expect(onContextMenu).toHaveBeenCalledWith('/project/src', true);
  });

  it('should handle custom className', () => {
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={vi.fn()}
        className="custom-class"
      />
    );

    const tree = screen.getByText('src').closest('.fileTree');
    expect(tree).toHaveClass('custom-class');
  });

  it('should handle empty files', () => {
    render(
      <FileTree
        files={[]}
        onFileSelect={vi.fn()}
      />
    );

    expect(screen.getByText('No files')).toBeInTheDocument();
  });

  it('should indent nested files correctly', () => {
    const deepFiles: IFileNode[] = [
      {
        name: 'level1',
        path: '/l1',
        isDirectory: true,
        children: [
          {
            name: 'level2',
            path: '/l1/l2',
            isDirectory: true,
            children: [
              {
                name: 'file.ts',
                path: '/l1/l2/file.ts',
                isDirectory: false,
              },
            ],
          },
        ],
      },
    ];

    render(
      <FileTree
        files={deepFiles}
        onFileSelect={vi.fn()}
      />
    );

    // Expand directories
    fireEvent.click(screen.getByText('level1'));
    fireEvent.click(screen.getByText('level2'));

    const fileElement = screen.getByText('file.ts');
    const content = fileElement.closest('.nodeContent');
    expect(content).toHaveStyle('padding-left: 32px'); // 16 * depth + 8
  });
});
