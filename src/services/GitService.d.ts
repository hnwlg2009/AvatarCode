export interface GitStatus {
    files: Array<{
        path: string;
        status: 'modified' | 'added' | 'deleted' | 'untracked';
    }>;
    branch: string;
    ahead: number;
    behind: number;
}
export interface GitCommit {
    oid: string;
    message: string;
    author: string;
    date: string;
}
export interface GitBranch {
    name: string;
    current: boolean;
}
export declare class GitService {
    private dir;
    constructor(dir: string);
    isGitRepo(): Promise<boolean>;
    getStatus(): Promise<GitStatus>;
    getCurrentBranch(): Promise<string>;
    getBranches(): Promise<GitBranch[]>;
    getLog(count?: number): Promise<GitCommit[]>;
    add(files: string | string[]): Promise<void>;
    remove(files: string | string[]): Promise<void>;
    commit(message: string, author?: {
        name: string;
        email: string;
    }): Promise<string>;
    createBranch(name: string): Promise<void>;
    checkout(branch: string): Promise<void>;
    diff(filepath: string): Promise<string>;
}
export default GitService;
//# sourceMappingURL=GitService.d.ts.map