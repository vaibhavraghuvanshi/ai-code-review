import type { Request } from "express";

export type AiIssue = {
  id: string;
  message: string;
  severity: "error" | "warning" | "info" | "security";
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
};

export type AiReviewResponse = {
  summary: string;
  fixedCode: string;
  issues: AiIssue[];
  model?: string;
  temperature?: number;
  tokens?: number;
  cost?: number;
  raw?: any;
};

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
console.log("GROQ_API_URL =", GROQ_API_URL);
// Default to a broadly-supported Groq model; allow env override
const GROQ_MODEL_DEFAULT = "llama-3.3-70b-versatile";
const GROQ_MODEL = process.env.GROQ_MODEL || GROQ_MODEL_DEFAULT;
// Map deprecated models to recommended replacements
const DEPRECATED_MODEL_MAP: Record<string, string> = {
  "llama-3.1-70b-versatile": "llama-3.3-70b-versatile",
  "llama3-70b-8192": "llama-3.3-70b-versatile",
  "llama-3.1-70b": "llama-3.3-70b-versatile",
};
function normalizeModel(name: string): string {
  return DEPRECATED_MODEL_MAP[name] || name;
}
// Additional fallbacks if the primary is decommissioned or unavailable
const GROQ_FALLBACK_MODELS = Array.from(
  new Set(
    (process.env.GROQ_MODEL_FALLBACKS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .concat([
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "meta-llama/llama-guard-4-12b",
        "openai/gpt-oss-120b",
      ])
  )
);

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // try to find first { .. last }
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const inner = text.slice(first, last + 1);
      try { return JSON.parse(inner); } catch {}
    }
    // try code fence
    const fence = text.match(/```json([\s\S]*?)```/i);
    if (fence && fence[1]) {
      try { return JSON.parse(fence[1].trim()); } catch {}
    }
    throw new Error("Failed to parse AI JSON");
  }
}

export async function reviewCodeWithGroq({ code, language }: { code: string; language: string; }): Promise<AiReviewResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Server missing GROQ_API_KEY"), { status: 500 });
  }

  // Cap overly long inputs
  const MAX_CHARS = 60_000;
  const snippet = code.slice(0, MAX_CHARS);

  const system = `You are a strict code review assistant for ${language} (supports JavaScript, TypeScript, and React JSX). 
Return ONLY JSON in the following shape and nothing else:
{
  "summary": string,
  "fixedCode": string, // the full file with your suggested fixes applied
  "issues": [
    {
      "id": string, // unique id
      "message": string, // concise description
      "severity": "error" | "warning" | "info" | "security",
      "startLine": number, // 1-based
      "startColumn": number, // 1-based utf16 column
      "endLine": number,
      "endColumn": number,
      "suggestions": string[]
    }
  ]
}
Rules:
- Coordinates must be 1-based and within the provided code.
- If you cannot determine a range, target the whole line with startColumn=1 and endColumn=end of line.
- Keep fixedCode compilable.
- Prefer minimal, safe changes. Avoid stylistic rewrites unless necessary.`;

  const user = `LANGUAGE: ${language}\n\nCODE:\n\n${snippet}`;

  const tools = [
    {
      type: "function",
      function: {
        name: "submit_review",
        description: "Return structured code review with precise edit suggestions",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string" },
            fixedCode: { type: "string" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  message: { type: "string" },
                  severity: { enum: ["error", "warning", "info", "security"] },
                  startLine: { type: "integer", minimum: 1 },
                  startColumn: { type: "integer", minimum: 1 },
                  endLine: { type: "integer", minimum: 1 },
                  endColumn: { type: "integer", minimum: 1 },
                  suggestions: { type: "array", items: { type: "string" } },
                  edits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        startLine: { type: "integer", minimum: 1 },
                        startColumn: { type: "integer", minimum: 1 },
                        endLine: { type: "integer", minimum: 1 },
                        endColumn: { type: "integer", minimum: 1 },
                        newText: { type: "string" },
                      },
                      required: ["startLine", "startColumn", "endLine", "endColumn", "newText"],
                    },
                  },
                },
                required: ["message", "startLine", "startColumn", "endLine", "endColumn"],
              },
            },
          },
          required: ["summary", "fixedCode", "issues"],
        },
      },
    },
  ];

  const baseBody = {
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    stream: false,
    tools,
    tool_choice: "auto",
  } as any;

  const candidates = Array.from(new Set([normalizeModel(GROQ_MODEL), ...GROQ_FALLBACK_MODELS.map(normalizeModel)]));
  let lastErr: any = null;
  const attempted: string[] = [];
  for (const model of candidates) {
    try {
      attempted.push(model);
      const body = { ...baseBody, model };
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        const lower = (txt || "").toLowerCase();

        // Auth/permission issues will not be fixed by changing models
        if (res.status === 401 || res.status === 403) {
          const err = Object.assign(
            new Error(`Groq auth error ${res.status}: ${txt || "Unauthorized - check GROQ_API_KEY"}`),
            { status: res.status }
          );
          lastErr = err;
          break;
        }

        // Provider rate limiting
        if (res.status === 429) {
          const err = Object.assign(
            new Error(`Groq rate limit ${res.status}: ${txt || "Rate limited"}`),
            { status: 429 }
          );
          lastErr = err;
          break;
        }

        // Retry on model decommissioned/unavailable
        if ((res.status === 400 || res.status === 404) &&
            (lower.includes("decommission") || lower.includes("model") || lower.includes("not found"))) {
          lastErr = new Error(`Groq API error ${res.status}: ${(txt || "").slice(0, 200)}`);
          continue; // try next candidate
        }

        // Other 4xx/5xx -> propagate status when available, else map to 502
        const status = (res.status >= 400 && res.status <= 599) ? res.status : 502;
        throw Object.assign(new Error(`Groq API error ${res.status}: ${(txt || "").slice(0,200)}`), { status });
      }

      const data = await res.json();
      // Prefer function-calling result if available
      const toolArgsStr: string | undefined = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      let parsed: any | undefined;
      if (typeof toolArgsStr === "string" && toolArgsStr.trim().startsWith("{")) {
        try { parsed = JSON.parse(toolArgsStr); } catch { /* fall back below */ }
      }
      // Fallback to content JSON
      const content: string = parsed ? "" : (data?.choices?.[0]?.message?.content ?? "");
      if (!parsed && !content) {
        throw Object.assign(new Error("Empty AI response"), { status: 502 });
      }
      const json = parsed ?? extractJson(content);

  // Basic sanitize
  const issues: AiIssue[] = Array.isArray(json.issues) ? json.issues.map((i: any, idx: number) => ({
    id: String(i.id ?? idx + 1),
    message: String(i.message ?? ""),
    severity: (i.severity === "error" || i.severity === "warning" || i.severity === "info" || i.severity === "security") ? i.severity : "warning",
    startLine: Math.max(1, Number(i.startLine || 1)),
    startColumn: Math.max(1, Number(i.startColumn || 1)),
    endLine: Math.max(1, Number(i.endLine || i.startLine || 1)),
    endColumn: Math.max(1, Number(i.endColumn || i.startColumn || 1)),
    suggestions: Array.isArray(i.suggestions) ? i.suggestions.map(String) : [],
    edits: Array.isArray(i.edits)
      ? i.edits.map((e: any) => ({
          startLine: Math.max(1, Number(e.startLine || i.startLine || 1)),
          startColumn: Math.max(1, Number(e.startColumn || 1)),
          endLine: Math.max(1, Number(e.endLine || i.endLine || i.startLine || 1)),
          endColumn: Math.max(1, Number(e.endColumn || i.endColumn || i.startColumn || 1)),
          newText: String(e.newText ?? ""),
        }))
      : undefined,
  })) : [];

      const fixedCode: string = typeof json.fixedCode === "string" ? json.fixedCode : snippet;
      const summary: string = typeof json.summary === "string" ? json.summary : "";

      // Usage and cost estimation if provider returns usage
      const usage = (data as any)?.usage;
      const totalTokens: number | undefined = usage?.total_tokens ?? usage?.totalTokens;
      const temperature = (baseBody as any).temperature ?? 0.2;
      const usedModel = model;
  // Optional cost calculation via env pricing
      const promptTokens = usage?.prompt_tokens ?? 0;
      const completionTokens = usage?.completion_tokens ?? 0;
      const pricePT = parseFloat(process.env.PRICE_PER_1K_PROMPT_TOKENS || "0");
      const priceCT = parseFloat(process.env.PRICE_PER_1K_COMPLETION_TOKENS || "0");
      const cost = pricePT || priceCT
        ? (promptTokens / 1000) * pricePT + (completionTokens / 1000) * priceCT
        : undefined;

      return { summary, fixedCode, issues, model: usedModel, temperature, tokens: totalTokens, cost, raw: data };
    } catch (e: any) {
      lastErr = e;
      // on parse or other errors, break unless it's a decommission case already handled above
      continue;
    }
  }
  // If we reach here, all candidates failed
  if (lastErr) {
    (lastErr as any).attemptedModels = attempted;
    throw lastErr;
  }
  throw Object.assign(new Error("Failed to call Groq with any available model"), { attemptedModels: attempted });
}
