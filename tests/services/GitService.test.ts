import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock isomorphic-git 和 fs
const mockFs = {
  existsSync: vi.fn().mockReturnValue(true),
};

const mockIsomorphicGit = {
  resolveRef: vi.fn().mockResolvedValue('abc123'),
  statusMatrix: vi.fn().mockResolvedValue([
    ['src/test.ts', 1, 2, 1],
    ['src/app.ts', 1, 0, 1],
    ['new.ts', 0, 2, 0],
  ]),
  currentBranch: vi.fn().mockResolvedValue('main'),
  listBranches: vi.fn().mockResolvedValue(['main', 'develop']),
  log: vi.fn().mockResolvedValue([
    {
      commit: {
        oid: 'abc123',
        message: 'Initial commit',
        author: { name: 'Test User', timestamp: 1714896000 },
      },
    },
  ]),
  add: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue('def456'),
  branch: vi.fn().mockResolvedValue(undefined),
  checkout: vi.fn().mockResolvedValue(undefined),
  diffIndex: vi.fn().mockResolvedValue([{ text: () => '+test' }]),
};

vi.mock('isomorphic-git', () => ({
  default: mockIsomorphicGit,
  resolveRef: mockIsomorphicGit.resolveRef,
  statusMatrix: mockIsomorphicGit.statusMatrix,
  currentBranch: mockIsomorphicGit.currentBranch,
  listBranches: mockIsomorphicGit.listBranches,
  log: mockIsomorphicGit.log,
  add: mockIsomorphicGit.add,
  remove: mockIsomorphicGit.remove,
  commit: mockIsomorphicGit.commit,
  branch: mockIsomorphicGit.branch,
  checkout: mockIsomorphicGit.checkout,
  diffIndex: mockIsomorphicGit.diffIndex,
}));

vi.mock('fs', () => ({
  default: mockFs,
  existsSync: mockFs.existsSync,
}));

import { GitService } from '../../src/services/GitService';

describe('GitService', () => {
  let gitService: GitService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    gitService = new GitService('/test/repo');
  });
  
  describe.only('isGitRepo', () => {
    it('should return true if directory is a git repo', async () => {
      const result = await gitService.isGitRepo();
      expect(result).toBe(true);
      expect(mockIsomorphicGit.resolveRef).toHaveBeenCalled();
    });
  });
  
  describe('getStatus', () => {
    it('should return git status with modified files', async () => {
      const status = await gitService.getStatus();
      
      expect(status.files.length).toBeGreaterThan(0);
      expect(status.branch).toBe('main');
    });
  });
  
  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('main');
    });
    
    it('should return HEAD if not in a branch', async () => {
      mockIsomorphicGit.currentBranch.mockRejectedValueOnce(new Error('detached'));
      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('HEAD');
    });
  });
  
  describe('getBranches', () => {
    it('should return list of branches', async () => {
      const branches = await gitService.getBranches();
      
      expect(branches.length).toBe(2);
      expect(branches.find(b => b.name === 'main')?.current).toBe(true);
    });
  });
  
  describe('getLog', () => {
    it('should return commit history', async () => {
      const commits = await gitService.getLog(10);
      
      expect(commits.length).toBe(1);
      expect(commits[0].message).toBe('Initial commit');
      expect(commits[0].author).toBe('Test User');
    });
  });
  
  describe('commit', () => {
    it('should commit changes', async () => {
      const oid = await gitService.commit('Test commit');
      expect(oid).toBe('def456');
      expect(mockIsomorphicGit.commit).toHaveBeenCalled();
    });
  });
});
