import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabBar } from '../../src/components/common/TabBar';

describe('TabBar', () => {
  const mockTabs = [
    {
      id: 'tab1',
      path: '/file1.ts',
      name: 'file1.ts',
      language: 'typescript',
      content: '',
      isDirty: false,
      isLoading: false,
      config: { theme: 'vs-dark' } as const,
    },
    {
      id: 'tab2',
      path: '/file2.py',
      name: 'file2.py',
      language: 'python',
      content: '',
      isDirty: true,
      isLoading: false,
      config: { theme: 'vs-dark' } as const,
    },
  ];

  it('should render tabs', () => {
    render(
      <TabBar
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={vi.fn()}
        onTabClose={vi.fn()}
      />
    );

    expect(screen.getByText('file1.ts')).toBeInTheDocument();
    expect(screen.getByText('file2.py')).toBeInTheDocument();
  });

  it('should call onTabClick when tab is clicked', () => {
    const onTabClick = vi.fn();
    
    render(
      <TabBar
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={onTabClick}
        onTabClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('file2.py'));
    expect(onTabClick).toHaveBeenCalledWith('tab2');
  });

  it('should call onTabClose when close button is clicked', () => {
    const onTabClose = vi.fn();
    
    render(
      <TabBar
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={vi.fn()}
        onTabClose={onTabClose}
      />
    );

    // Find close button for tab1
    const closeButtons = screen.getAllByTitle('Close');
    fireEvent.click(closeButtons[0]);
    
    expect(onTabClose).toHaveBeenCalledWith('tab1');
  });

  it('should show active state', () => {
    render(
      <TabBar
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={vi.fn()}
        onTabClose={vi.fn()}
      />
    );

    expect(screen.getByText('file1.ts').closest('[data-active="true"]')).not.toBeNull();
    expect(screen.getByText('file2.py').closest('[data-active="false"]')).not.toBeNull();
  });

  it('should show dirty indicator', () => {
    render(
      <TabBar
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={vi.fn()}
        onTabClose={vi.fn()}
      />
    );

    expect(screen.getByText('file2.py').closest('[data-dirty="true"]')).not.toBeNull();
    expect(screen.getByText('•')).toBeInTheDocument();
  });

  it('should not show dirty indicator when file is saved', () => {
    const cleanTabs = [
      {
        ...mockTabs[0],
        isDirty: false,
      },
      {
        ...mockTabs[1],
        isDirty: false,
      },
    ];

    render(
      <TabBar
        tabs={cleanTabs}
        activeTabId="tab1"
        onTabClick={vi.fn()}
        onTabClose={vi.fn()}
      />
    );

    // Should not have dirty indicators
    const dirtyIndicators = screen.queryAllByText('•');
    expect(dirtyIndicators).toHaveLength(0);
  });

  it('should handle empty tabs', () => {
    render(
      <TabBar
        tabs={[]}
        activeTabId={null}
        onTabClick={vi.fn()}
        onTabClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
