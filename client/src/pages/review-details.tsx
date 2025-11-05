import { useEffect, useMemo, useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiffEditor, BeforeMount } from '@monaco-editor/react';
import { useTheme } from '@/components/theme-provider';

export default function ReviewDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/reviews/:id');
  const id = params?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<any | null>(null);
  const { theme } = useTheme();
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews/${id}`);
        if (!res.ok) throw new Error(`Failed to load review ${id}`);
        const data = await res.json();
        if (mounted) setReview(data);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const langId = useMemo(() => {
    const l = (review?.language || '').toLowerCase();
    if (l.includes('ts')) return 'typescript';
    return 'javascript';
  }, [review?.language]);

  const currentThemeName = theme === 'dark' ? 'app-dark' : 'app-light';

  function defineAppTheme(monaco: any) {
    function readVar(name: string): string | null {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      return v ? v.trim() : null;
    }
    function hslVarToHex(varName: string, fallback: string): string {
      const raw = readVar(varName);
      if (!raw) return fallback;
      const [hslPart, alphaPart] = raw.split('/').map((s) => s.trim());
      const parts = hslPart.split(/[\s]+/);
      if (parts.length < 3) return fallback;
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1].replace('%', ''));
      const l = parseFloat(parts[2].replace('%', ''));
      const a = alphaPart ? Math.max(0, Math.min(1, parseFloat(alphaPart))) : 1;
      const rgb = hslToRgb(h, s / 100, l / 100);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (a < 1) {
        const aHex = Math.round(a * 255)
          .toString(16)
          .padStart(2, '0');
        return `${hex}${aHex}`;
      }
      return hex;
    }
    function hslToRgb(h: number, s: number, l: number) {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;
      let r = 0,
        g = 0,
        b = 0;
      if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }
      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
      };
    }
    function rgbToHex(r: number, g: number, b: number) {
      return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
    }

    const bg = theme === 'dark' ? '#0f1729' : '#FFFFFF';
    // Foreground and accents fall back per mode (use CSS vars when available)
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

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineAppTheme(monaco);
  };

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    defineAppTheme(monaco);
    monaco.editor.setTheme(currentThemeName);
  }, [theme]);

  if (!match) return null;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Review #{id}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{review?.language ?? '-'}</Badge>
          {review?.model && <code className="px-2 py-1 rounded bg-muted">{review.model}</code>}
          {typeof review?.tokens === 'number' && <span>Tokens: {review.tokens}</span>}
          {typeof review?.cost === 'number' && <span>Cost: ${Number(review.cost).toFixed(4)}</span>}
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {review?.reviewText ? (
            <p className="whitespace-pre-wrap leading-6 text-sm">{review.reviewText}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No summary provided.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.isArray(review?.issues) && review.issues.length > 0 ? (
            review.issues.map((iss: any) => (
              <div key={iss.id} className="border-l-4 pl-4 py-2">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <Badge
                    variant={
                      iss.severity === 'error'
                        ? 'destructive'
                        : iss.severity === 'warning'
                          ? 'outline'
                          : 'secondary'
                    }
                  >
                    {iss.severity || 'info'}
                  </Badge>
                  <span>{iss.message}</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}
                </p>
                {Array.isArray(iss.suggestions) && iss.suggestions.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                    {iss.suggestions.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No issues recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Code Diff</CardTitle>
        </CardHeader>
        <CardContent>
          {review?.code ? (
            <div className="border rounded-md overflow-hidden">
              <DiffEditor
                height="24rem"
                language={langId}
                original={review?.code || ''}
                modified={review?.fixedCode || review?.code || ''}
                options={{ readOnly: true, renderSideBySide: true }}
                theme={currentThemeName}
                beforeMount={handleBeforeMount}
              />
              <div className="p-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigator.clipboard.writeText(review?.fixedCode || review?.code || '')
                  }
                >
                  Copy Displayed Code
                </Button>
                <Button
                  variant="default"
                  onClick={() => setLocation(`/dashboard?seedReviewId=${id}`)}
                >
                  Open in Editor
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No code payload stored for this review.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
