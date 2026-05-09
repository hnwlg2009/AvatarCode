// Monaco Editor 类型声明
import * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco: typeof monaco;
  }
}

export {};
