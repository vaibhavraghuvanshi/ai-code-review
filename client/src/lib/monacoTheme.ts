import type * as Monaco from 'monaco-editor';

export type AppTheme = 'light' | 'dark';

export const getThemeName = (theme: AppTheme) => (theme === 'dark' ? 'app-dark' : 'app-light');

function readCssVar(name: string): string | null {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v ? v.trim() : null;
}

function hslVarToHex(varName: string, fallback: string): string {
  const raw = readCssVar(varName);
  if (!raw) return fallback;
  const [hslPart, alphaPart] = raw.split("/").map((s) => s.trim());
  const parts = hslPart.split(/[\s]+/);
  if (parts.length < 3) return fallback;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));
  const a = alphaPart ? Math.max(0, Math.min(1, parseFloat(alphaPart))) : 1;
  const rgb = hslToRgb(h, s / 100, l / 100);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  if (a < 1) {
    const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
    return `${hex}${aHex}`;
  }
  return hex;
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
}

export function defineAppTheme(monaco: typeof Monaco, theme: AppTheme) {
  const currentThemeName = getThemeName(theme);
  const bg = theme === 'dark' ? '#0f1729' : '#FFFFFF';
  const fg = hslVarToHex('--foreground', theme === 'dark' ? '#d4d4d4' : '#1e1e1e');
  const mutedFg = hslVarToHex('--muted-foreground', theme === 'dark' ? '#9aa0a6' : '#6b7280');
  const border = hslVarToHex('--border', theme === 'dark' ? '#2a2a2a' : '#e5e7eb');
  const primary = hslVarToHex('--primary', '#7c3aed');
  const selection = theme === 'dark' ? '#7c3aed55' : '#3b82f633';

  const commonColors = {
    'editor.foreground': fg,
    'editorLineNumber.foreground': mutedFg,
    'editorLineNumber.activeForeground': fg,
    'editorCursor.foreground': primary,
    'editor.selectionBackground': selection,
    'editor.inactiveSelectionBackground': selection,
    'editorIndentGuide.background': border,
    'editorIndentGuide.activeBackground': mutedFg,
    'editorBracketMatch.background': selection,
    'editorBracketMatch.border': border,
    'editorGutter.background': bg,
    'scrollbarSlider.background': `${border}aa`,
    'scrollbarSlider.hoverBackground': `${border}cc`,
    'scrollbarSlider.activeBackground': `${border}ff`,
  } as const;

  monaco.editor.defineTheme(currentThemeName, {
    base: theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: { 'editor.background': bg, ...commonColors },
  });
}

export function applyAppTheme(monaco: typeof Monaco, theme: AppTheme) {
  const name = getThemeName(theme);
  defineAppTheme(monaco, theme);
  monaco.editor.setTheme(name);
}