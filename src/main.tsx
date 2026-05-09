import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// 检查 Electron API
if (window.electronAPI) {
  console.log('Electron API available');
} else {
  console.log('Running in web mode (Electron API not available)');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
