import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppFontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type EditorTheme = 'app' | 'vs-dark' | 'vs-light' | 'monokai' | 'github-dark' | 'dracula';
export type Locale = 'english' | 'spanish' | 'german';

type PreferencesState = {
  locale: Locale;
  setLocale: (l: Locale) => void;

  fontSize: AppFontSize;
  setFontSize: (s: AppFontSize) => void;

  codeTheme: EditorTheme;
  setCodeTheme: (t: EditorTheme) => void;

  autoSave: boolean;
  setAutoSave: (v: boolean) => void;

  emailNotifications: boolean;
  setEmailNotifications: (v: boolean) => void;
};

const PreferencesContext = createContext<PreferencesState | undefined>(undefined);

function getLocal<T>(key: string, fallback: T, validator?: (v: any) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validator && !validator(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocal<Locale>('pref:locale:v2', 'english', (v): v is Locale => v==='english'||v==='spanish'||v==='german'));
  const [fontSize, setFontSizeState] = useState<AppFontSize>(() => getLocal<AppFontSize>('pref:fontSize', 'medium', (v): v is AppFontSize => ['small','medium','large','extra-large'].includes(v)));
  const [codeTheme, setCodeThemeState] = useState<EditorTheme>(() => getLocal<EditorTheme>('pref:codeTheme', 'vs-dark', (v): v is EditorTheme => ['app','vs-dark','vs-light','monokai','github-dark','dracula'].includes(v)));
  const [autoSave, setAutoSaveState] = useState<boolean>(() => getLocal<boolean>('pref:autoSave', true, (v): v is boolean => typeof v==='boolean'));
  const [emailNotifications, setEmailNotificationsState] = useState<boolean>(() => getLocal<boolean>('pref:emailNotifications', true, (v): v is boolean => typeof v==='boolean'));

  // Persist
  useEffect(() => { setLocal('pref:locale:v2', locale); }, [locale]);
  useEffect(() => { setLocal('pref:fontSize', fontSize); }, [fontSize]);
  useEffect(() => { setLocal('pref:codeTheme', codeTheme); }, [codeTheme]);
  useEffect(() => { setLocal('pref:autoSave', autoSave); }, [autoSave]);
  useEffect(() => { setLocal('pref:emailNotifications', emailNotifications); }, [emailNotifications]);

  // Apply global font size class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const classes: Record<AppFontSize, string> = {
      small: 'font-small',
      medium: 'font-medium',
      large: 'font-large',
      'extra-large': 'font-xl',
    };
    const all = Object.values(classes);
    root.classList.remove(...all);
    root.classList.add(classes[fontSize]);
  }, [fontSize]);

  const value = useMemo<PreferencesState>(() => ({
    locale,
    setLocale: setLocaleState,
    fontSize,
    setFontSize: setFontSizeState,
    codeTheme,
    setCodeTheme: setCodeThemeState,
    autoSave,
    setAutoSave: setAutoSaveState,
    emailNotifications,
    setEmailNotifications: setEmailNotificationsState,
  }), [locale, fontSize, codeTheme, autoSave, emailNotifications]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
