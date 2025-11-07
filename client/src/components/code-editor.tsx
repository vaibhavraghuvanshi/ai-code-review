import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import { applyAppTheme, getThemeName } from "@/lib/monacoTheme";
import { useTheme } from "./theme-provider";
import { usePreferences } from "./preferences-provider";
import { Upload, Sparkles, Lightbulb, PanelRight } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Checkbox } from "./ui/checkbox";
import { diffLines, computeWordDiffForModifiedChunksDual } from "@/lib/diff";

const languages = [
  { value: "javascript", label: "JavaScript (.js)" },
  { value: "react-jsx", label: "React (.jsx)" },
  { value: "typescript", label: "TypeScript (.ts)" },
  { value: "react-tsx", label: "React TS (.tsx)" },
  { value: "react-native-jsx", label: "React Native (.jsx)" },
  { value: "react-native-tsx", label: "React Native TS (.tsx)" },
];

const MODEL_LABELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B Versatile",
  "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
};

function getModelLabel(id?: string): string | undefined {
  if (!id) return undefined;
  return MODEL_LABELS[id] || id;
}

export function CodeEditor() {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [strictModel, setStrictModel] = useState<boolean>(false);

  // If a concrete model is selected (not Auto), default to strict (no fallback).
  useEffect(() => {
    setStrictModel(selectedModel !== "auto");
  }, [selectedModel]);
  const [pathExt, setPathExt] = useState<".js"|".jsx"|".ts"|".tsx">(".js");
  const [code, setCode] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [activeTab, setActiveTab] = useState("suggestions");
  const [fixedCode, setFixedCode] = useState("");
  const [reviewBaseCode, setReviewBaseCode] = useState("");
  const [issues, setIssues] = useState<Array<{ id: string; message: string; severity: "error"|"warning"|"info"|"security"; startLine: number; startColumn: number; endLine: number; endColumn: number; suggestions?: string[]; edits?: Array<{ startLine:number; startColumn:number; endLine:number; endColumn:number; newText:string }>; }>>([]);
  
  const decorationIdsRef = useRef<string[]>([]);
  const ghostDecoIdsRef = useRef<string[]>([]);
  const issuesRef = useRef<typeof issues>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiMeta, setAiMeta] = useState<{ model?: string; tokens?: number; cost?: number; temperature?: number }>({});
  const [openSummary, setOpenSummary] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement | null>(null);
  const codeActionDisposables = useRef<any[]>([]);
  const mountedRef = useRef(true);
  
  // Removed DiffEditor in favor of two read-only editors to avoid disposal races

  const handleReview = async () => {
    if (!code.trim()) return;
    try {
      setIsReviewing(true);
      // Keep tabs mounted to avoid disposing Monaco models; just switch to suggestions
      setActiveTab("suggestions");

      // Read current userId (if signed in)
      let userId: string | undefined;
      try {
        const raw = localStorage.getItem("currentUser");
        const u = raw ? JSON.parse(raw) : null;
        if (u?.id && typeof u.id === "string") userId = u.id;
      } catch {}

      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          ...(selectedModel !== "auto" ? { model: selectedModel } : {}),
          strictModel,
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
              errMsg += ` | models tried: ${ej.attemptedModels.join(", ")}`;
            }
          } else {
            const t = await res.text().catch(() => "");
            if (t) errMsg = t;
          }
        } catch {
          const t = await res.text().catch(() => "");
          if (t) errMsg = t;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
  const aiIssues = Array.isArray(data.issues) ? data.issues : [];
  setIssues(aiIssues);
  issuesRef.current = aiIssues;
  const nextFixed = typeof data.fixedCode === "string" ? data.fixedCode : code;
  // Defer fixedCode update to next microtask to avoid same-tick DiffEditor reconciliation churn
  Promise.resolve().then(() => setFixedCode(nextFixed));
      // Snapshot the original code that was reviewed to stabilize DiffEditor models
      setReviewBaseCode(code);
      setAiSummary(typeof data.summary === "string" ? data.summary : "");
      setAiMeta({ model: data.model, tokens: data.tokens, cost: data.cost, temperature: data.temperature });
      setHasReview(true);

      // Apply markers and decorations
      applyAiAnnotations(aiIssues);
      applyGhostSuggestions(aiIssues);

      toast({ title: "AI review complete", description: `${aiIssues.length} issue(s) reported.` });
    } catch (e) {
      console.error(e);
      toast({ title: "AI review failed", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
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
    if (pathExt === ".ts" || pathExt === ".tsx") return "typescript";
    return "javascript";
  }, [pathExt]);

  // Sync selectedLanguage -> pathExt so Monaco model language matches user selection
  useEffect(() => {
    switch (selectedLanguage) {
      case 'javascript':
        setPathExt('.js');
        break;
      case 'react-jsx':
        setPathExt('.jsx');
        break;
      case 'typescript':
        setPathExt('.ts');
        break;
      case 'react-tsx':
        setPathExt('.tsx');
        break;
      case 'react-native-jsx':
        setPathExt('.jsx');
        break;
      case 'react-native-tsx':
        setPathExt('.tsx');
        break;
      default:
        setPathExt('.js');
    }
  }, [selectedLanguage]);

  const editorPath = useMemo(() => {
    return `file:///App${pathExt}`;
  }, [pathExt]);

  // Stable model URIs for DiffEditor help TS/JS workers resolve sources reliably
  const diffOriginalPath = useMemo(() => `file:///__diff__/original${pathExt}`,[pathExt]);
  const diffModifiedPath = useMemo(() => `file:///__diff__/modified${pathExt}`,[pathExt]);

  const { theme } = useTheme();
  const { fontSize, codeTheme } = usePreferences();
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const currentThemeName = getThemeName(theme === 'dark' ? 'dark' : 'light');

  // Refs for diff editors (fixed tab) to apply line diff decorations
  const diffOriginalEditorRef = useRef<any>(null);
  const diffModifiedEditorRef = useRef<any>(null);
  const diffDecoOrigRef = useRef<string[]>([]);
  const diffDecoModRef = useRef<string[]>([]);

  function defineAppTheme(monaco: any) {
    applyAppTheme(monaco, theme === 'dark' ? 'dark' : 'light');
    // Enable JSX suggestions and sensible targets
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      allowJs: true,
      checkJs: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
  }

  function defineExtraEditorThemes(monaco: any) {
    // Minimal theme definitions for additional editor themes
    const ensure = (name: string, base: 'vs' | 'vs-dark', colors: Record<string,string> = {}) => {
      const exists = (monaco.editor as any)._themeService?._knownThemes?.has(name);
      if (!exists) {
        monaco.editor.defineTheme(name, { base, inherit: true, rules: [], colors });
      }
    };
    ensure('monokai', 'vs-dark', {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editorLineNumber.foreground': '#75715E',
      'editor.selectionBackground': '#49483E',
    });
    ensure('github-dark', 'vs-dark', {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editorLineNumber.foreground': '#6e7681',
      'editor.selectionBackground': '#1f6feb55',
    });
    ensure('dracula', 'vs-dark', {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#6272a4',
      'editor.selectionBackground': '#44475a',
    });
  }

  const extraLibsAddedRef = useRef(false);

  const handleEditorBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineAppTheme(monaco);
    defineExtraEditorThemes(monaco);
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
      monaco.languages.typescript.typescriptDefaults.addExtraLib(jsxTypes, 'file:///types/jsx.d.ts');
      monaco.languages.typescript.javascriptDefaults.addExtraLib(jsxTypes, 'file:///types/jsx-js.d.ts');
      monaco.languages.typescript.typescriptDefaults.addExtraLib(reactStub, 'file:///types/react.d.ts');
      monaco.languages.typescript.javascriptDefaults.addExtraLib(reactStub, 'file:///types/react-js.d.ts');
      monaco.languages.typescript.typescriptDefaults.addExtraLib(rnStub, 'file:///types/react-native.d.ts');
      monaco.languages.typescript.javascriptDefaults.addExtraLib(rnStub, 'file:///types/react-native-js.d.ts');
      extraLibsAddedRef.current = true;
    }
  };

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Enable glyph margin for potential future margin decorations
    editor.updateOptions({ glyphMargin: true });
  };

  // Decide editor theme: follow app or explicit selection
  const monacoTheme = codeTheme === 'app' ? currentThemeName : codeTheme;

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    applyAppTheme(monaco, theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  // --- Diff line + word decorations using Myers diff ---
  function applyDiffDecorations() {
    const monaco = monacoRef.current;
    if (!monaco || !diffOriginalEditorRef.current || !diffModifiedEditorRef.current) return;
    const chunks = diffLines(reviewBaseCode || '', fixedCode || '');

    const origEditor = diffOriginalEditorRef.current;
    const modEditor = diffModifiedEditorRef.current;

    const origDecos: any[] = [];
    const modDecos: any[] = [];

    const pushWholeLine = (arr: any[], start: number, end: number, className: string, gutter: string) => {
      if (!start || !end || end < start) return;
      for (let ln = start; ln <= end; ln++) {
        arr.push({
          range: new monaco.Range(ln, 1, ln, 1),
          options: { isWholeLine: true, className, linesDecorationsClassName: gutter },
        });
      }
    };

    for (const c of chunks) {
      if (c.type === 'equal') continue;
      if (c.type === 'removed') {
        pushWholeLine(origDecos, c.oldStart, c.oldEnd, 'diff-line-removed', 'diff-gutter-removed');
      } else if (c.type === 'added') {
        pushWholeLine(modDecos, c.newStart, c.newEnd, 'diff-line-added', 'diff-gutter-added');
      } else if (c.type === 'modified') {
        pushWholeLine(origDecos, c.oldStart, c.oldEnd, 'diff-line-modified', 'diff-gutter-modified');
        pushWholeLine(modDecos, c.newStart, c.newEnd, 'diff-line-modified', 'diff-gutter-modified');
      }
    }

    // Dual-side word-level segments for modified chunks
    try {
      const { orig, mod } = computeWordDiffForModifiedChunksDual(chunks);
      for (const seg of orig) {
        origDecos.push({
          range: new monaco.Range(seg.lineNumber, seg.startColumn, seg.lineNumber, seg.endColumn),
          options: { inlineClassName: 'diff-word-removed' },
        });
      }
      for (const seg of mod) {
        modDecos.push({
          range: new monaco.Range(seg.lineNumber, seg.startColumn, seg.lineNumber, seg.endColumn),
          options: { inlineClassName: 'diff-word-added' },
        });
      }
    } catch (e) {
      console.warn('[CodeEditor] dual word-level diff failed', e);
    }

    diffDecoOrigRef.current = origEditor.deltaDecorations(diffDecoOrigRef.current, origDecos);
    diffDecoModRef.current = modEditor.deltaDecorations(diffDecoModRef.current, modDecos);
  }

  function tryApplyDiffDecorationsSoon() {
    if (diffOriginalEditorRef.current && diffModifiedEditorRef.current) {
      requestAnimationFrame(() => applyDiffDecorations());
    }
  }

  useEffect(() => {
    if (fixedCode && reviewBaseCode && fixedCode !== reviewBaseCode) {
      applyDiffDecorations();
    } else {
      // clear decorations if identical or missing
      const monaco = monacoRef.current;
      if (monaco && diffOriginalEditorRef.current) {
        diffDecoOrigRef.current = diffOriginalEditorRef.current.deltaDecorations(diffDecoOrigRef.current, []);
      }
      if (monaco && diffModifiedEditorRef.current) {
        diffDecoModRef.current = diffModifiedEditorRef.current.deltaDecorations(diffDecoModRef.current, []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCode, reviewBaseCode]);

  // Re-apply diff decorations when switching to the Fixed tab to ensure refs are set and content visible
  useEffect(() => {
    if (activeTab === 'fixed') {
      tryApplyDiffDecorationsSoon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Ensure TS/JS semantic validation is enabled so users see type/syntax error highlights
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    try {
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      console.log("[CodeEditor] Enabled semantic validation for TS/JS");
    } catch (e) {
      console.warn("[CodeEditor] Failed to enable semantic validation", e);
    }
  }, []);

  // No detach needed since we no longer use DiffEditor

  // Ensure diff models exist with stable URIs and correct languages/contents
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    try {
      const originalUri = monaco.Uri.parse(diffOriginalPath);
      const modifiedUri = monaco.Uri.parse(diffModifiedPath);

      let originalModel = monaco.editor.getModel(originalUri);
      if (!originalModel) {
        originalModel = monaco.editor.createModel(reviewBaseCode || "", monacoLanguage, originalUri);
      } else {
        if (originalModel.getValue() !== (reviewBaseCode || "")) {
          originalModel.setValue(reviewBaseCode || "");
        }
        if (originalModel.getLanguageId && originalModel.getLanguageId() !== monacoLanguage) {
          monaco.editor.setModelLanguage(originalModel, monacoLanguage);
        }
      }

      let modifiedModel = monaco.editor.getModel(modifiedUri);
      if (!modifiedModel) {
        modifiedModel = monaco.editor.createModel(fixedCode || "", monacoLanguage, modifiedUri);
      } else {
        if (modifiedModel.getValue() !== (fixedCode || "")) {
          modifiedModel.setValue(fixedCode || "");
        }
        if (modifiedModel.getLanguageId && modifiedModel.getLanguageId() !== monacoLanguage) {
          monaco.editor.setModelLanguage(modifiedModel, monacoLanguage);
        }
      }
    } catch (e) {
      console.warn("[CodeEditor] ensureDiffModels failed", e);
    }
    // We intentionally do not dispose these models to keep TS worker references stable while component lives
    // They will be GC'd when the app reloads or if we add explicit disposal on component unmount
  }, [diffOriginalPath, diffModifiedPath, monacoLanguage, reviewBaseCode, fixedCode]);

  // Log tab transitions with extra detail for fixed and security panels
  useEffect(() => {
    if (activeTab === "fixed") {
      console.log("[CodeEditor] Entered Fixed tab. reviewBaseCode length=", reviewBaseCode.length, " fixedCode length=", fixedCode.length);
    } else if (activeTab === "security") {
      const secCount = issues.filter(i => i.severity === 'security').length;
      console.log("[CodeEditor] Entered Security tab. securityIssueCount=", secCount);
    } else if (activeTab === "suggestions") {
      console.log("[CodeEditor] Entered Suggestions tab. issueCount=", issues.length);
    }
  }, [activeTab, reviewBaseCode.length, fixedCode.length, issues]);

  // Cleanup on unmount: dispose code action providers and clear decorations/markers
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        // Dispose AI code action providers
        codeActionDisposables.current.forEach((d) => d?.dispose?.());
        codeActionDisposables.current = [];
      } catch {}
      try {
        // Clear any annotations/decorations tied to the editor
        clearAiAnnotations();
      } catch {}
      try {
        clearGhostSuggestions();
      } catch {}
    };
  }, []);

  // Move focus into the Drawer when it opens to avoid aria-hidden ancestor focus warnings
  useEffect(() => {
    if (openSummary) {
      // Defer to next frame to ensure content is mounted
      requestAnimationFrame(() => {
        try {
          drawerContentRef.current?.focus();
        } catch {}
      });
    }
  }, [openSummary]);

  // Clear AI markers only when language changes (not on every keystroke) so user retains annotations while editing
  useEffect(() => {
    clearAiAnnotations();
    clearGhostSuggestions();
  }, [selectedLanguage]);

  function clearAiAnnotations() {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel();
    if (!model) return;
    monaco.editor.setModelMarkers(model, "ai", []);
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

    // Markers (squiggles + hover) + overview ruler color mapping
    const markers = aiIssues.map((i) => ({
      startLineNumber: Math.max(1, Number(i.startLine || 1)),
      startColumn: Math.max(1, Number(i.startColumn || 1)),
      endLineNumber: Math.max(1, Number(i.endLine || i.startLine || 1)),
      endColumn: Math.max(1, Number(i.endColumn || i.startColumn || 1)),
      message: String(i.message || "AI feedback"),
      severity: i.severity === "error" ? monaco.MarkerSeverity.Error : i.severity === "warning" ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Info,
      source: "AI",
      code: i.id ? String(i.id) : undefined,
    }));
    monaco.editor.setModelMarkers(model, "ai", markers);

    // Whole line decorations for stronger visibility + inline highlight
    const newDecs = aiIssues.map((i) => {
      const startLine = Math.max(1, Number(i.startLine || 1));
      const startColumn = Math.max(1, Number(i.startColumn || 1));
      const endLine = Math.max(1, Number(i.endLine || i.startLine || 1));
      const endColumn = Math.max(1, Number(i.endColumn || i.startColumn || 1));
      const cls = i.severity === "error" ? "ai-error-decoration" : i.severity === "warning" ? "ai-warning-decoration" : "ai-info-decoration";
      return {
        range: new monaco.Range(startLine, startColumn, endLine, endColumn),
        options: {
          isWholeLine: true,
          className: cls, // entire line background
          inlineClassName: cls, // inline segment background
          hoverMessage: { value: `AI ${i.severity}: ${i.message}${Array.isArray(i.suggestions)&&i.suggestions.length?"\n\nSuggestions:\n- "+i.suggestions.join("\n- "):""}` },
          overviewRuler: {
            color: i.severity === 'error' ? 'rgba(239,68,68,0.9)' : i.severity === 'warning' ? 'rgba(234,179,8,0.9)' : 'rgba(34,197,94,0.9)',
            position: monaco.editor.OverviewRulerLane.Full,
          },
          stickiness: 1,
        },
      };
    });
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
        const suggestion = Array.isArray(i.suggestions) && i.suggestions.length ? String(i.suggestions[0]) : undefined;
        // If precise edit exists, show its newText as hint
        const editNewText = Array.isArray(i.edits) && i.edits[0] ? String(i.edits[0].newText || "") : undefined;
        const text = suggestion || editNewText;
        if (!text) return null;
        const line = Math.max(1, Number(i.endLine || i.startLine || 1));
        const col = Math.max(1, Number(i.endColumn || i.startColumn || 1));
        return {
          range: new monaco.Range(line, col, line, col),
          options: {
            after: { content: `  // ${text.slice(0, 80)}`, color: "#8b949e" },
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

    // Capture fixedCode to ensure closure safety
    const currentFixedCode = fixedCode;

    // Dispose previous providers
    codeActionDisposables.current.forEach((d) => d?.dispose?.());
    codeActionDisposables.current = [];

    const langs = ["javascript", "typescript", "jsx", "tsx"];

    for (const lang of langs) {
      const disposable = monaco.languages.registerCodeActionProvider(lang, {
        provideCodeActions(
          model: any,
          range: any,
          context: any,
          token: any
        ) {
          const actions: any[] = [];
          const issues = issuesRef.current || [];

          function intersects(issue: any) {
            const startLine = Number(issue.startLine ?? 1);
            const startCol = Number(issue.startColumn ?? 1);
            const endLine = Number(issue.endLine ?? startLine);
            const endCol =
              Number(issue.endColumn ?? model.getLineMaxColumn(endLine) ?? 1);

            const r = new monaco.Range(startLine, startCol, endLine, endCol);

            return !(
              r.endLineNumber < range.startLineNumber ||
              r.startLineNumber > range.endLineNumber ||
              (r.endLineNumber === range.startLineNumber &&
                r.endColumn < range.startColumn) ||
              (r.startLineNumber === range.endLineNumber &&
                r.startColumn > range.endColumn)
            );
          }

          for (const issue of issues) {
            if (!intersects(issue)) continue;

            // Quick-fix edits
            if (Array.isArray(issue.edits) && issue.edits.length > 0) {
              const workspaceEdits = [
                {
                  resource: model.uri,
                  edits: issue.edits.map((e: any) => {
                    const startLine = Number(e.startLine ?? 1);
                    const startCol = Number(e.startColumn ?? 1);
                    const endLine = Number(e.endLine ?? startLine);
                    const endCol = Number(
                      e.endColumn ?? model.getLineMaxColumn(endLine) ?? 1
                    );

                    return {
                      range: new monaco.Range(startLine, startCol, endLine, endCol),
                      text: String(e.newText ?? ""),
                    };
                  }),
                },
              ];

              actions.push({
                title: "Apply AI quick fix",
                kind: "quickfix",
                isPreferred: true,
                edit: { edits: workspaceEdits },
              });
            }

            // Fallback: insert suggestion as comment
            if (Array.isArray(issue.suggestions) && issue.suggestions[0]) {
              const safeLine = Math.max(
                1,
                Math.min(issue.endLine ?? issue.startLine ?? 1, model.getLineCount())
              );
              const maxCol = model.getLineMaxColumn(safeLine);
              const insertPos = new monaco.Range(safeLine, maxCol, safeLine, maxCol);

              actions.push({
                title: "Insert AI suggestion as comment",
                kind: "quickfix",
                edit: {
                  edits: [
                    {
                      resource: model.uri,
                      edits: [
                        {
                          range: insertPos,
                          text: `\n// AI: ${issue.suggestions[0]}`,
                        },
                      ],
                    },
                  ],
                },
              });
            }
          }

          // Whole-file fix
          if (currentFixedCode) {
            const lastLine = model.getLineCount();
            const lastCol = model.getLineMaxColumn(lastLine);
            actions.push({
              title: "Apply all AI fixes (file)",
              kind: "quickfix",
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    edits: [
                      {
                        range: new monaco.Range(1, 1, lastLine, lastCol),
                        text: currentFixedCode,
                      },
                    ],
                  },
                ],
              },
            });
          }

          return { actions, dispose: () => {} };
        },
      });

      codeActionDisposables.current.push(disposable);
    }
  }

  

  // Dispose providers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      codeActionDisposables.current.forEach((d) => d?.dispose?.());
      codeActionDisposables.current = [];
    };
  }, []);

  // Update providers whenever issues or fixedCode change
  useEffect(() => {
    if (issuesRef.current) {
      registerAiCodeActions();
    }
  }, [issues, fixedCode, monacoLanguage]);

  // Simple error boundary to prevent unknown runtime overlay when tab content throws
  class TabsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }>{
    constructor(props: any) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
      return { hasError: true, error };
    }
    componentDidCatch(error: any, info: any) {
      console.error("[CodeEditor] Tabs runtime error:", error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="border border-destructive rounded-md bg-destructive/10 p-3 text-sm">
            An error occurred while rendering this panel. See console for details.
          </div>
        );
      }
      return this.props.children as any;
    }
  }

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

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={strictModel}
            onCheckedChange={(v) => setStrictModel(Boolean(v))}
            data-testid="checkbox-strict-model"
          />
          Strict (no fallback)
        </label>

        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-72" data-testid="select-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (recommended)</SelectItem>
            <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B – Versatile (quality)</SelectItem>
            <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B – Instant (speed)</SelectItem>
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
            onClick={() => document.getElementById("file-upload")?.click()}
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
            {isReviewing ? "Reviewing..." : "Submit for Review"}
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
            onChange={(val) => setCode(val ?? "")}
            beforeMount={handleEditorBeforeMount}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: fontSize === 'small' ? 12 : fontSize === 'medium' ? 13 : fontSize === 'large' ? 15 : 17,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lightbulb: { enabled: "on" as any },
            }}
          />
        </CardContent>
      </Card>

      {hasReview && (
        <TabsErrorBoundary>
          <Tabs value={activeTab} onValueChange={(v) => { console.log("[CodeEditor] Tab change:", v); setActiveTab(v); }} className="w-full">
            <TabsList>
              <TabsTrigger value="suggestions" data-testid="tab-suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="fixed" data-testid="tab-fixed-code">Fixed Code</TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="mt-4" forceMount>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {issues.length === 0 && (
                    <p className="text-sm text-muted-foreground">No suggestions yet. Submit your code for review.</p>
                  )}
                  {issues.map((iss) => (
                    <div key={iss.id} className={`border-l-4 pl-4 py-2 ${iss.severity === "error" ? "border-destructive" : iss.severity === "warning" ? "border-chart-4" : "border-primary"}`}>
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        {iss.severity === "error" && <Badge variant="destructive">Error</Badge>}
                        {iss.severity === "warning" && <Badge variant="outline">Warning</Badge>}
                        {iss.severity === "info" && <Badge variant="secondary">Info</Badge>}
                        {iss.severity === "security" && <Badge variant="destructive">Security</Badge>}
                        <span>{iss.message}</span>
                      </h4>
                      <p className="text-xs text-muted-foreground">L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}</p>
                      {iss.suggestions && iss.suggestions.length > 0 && (
                        <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                          {iss.suggestions.map((s, idx) => (<li key={idx}>{s}</li>))}
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
                      {fixedCode && fixedCode !== reviewBaseCode && (
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="border-r">
                            <Editor
                              height="24rem"
                              language={monacoLanguage}
                              path={diffOriginalPath}
                              theme={monacoTheme}
                              value={reviewBaseCode}
                              onMount={(ed)=>{ diffOriginalEditorRef.current = ed; }}
                              options={{ readOnly: true, renderLineHighlight: "none", minimap: { enabled: false }, scrollBeyondLastLine: false }}
                            />
                          </div>
                          <div>
                            <Editor
                              height="24rem"
                              language={monacoLanguage}
                              path={diffModifiedPath}
                              theme={monacoTheme}
                              value={fixedCode}
                              onMount={(ed)=>{ diffModifiedEditorRef.current = ed; }}
                              options={{ readOnly: true, renderLineHighlight: "none", minimap: { enabled: false }, scrollBeyondLastLine: false }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="p-3 flex justify-end gap-2">
                        <Button
                          className="mt-2"
                          variant="default"
                          onClick={() => {
                            if (fixedCode && fixedCode !== reviewBaseCode) {
                              setCode(fixedCode);
                              toast({ title: 'Applied', description: 'Fixed code moved into editor.' });
                            }
                          }}
                        >
                          Apply Fix
                        </Button>
                        <Button
                          className="mt-2"
                          variant="outline"
                          data-testid="button-copy-fixed-code"
                          onClick={async () => { await navigator.clipboard.writeText(fixedCode); toast({ title: 'Copied', description: 'Fixed code copied to clipboard'}); }}
                        >
                          Copy Fixed Code
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No fixed code yet. Submit for review.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4" forceMount>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Security Warnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    try {
                      const securityIssues = issues.filter(i => i.severity === 'security');
                      if (securityIssues.length === 0) {
                        return <p className="text-sm text-muted-foreground">No security issues reported.</p>;
                      }
                      return securityIssues.map(iss => (
                        <div key={iss.id} className="border-l-4 border-destructive pl-4 py-2">
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <Badge variant="destructive">High</Badge>
                            <span>{iss.message}</span>
                          </h4>
                          <p className="text-sm text-muted-foreground">L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}</p>
                        </div>
                      ));
                    } catch (e) {
                      console.error('[CodeEditor] Security tab render error', e, issues);
                      return <p className="text-sm text-destructive">Failed to render security issues.</p>;
                    }
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsErrorBoundary>
      )}

      <Drawer open={openSummary} onOpenChange={setOpenSummary}>
        <DrawerContent ref={drawerContentRef as any} tabIndex={-1}>
          <DrawerHeader>
            <DrawerTitle>AI Review Summary</DrawerTitle>
            <DrawerDescription>
              {(() => {
                const used = aiMeta.model ? getModelLabel(aiMeta.model) : undefined;
                const selected = selectedModel === "auto" ? "Auto" : getModelLabel(selectedModel);
                let node: JSX.Element | null = null;
                if (selectedModel === "auto") {
                  const display = used ? `Auto → ${used}` : selected;
                  node = display ? (
                    <span className="mr-2">Model: <code>{display}</code></span>
                  ) : null;
                } else {
                  if (used && used !== selected) {
                    node = (
                      <span className="mr-2">
                        Model: <code>Selected: {selected} • Used: {used}</code>
                      </span>
                    );
                  } else {
                    const display = used || selected;
                    node = display ? (
                      <span className="mr-2">Model: <code>{display}</code></span>
                    ) : null;
                  }
                }
                return node;
              })()}
              {typeof aiMeta.tokens === "number" && <span className="mr-2">Tokens: {aiMeta.tokens}</span>}
              {typeof aiMeta.cost === "number" && <span>Cost: ${aiMeta.cost.toFixed(4)}</span>}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
            {aiSummary ? (
              <p className="text-sm whitespace-pre-wrap leading-6">{aiSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No summary yet. Run an AI review to populate this panel.</p>
            )}
            <div className="space-y-2">
              <h4 className="font-medium">Issues</h4>
              {issues.length === 0 && (
                <p className="text-sm text-muted-foreground">No issues reported.</p>
              )}
              {issues.map((iss) => (
                <div key={iss.id} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1 inline-block h-2 w-2 rounded-full ${iss.severity === 'error' ? 'bg-destructive' : iss.severity === 'warning' ? 'bg-yellow-500' : iss.severity === 'security' ? 'bg-red-600' : 'bg-primary'}`} />
                  <div>
                    <div className="font-medium">{iss.message}</div>
                    <div className="text-xs text-muted-foreground">L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}</div>
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

//workingcode