import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount, BeforeMount, DiffEditor } from '@monaco-editor/react';
import { useTheme } from './theme-provider';
import { Upload, Sparkles, Lightbulb, PanelRight } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';

const languages = [
  { value: 'javascript', label: 'JavaScript (.js)' },
  { value: 'react-jsx', label: 'React (.jsx)' },
  { value: 'typescript', label: 'TypeScript (.ts)' },
  { value: 'react-tsx', label: 'React TS (.tsx)' },
  { value: 'react-native-jsx', label: 'React Native (.jsx)' },
  { value: 'react-native-tsx', label: 'React Native TS (.tsx)' },
];

export function CodeEditor() {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [pathExt, setPathExt] = useState<'.js' | '.jsx' | '.ts' | '.tsx'>('.js');
  const [code, setCode] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [fixedCode, setFixedCode] = useState('');
  const [issues, setIssues] = useState<
    Array<{
      id: string;
      message: string;
      severity: 'error' | 'warning' | 'info' | 'security';
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
      suggestions?: string[];
      edits?: Array<{
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
        newText: string;
      }>;
    }>
  >([]);
  const decorationIdsRef = useRef<string[]>([]);
  const ghostDecoIdsRef = useRef<string[]>([]);
  const issuesRef = useRef<typeof issues>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiMeta, setAiMeta] = useState<{
    model?: string;
    tokens?: number;
    cost?: number;
    temperature?: number;
  }>({});
  const [openSummary, setOpenSummary] = useState(false);
  const codeActionDisposables = useRef<any[]>([]);

  // const handleReview = async () => {
  //   if (!code.trim()) return;
  //   try {
  //     setIsReviewing(true);
  //     setHasReview(false);
  //     setActiveTab("suggestions");

  //     const res = await fetch("/api/ai/review", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ code, language: selectedLanguage }),
  //     });
  const handleReview = async () => {
    if (!code.trim()) return;
    try {
      setIsReviewing(true);
      setHasReview(false);
      setActiveTab('suggestions');

      // Read current userId (if signed in)
      let userId: string | undefined;
      try {
        const raw = localStorage.getItem('currentUser');
        const u = raw ? JSON.parse(raw) : null;
        if (u?.id && typeof u.id === 'string') userId = u.id;
      } catch {}

      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          // send userId so server inserts reviews.user_id
          ...(userId ? { userId } : {}),
        }),
      });
      if (!res.ok) {
        // Try to surface structured error details from the server
        let errMsg = `AI review failed (${res.status})`;
        try {
          const ej = await res.json();
          if (ej?.error) {
            errMsg = String(ej.error);
            if (Array.isArray(ej.attemptedModels) && ej.attemptedModels.length) {
              errMsg += ` | models tried: ${ej.attemptedModels.join(', ')}`;
            }
          } else {
            const t = await res.text().catch(() => '');
            if (t) errMsg = t;
          }
        } catch {
          const t = await res.text().catch(() => '');
          if (t) errMsg = t;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      const aiIssues = Array.isArray(data.issues) ? data.issues : [];
      setIssues(aiIssues);
      issuesRef.current = aiIssues;
      setFixedCode(typeof data.fixedCode === 'string' ? data.fixedCode : code);
      setAiSummary(typeof data.summary === 'string' ? data.summary : '');
      setAiMeta({
        model: data.model,
        tokens: data.tokens,
        cost: data.cost,
        temperature: data.temperature,
      });
      setHasReview(true);

      // Apply markers and decorations
      applyAiAnnotations(aiIssues);
      applyGhostSuggestions(aiIssues);

      toast({ title: 'AI review complete', description: `${aiIssues.length} issue(s) reported.` });
    } catch (e) {
      console.error(e);
      toast({
        title: 'AI review failed',
        description: e instanceof Error ? e.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const monacoLanguage = useMemo(() => {
    if (pathExt === '.ts' || pathExt === '.tsx') return 'typescript';
    return 'javascript';
  }, [pathExt]);

  const editorPath = useMemo(() => {
    return `file:///App${pathExt}`;
  }, [pathExt]);

  const { theme } = useTheme();
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const currentThemeName = theme === 'dark' ? 'app-dark' : 'app-light';

  function defineAppTheme(monaco: any) {
    // Define app-themed Monaco theme using CSS vars for the ACTIVE theme
    function readVar(name: string): string | null {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      return v ? v.trim() : null;
    }
    function hslVarToHex(varName: string, fallback: string): string {
      const raw = readVar(varName);
      if (!raw) return fallback;
      // raw like: "240 5.3% 26.1%" or "240 5.3% 26.1% / 0.5"
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
      return `#${[r, g, b]
        .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
        .join('')}`;
    }

    // Strict background per mode
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
      colors: {
        'editor.background': bg,
        ...commonColors,
      },
    });
    // Enable JSX suggestions and sensible targets
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      allowJs: true,
      checkJs: false,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
    });
  }

  const extraLibsAddedRef = useRef(false);

  const handleEditorBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineAppTheme(monaco);
    if (!extraLibsAddedRef.current) {
      const jsxTypes = [
        'declare namespace JSX {',
        '  interface IntrinsicElements { [elemName: string]: any }',
        '  interface ElementAttributesProperty { props: any }',
        '  interface ElementChildrenAttribute { children: any }',
        '  type Element = any;',
        '}',
      ].join('\n');
      const reactStub = [
        "declare module 'react' {",
        '  export const useState: any; export const useEffect: any; export const useMemo: any; export const useRef: any;',
        '  export const Fragment: any;',
        '  const React: any; export default React;',
        '}',
        "declare module 'react/jsx-runtime' { export const jsx: any; export const jsxs: any; export const Fragment: any; }",
      ].join('\n');
      const rnStub = [
        "declare module 'react-native' {",
        '  export const View: any; export const Text: any; export const StyleSheet: any; export const Button: any;',
        '  const RN: any; export default RN;',
        '}',
      ].join('\n');
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        jsxTypes,
        'file:///types/jsx.d.ts',
      );
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        jsxTypes,
        'file:///types/jsx-js.d.ts',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        reactStub,
        'file:///types/react.d.ts',
      );
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        reactStub,
        'file:///types/react-js.d.ts',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        rnStub,
        'file:///types/react-native.d.ts',
      );
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        rnStub,
        'file:///types/react-native-js.d.ts',
      );
      extraLibsAddedRef.current = true;
    }
  };

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Enable glyph margin for potential future margin decorations
    editor.updateOptions({ glyphMargin: true });
  };

  const monacoTheme = currentThemeName;

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    // Re-define theme with current CSS vars on theme change and apply it
    defineAppTheme(monaco);
    monaco.editor.setTheme(currentThemeName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Re-apply annotations when code changes to keep ranges valid only if we still have same content length.
  useEffect(() => {
    // Clear markers and decorations when code changes to avoid stale positions
    clearAiAnnotations();
    clearGhostSuggestions();
  }, [code, selectedLanguage]);

  function clearAiAnnotations() {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel();
    if (!model) return;
    monaco.editor.setModelMarkers(model, 'ai', []);
    if (decorationIdsRef.current.length) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
    }
  }

  function clearGhostSuggestions() {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    if (ghostDecoIdsRef.current.length) {
      ghostDecoIdsRef.current = editor.deltaDecorations(ghostDecoIdsRef.current, []);
    }
  }

  function applyAiAnnotations(aiIssues: any[]) {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel();
    if (!model) return;

    // Markers (squiggles + hover)
    const markers = aiIssues.map((i) => ({
      startLineNumber: Math.max(1, Number(i.startLine || 1)),
      startColumn: Math.max(1, Number(i.startColumn || 1)),
      endLineNumber: Math.max(1, Number(i.endLine || i.startLine || 1)),
      endColumn: Math.max(1, Number(i.endColumn || i.startColumn || 1)),
      message: String(i.message || 'AI feedback'),
      severity:
        i.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : i.severity === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
      source: 'AI',
      code: i.id ? String(i.id) : undefined,
    }));
    monaco.editor.setModelMarkers(model, 'ai', markers);

    // Decorations for inline highlight + tooltip
    const newDecs = aiIssues.map((i) => ({
      range: new monaco.Range(
        Math.max(1, Number(i.startLine || 1)),
        Math.max(1, Number(i.startColumn || 1)),
        Math.max(1, Number(i.endLine || i.startLine || 1)),
        Math.max(1, Number(i.endColumn || i.startColumn || 1)),
      ),
      options: {
        inlineClassName:
          i.severity === 'error'
            ? 'ai-error-decoration'
            : i.severity === 'warning'
              ? 'ai-warning-decoration'
              : 'ai-info-decoration',
        hoverMessage: {
          value: `AI ${i.severity}: ${i.message}${Array.isArray(i.suggestions) && i.suggestions.length ? '\n\nSuggestions:\n- ' + i.suggestions.join('\n- ') : ''}`,
        },
        stickiness: 1,
      },
    }));
    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, newDecs);
  }

  function applyGhostSuggestions(aiIssues: any[]) {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel();
    if (!model) return;
    const ghosts = aiIssues
      .map((i) => {
        const suggestion =
          Array.isArray(i.suggestions) && i.suggestions.length
            ? String(i.suggestions[0])
            : undefined;
        // If precise edit exists, show its newText as hint
        const editNewText =
          Array.isArray(i.edits) && i.edits[0] ? String(i.edits[0].newText || '') : undefined;
        const text = suggestion || editNewText;
        if (!text) return null;
        const line = Math.max(1, Number(i.endLine || i.startLine || 1));
        const col = Math.max(1, Number(i.endColumn || i.startColumn || 1));
        return {
          range: new monaco.Range(line, col, line, col),
          options: {
            after: { content: `  // ${text.slice(0, 80)}`, color: '#8b949e' },
            stickiness: 1,
          },
        } as const;
      })
      .filter(Boolean) as any[];
    ghostDecoIdsRef.current = editor.deltaDecorations(ghostDecoIdsRef.current, ghosts);
  }

  // Register AI quick-fix (lightbulb) actions
  function registerAiCodeActions() {
    const monaco = monacoRef.current;
    if (!monaco) return;
    // Dispose previous providers
    codeActionDisposables.current.forEach((d) => d?.dispose?.());
    codeActionDisposables.current = [];

    const langs = ['javascript', 'typescript'];
    for (const lang of langs) {
      const disp = monaco.languages.registerCodeActionProvider(lang, {
        provideCodeActions(model: any, range: any, context: any, token: any) {
          const actions: any[] = [];
          const issues = issuesRef.current || [];

          function intersects(i: any) {
            const r = new monaco.Range(
              Math.max(1, Number(i.startLine || 1)),
              Math.max(1, Number(i.startColumn || 1)),
              Math.max(1, Number(i.endLine || i.startLine || 1)),
              Math.max(1, Number(i.endColumn || i.startColumn || 1)),
            );
            return !(
              r.endLineNumber < range.startLineNumber ||
              r.startLineNumber > range.endLineNumber ||
              (r.endLineNumber === range.startLineNumber && r.endColumn < range.startColumn) ||
              (r.startLineNumber === range.endLineNumber && r.startColumn > range.endColumn)
            );
          }

          for (const i of issues) {
            if (!intersects(i)) continue;
            if (Array.isArray(i.edits) && i.edits.length) {
              const workspaceEdits = i.edits.map((e) => ({
                resource: model.uri,
                textEdit: {
                  range: new monaco.Range(
                    Math.max(1, Number(e.startLine || 1)),
                    Math.max(1, Number(e.startColumn || 1)),
                    Math.max(1, Number(e.endLine || 1)),
                    Math.max(1, Number(e.endColumn || 1)),
                  ),
                  text: String(e.newText || ''),
                },
              }));
              actions.push({
                title: 'Apply AI quick fix',
                kind: 'quickfix',
                isPreferred: true,
                edit: { edits: workspaceEdits },
              });
            }
            // Fallback: insert suggestion as a comment below
            if (Array.isArray(i.suggestions) && i.suggestions[0]) {
              const insertPos = new monaco.Range(
                i.endLine,
                Number.MAX_SAFE_INTEGER,
                i.endLine,
                Number.MAX_SAFE_INTEGER,
              );
              actions.push({
                title: 'Insert AI suggestion as comment',
                kind: 'quickfix',
                edit: {
                  edits: [
                    {
                      resource: model.uri,
                      textEdit: { range: insertPos, text: `\n// AI: ${i.suggestions[0]}` },
                    },
                  ],
                },
              });
            }
          }

          // Whole-file fix
          if (fixedCode) {
            const lastLine = model.getLineCount();
            const lastCol = model.getLineMaxColumn(lastLine);
            actions.push({
              title: 'Apply all AI fixes (file)',
              kind: 'quickfix',
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    textEdit: { range: new monaco.Range(1, 1, lastLine, lastCol), text: fixedCode },
                  },
                ],
              },
            });
          }

          return { actions, dispose: () => {} } as any;
        },
      });
      codeActionDisposables.current.push(disp);
    }
  }

  // Keep provider updated when issues or fixedCode change
  useEffect(() => {
    if (issuesRef) {
      registerAiCodeActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, fixedCode, monacoLanguage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-48" data-testid="select-language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setOpenSummary(true)}
            title="AI Summary"
          >
            <PanelRight className="h-4 w-4" /> Summary
          </Button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".js,.py,.ts,.tsx,.jsx,.c,.cpp,.php"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
            className="gap-2"
            data-testid="button-upload-file"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <Button
            onClick={handleReview}
            disabled={!code || isReviewing}
            className="gap-2"
            data-testid="button-submit-review"
          >
            <Sparkles className="h-4 w-4" />
            {isReviewing ? 'Reviewing...' : 'Submit for Review'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Editor
            height="24rem"
            language={monacoLanguage}
            path={editorPath}
            theme={monacoTheme}
            value={code}
            onChange={(val) => setCode(val ?? '')}
            beforeMount={handleEditorBeforeMount}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lightbulb: { enabled: 'on' as any },
            }}
          />
        </CardContent>
      </Card>

      {hasReview && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="fixed" data-testid="tab-fixed-code">
              Fixed Code
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {issues.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No suggestions yet. Submit your code for review.
                  </p>
                )}
                {issues.map((iss) => (
                  <div
                    key={iss.id}
                    className={`border-l-4 pl-4 py-2 ${iss.severity === 'error' ? 'border-destructive' : iss.severity === 'warning' ? 'border-chart-4' : 'border-primary'}`}
                  >
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      {iss.severity === 'error' && <Badge variant="destructive">Error</Badge>}
                      {iss.severity === 'warning' && <Badge variant="outline">Warning</Badge>}
                      {iss.severity === 'info' && <Badge variant="secondary">Info</Badge>}
                      {iss.severity === 'security' && <Badge variant="destructive">Security</Badge>}
                      <span>{iss.message}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}
                    </p>
                    {iss.suggestions && iss.suggestions.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                        {iss.suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fixed Code</CardTitle>
              </CardHeader>
              <CardContent>
                {fixedCode ? (
                  <div className="border rounded-md overflow-hidden">
                    <DiffEditor
                      height="24rem"
                      original={code}
                      modified={fixedCode}
                      language={monacoLanguage}
                      options={{ readOnly: true, renderSideBySide: true }}
                      theme={monacoTheme}
                    />
                    <div className="p-3 flex justify-end gap-2">
                      <Button
                        className="mt-2"
                        variant="default"
                        onClick={() => {
                          setCode(fixedCode);
                          setActiveTab('suggestions');
                          // Clear annotations; a new review will regenerate them
                          clearAiAnnotations();
                        }}
                      >
                        Apply Fix
                      </Button>
                      <Button
                        className="mt-2"
                        variant="outline"
                        data-testid="button-copy-fixed-code"
                        onClick={() => navigator.clipboard.writeText(fixedCode)}
                      >
                        Copy Fixed Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fixed code yet. Submit for review.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {issues.filter((i) => i.severity === 'security').length === 0 && (
                  <p className="text-sm text-muted-foreground">No security issues reported.</p>
                )}
                {issues
                  .filter((i) => i.severity === 'security')
                  .map((iss) => (
                    <div key={iss.id} className="border-l-4 border-destructive pl-4 py-2">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Badge variant="destructive">High</Badge>
                        <span>{iss.message}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}
                      </p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Drawer open={openSummary} onOpenChange={setOpenSummary}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>AI Review Summary</DrawerTitle>
            <DrawerDescription>
              {aiMeta.model && (
                <span className="mr-2">
                  Model: <code>{aiMeta.model}</code>
                </span>
              )}
              {typeof aiMeta.tokens === 'number' && (
                <span className="mr-2">Tokens: {aiMeta.tokens}</span>
              )}
              {typeof aiMeta.cost === 'number' && <span>Cost: ${aiMeta.cost.toFixed(4)}</span>}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
            {aiSummary ? (
              <p className="text-sm whitespace-pre-wrap leading-6">{aiSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No summary yet. Run an AI review to populate this panel.
              </p>
            )}
            <div className="space-y-2">
              <h4 className="font-medium">Issues</h4>
              {issues.length === 0 && (
                <p className="text-sm text-muted-foreground">No issues reported.</p>
              )}
              {issues.map((iss) => (
                <div key={iss.id} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full ${iss.severity === 'error' ? 'bg-destructive' : iss.severity === 'warning' ? 'bg-yellow-500' : iss.severity === 'security' ? 'bg-red-600' : 'bg-primary'}`}
                  />
                  <div>
                    <div className="font-medium">{iss.message}</div>
                    <div className="text-xs text-muted-foreground">
                      L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}
                    </div>
                    {iss.suggestions && iss.suggestions[0] && (
                      <div className="text-xs mt-1">Suggestion: {iss.suggestions[0]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
