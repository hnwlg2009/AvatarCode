import { useEffect } from 'react';
import useSettingsStore from '../stores/settingsStore';

export function useEditorTheme() {
  const { settings, setAppearanceSettings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.appearance.theme;
    
    const getEffectiveTheme = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };

    const isDark = getEffectiveTheme() === 'dark';
    
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const newIsDark = mediaQuery.matches;
        root.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.appearance.theme]);

  return {
    theme: settings.appearance.theme,
    setTheme: (newTheme: 'light' | 'dark' | 'system') => {
      setAppearanceSettings({ theme: newTheme });
    },
    fontSize: settings.editor.fontSize,
    fontFamily: settings.editor.fontFamily,
    tabSize: settings.editor.tabSize,
  };
}

export default useEditorTheme;
