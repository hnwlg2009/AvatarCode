import React, { useEffect, useRef, useState } from 'react';

interface TerminalPanelProps {
  onCommand?: (command: string) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ onCommand }) => {
  const [output, setOutput] = useState<string[]>(['Welcome to AvatarCode Terminal']);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      const newOutput = [...output, `$ ${input}`];

      // 简单的命令处理
      let response = '';
      const cmd = input.trim().toLowerCase();

      if (cmd === 'clear' || cmd === 'cls') {
        setOutput([]);
        setInput('');
        return;
      } else if (cmd === 'help') {
        response = 'Available commands: help, clear, echo, date, version';
      } else if (cmd.startsWith('echo ')) {
        response = input.substring(5);
      } else if (cmd === 'date') {
        response = new Date().toString();
      } else if (cmd === 'version') {
        response = 'AvatarCode v0.1.0';
      } else if (cmd === 'ls' || cmd === 'dir') {
        response = 'src/  electron/  public/  package.json  vite.config.ts';
      } else {
        response = `Command not found: ${input}`;
      }

      newOutput.push(response);
      setOutput(newOutput);
      setHistory([...history, input]);
      setHistoryIndex(history.length);

      if (onCommand) {
        onCommand(input);
      }
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.max(0, historyIndex - 1);
      if (history[newIndex]) {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.min(history.length - 1, historyIndex + 1);
      if (history[newIndex]) {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, monospace',
      }}
    >
      <div
        ref={outputRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {output.map((line, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            {line}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          padding: '8px',
          borderTop: '1px solid #3e3e3e',
          backgroundColor: '#252526',
        }}
      >
        <span style={{ marginRight: '8px', color: '#4ec9b0' }}>$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#d4d4d4',
            fontFamily: 'Consolas, monospace',
            fontSize: '14px',
            outline: 'none',
          }}
          autoFocus
        />
      </form>
    </div>
  );
};

export default TerminalPanel;
