import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Editor, BeforeMount } from "@monaco-editor/react";
import { useToast } from '@/hooks/use-toast';
import { applyAppTheme, getThemeName } from '@/lib/monacoTheme';
import { diffLines, computeWordDiffForModifiedChunksDual } from '@/lib/diff';
import { useTheme } from "@/components/theme-provider";

export default function ReviewDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/reviews/:id");
  const id = params?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<any | null>(null);
  const { theme } = useTheme();
  const monacoRef = useRef<any>(null);
  const diffOrigRef = useRef<any>(null);
  const diffModRef = useRef<any>(null);
  const diffDecoOrigRef = useRef<string[]>([]);
  const diffDecoModRef = useRef<string[]>([]);
  const { toast } = useToast();

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
    return () => { mounted = false; }
  }, [id]);

  const langId = useMemo(() => {
    const l = (review?.language || "").toLowerCase();
    if (l.includes("ts")) return "typescript";
    return "javascript";
  }, [review?.language]);

  const currentThemeName = getThemeName(theme === 'dark' ? 'dark' : 'light');

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    applyAppTheme(monaco, theme === 'dark' ? 'dark' : 'light');
  };
  function applyDiffDecorations() {
    const monaco = monacoRef.current; if(!monaco||!diffOrigRef.current||!diffModRef.current) return;
    const chunks = diffLines(review?.code||'', review?.fixedCode||review?.code||'');

    const origDecos: any[] = [];
    const modDecos: any[] = [];
    const pushWholeLine = (arr: any[], start: number, end: number, className: string, gutter: string) => {
      if (!start || !end || end < start) return;
      for (let ln = start; ln <= end; ln++) {
        arr.push({ range: new monaco.Range(ln,1,ln,1), options: { isWholeLine: true, className, linesDecorationsClassName: gutter } });
      }
    };
    for (const c of chunks) {
      if (c.type === 'equal') continue;
      if (c.type === 'removed') pushWholeLine(origDecos, c.oldStart, c.oldEnd, 'diff-line-removed', 'diff-gutter-removed');
      else if (c.type === 'added') pushWholeLine(modDecos, c.newStart, c.newEnd, 'diff-line-added', 'diff-gutter-added');
      else if (c.type === 'modified') {
        pushWholeLine(origDecos, c.oldStart, c.oldEnd, 'diff-line-modified', 'diff-gutter-modified');
        pushWholeLine(modDecos, c.newStart, c.newEnd, 'diff-line-modified', 'diff-gutter-modified');
      }
    }
    try {
      const { orig, mod } = computeWordDiffForModifiedChunksDual(chunks);
      for (const seg of orig) {
        origDecos.push({ range: new monaco.Range(seg.lineNumber, seg.startColumn, seg.lineNumber, seg.endColumn), options: { inlineClassName: 'diff-word-removed' } });
      }
      for (const seg of mod) {
        modDecos.push({ range: new monaco.Range(seg.lineNumber, seg.startColumn, seg.lineNumber, seg.endColumn), options: { inlineClassName: 'diff-word-added' } });
      }
    } catch {}
    diffDecoOrigRef.current = diffOrigRef.current.deltaDecorations(diffDecoOrigRef.current, origDecos);
    diffDecoModRef.current = diffModRef.current.deltaDecorations(diffDecoModRef.current, modDecos);
  }

  useEffect(()=>{
    if(review?.code && (review?.fixedCode||review?.code) && review?.fixedCode !== review?.code) applyDiffDecorations(); else {
      if(diffOrigRef.current) diffDecoOrigRef.current = diffOrigRef.current.deltaDecorations(diffDecoOrigRef.current, []);
      if(diffModRef.current) diffDecoModRef.current = diffModRef.current.deltaDecorations(diffDecoModRef.current, []);
    }
  },[review?.code, review?.fixedCode]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    applyAppTheme(monaco, theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  if (!match) return null;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Review #{id}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{review?.language ?? "-"}</Badge>
          {review?.model && <code className="px-2 py-1 rounded bg-muted">{review.model}</code>}
          {typeof review?.tokens === "number" && <span>Tokens: {review.tokens}</span>}
          {typeof review?.cost === "number" && <span>Cost: ${Number(review.cost).toFixed(4)}</span>}
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
                  <Badge variant={iss.severity === 'error' ? 'destructive' : iss.severity === 'warning' ? 'outline' : 'secondary'}>
                    {iss.severity || 'info'}
                  </Badge>
                  <span>{iss.message}</span>
                </h4>
                <p className="text-xs text-muted-foreground">L{iss.startLine}:{iss.startColumn} - L{iss.endLine}:{iss.endColumn}</p>
                {Array.isArray(iss.suggestions) && iss.suggestions.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                    {iss.suggestions.map((s: string, idx: number) => (<li key={idx}>{s}</li>))}
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
          <CardTitle className="text-lg">Fixed Code</CardTitle>
        </CardHeader>
        <CardContent>
          {review?.code ? (
            <div className="space-y-2">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="24rem"
                    language={langId}
                    value={review?.code || ''}
                    path={`file:///review-${id}-original.${langId === 'typescript' ? 'ts' : 'js'}`}
                    onMount={(ed)=>{ diffOrigRef.current = ed; }}
                    options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                    theme={currentThemeName}
                    beforeMount={handleBeforeMount}
                  />
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="24rem"
                    language={langId}
                    value={review?.fixedCode || review?.code || ''}
                    path={`file:///review-${id}-fixed.${langId === 'typescript' ? 'ts' : 'js'}`}
                    onMount={(ed)=>{ diffModRef.current = ed; }}
                    options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                    theme={currentThemeName}
                    beforeMount={handleBeforeMount}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(review?.fixedCode || review?.code || '');
                    toast({ title: "Copied", description: "Code copied to clipboard" });
                  }}
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
