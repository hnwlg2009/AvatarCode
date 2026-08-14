/** @type {any} */
export class FileService {
  /**
   * 获取文件语言 (基于扩展名)
   */
  static getLanguageFromExtension(extension: string): string {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.sh': 'shell',
      '.bash': 'shell',
      '.zsh': 'shell',
      '.fish': 'shell',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.json': 'json',
      '.xml': 'xml',
      '.html': 'html',
      '.htm': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.md': 'markdown',
      '.markdown': 'markdown',
      '.sql': 'sql',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.toml': 'toml',
      '.ini': 'ini',
      '.properties': 'properties',
      '.graphql': 'graphql',
      '.prisma': 'prisma',
      '.dockerfile': 'dockerfile',
      '.makefile': 'makefile',
      '.r': 'r',
      '.R': 'r',
      '.jl': 'julia',
      '.lua': 'lua',
      '.perl': 'perl',
      '.pl': 'perl',
      '.hs': 'haskell',
      '.ex': 'elixir',
      '.exs': 'elixir',
      '.erl': 'erlang',
      '.clj': 'clojure',
      '.dart': 'dart',
      '.fs': 'fsharp',
      '.fsx': 'fsharp',
      '.vb': 'vb',
      '.rmd': 'rmd',
      '.ipynb': 'jupyter',
      '.proto': 'proto',
      '.thrift': 'thrift',
      '.avsc': 'avro',
      '.pb': 'protobuf',
      '.abap': 'abap',
      '.apex': 'apex',
      '.cls': 'apex',
      '.coffee': 'coffeescript',
      '.m': 'objective-c',
      '.mm': 'objective-cpp',
      '.solidity': 'solidity',
      '.sol': 'solidity',
      '.vy': 'vyper',
      '.tf': 'terraform',
      '.hcl': 'hcl',
      '.ps1': 'powershell',
      '.bat': 'bat',
      '.cmd': 'bat',
      '.log': 'log',
      '.txt': 'plaintext',
    };

    const ext = extension.toLowerCase();
    return languageMap[ext] || 'plaintext';
  }

  /**
   * 从文件路径获取语言
   */
  static getLanguageFromPath(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    return this.getLanguageFromExtension(ext);
  }

  /**
   * 检查文件是否为大文件 (>1MB)
   */
  static isLargeFile(sizeInBytes: number): boolean {
    return sizeInBytes >= 1024 * 1024; // 1MB
  }

  /**
   * 获取文件统计信息
   */
  static getFileStats(content: string): {
    lines: number;
    characters: number;
    words: number;
  } {
    const lines = content.split('\n').length;
    const characters = content.length;
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;

    return { lines, characters, words };
  }
}
