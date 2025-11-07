/*
  Myers diff implementation (simplified) for line-level diff plus word-level segments.
  Exposes functions:
    diffLines(oldText, newText) -> array of { type: 'equal'|'added'|'removed'|'modified', oldStart, oldEnd, newStart, newEnd, oldLines, newLines }
    diffWords(oldLine: string, newLine: string) -> array of { type: 'equal'|'added'|'removed', value }
  Lines labeled 'modified' are derived by pairing removed/added blocks.
*/

export interface LineDiffChunk {
  type: 'equal' | 'added' | 'removed' | 'modified';
  oldStart: number; // 1-based line number span in old
  oldEnd: number;
  newStart: number; // 1-based line number span in new
  newEnd: number;
  oldLines: string[];
  newLines: string[];
}

export interface WordDiffChunk {
  type: 'equal' | 'added' | 'removed';
  value: string;
}

function myersSequence(a: string[], b: string[]): { snakes: Array<{x: number; y: number; size: number}> } {
  const N = a.length;
  const M = b.length;
  const max = N + M;
  const v: Record<number, number> = { 1: 0 };
  const snakes: Array<{x: number; y: number; size: number}> = [];
  for (let d = 0; d <= max; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
        x = v[k + 1];
      } else {
        x = v[k - 1] + 1;
      }
      let y = x - k;
      let size = 0;
      while (x < N && y < M && a[x] === b[y]) { x++; y++; size++; }
      v[k] = x;
      if (size > 0) snakes.push({ x: x - size, y: y - size, size });
      if (x >= N && y >= M) {
        return { snakes };
      }
    }
  }
  return { snakes };
}

export function diffLines(oldText: string, newText: string): LineDiffChunk[] {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  const { snakes } = myersSequence(oldLines, newLines);

  // Build matching positions map
  const matches: Array<{ oldIndex: number; newIndex: number; size: number }> = snakes.map(s => ({ oldIndex: s.x, newIndex: s.y, size: s.size }));
  matches.sort((a,b)=>a.oldIndex - b.oldIndex);

  const chunks: LineDiffChunk[] = [];
  let oldPos = 0; let newPos = 0;
  for (const m of matches) {
    // Handle a gap before this match
    if (m.oldIndex > oldPos || m.newIndex > newPos) {
      const removedSlice = oldLines.slice(oldPos, m.oldIndex);
      const addedSlice = newLines.slice(newPos, m.newIndex);
      if (removedSlice.length && addedSlice.length) {
        chunks.push({
          type: 'modified',
          oldStart: oldPos + 1,
          oldEnd: m.oldIndex,
          newStart: newPos + 1,
          newEnd: m.newIndex,
          oldLines: removedSlice,
          newLines: addedSlice,
        });
      } else if (removedSlice.length) {
        chunks.push({
          type: 'removed', oldStart: oldPos + 1, oldEnd: m.oldIndex, newStart: newPos + 1, newEnd: newPos, oldLines: removedSlice, newLines: []
        });
      } else if (addedSlice.length) {
        chunks.push({
          type: 'added', oldStart: oldPos + 1, oldEnd: oldPos, newStart: newPos + 1, newEnd: m.newIndex, oldLines: [], newLines: addedSlice
        });
      }
    }
    // Equal segment
    if (m.size > 0) {
      const eqOldStart = m.oldIndex + 1;
      const eqOldEnd = m.oldIndex + m.size;
      const eqNewStart = m.newIndex + 1;
      const eqNewEnd = m.newIndex + m.size;
      const segment = oldLines.slice(m.oldIndex, m.oldIndex + m.size);
      chunks.push({
        type: 'equal',
        oldStart: eqOldStart,
        oldEnd: eqOldEnd,
        newStart: eqNewStart,
        newEnd: eqNewEnd,
        oldLines: segment,
        newLines: segment,
      });
    }
    oldPos = m.oldIndex + m.size;
    newPos = m.newIndex + m.size;
  }
  // Tail gap
  if (oldPos < oldLines.length || newPos < newLines.length) {
    const removedSlice = oldLines.slice(oldPos);
    const addedSlice = newLines.slice(newPos);
    if (removedSlice.length && addedSlice.length) {
      chunks.push({
        type: 'modified',
        oldStart: oldPos + 1,
        oldEnd: oldLines.length,
        newStart: newPos + 1,
        newEnd: newLines.length,
        oldLines: removedSlice,
        newLines: addedSlice,
      });
    } else if (removedSlice.length) {
      chunks.push({ type: 'removed', oldStart: oldPos + 1, oldEnd: oldLines.length, newStart: newPos + 1, newEnd: newPos, oldLines: removedSlice, newLines: [] });
    } else if (addedSlice.length) {
      chunks.push({ type: 'added', oldStart: oldPos + 1, oldEnd: oldPos, newStart: newPos + 1, newEnd: newLines.length, oldLines: [], newLines: addedSlice });
    }
  }
  return chunks;
}

export function diffWords(a: string, b: string): WordDiffChunk[] {
  if (a === b) return [{ type: 'equal', value: a }];
  const aTokens = tokenizeWords(a);
  const bTokens = tokenizeWords(b);
  // Simple dynamic programming LCS for word tokens
  const n = aTokens.length, m = bTokens.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = aTokens[i] === bTokens[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const chunks: WordDiffChunk[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (aTokens[i] === bTokens[j]) {
      chunks.push({ type: 'equal', value: aTokens[i] });
      i++; j++; continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      chunks.push({ type: 'removed', value: aTokens[i] }); i++;
    } else {
      chunks.push({ type: 'added', value: bTokens[j] }); j++;
    }
  }
  while (i < n) { chunks.push({ type: 'removed', value: aTokens[i++] }); }
  while (j < m) { chunks.push({ type: 'added', value: bTokens[j++] }); }
  return mergeAdjacent(chunks);
}

function tokenizeWords(line: string): string[] {
  // Split keeping punctuation as separate tokens for better granularity
  return line.match(/\w+|[^\s\w]+|\s+/g) || [];
}

function mergeAdjacent(chunks: WordDiffChunk[]): WordDiffChunk[] {
  const res: WordDiffChunk[] = [];
  for (const c of chunks) {
    const prev = res[res.length - 1];
    if (prev && prev.type === c.type && /\s+$/.test(prev.value) === /\s+$/.test(c.value)) {
      prev.value += c.value;
    } else {
      res.push({ ...c });
    }
  }
  return res;
}

export interface WordDecorationSegment {
  lineNumber: number;
  startColumn: number;
  endColumn: number;
  type: 'added' | 'removed';
}

export function computeWordSegments(oldLine: string, newLine: string, lineNumber: number): WordDecorationSegment[] {
  const wordDiff = diffWords(oldLine, newLine);
  let col = 1;
  const segments: WordDecorationSegment[] = [];
  for (const part of wordDiff) {
    const length = part.value.length;
    if (part.type === 'added' || part.type === 'removed') {
      segments.push({ lineNumber, startColumn: col, endColumn: col + length, type: part.type });
    }
    col += length;
  }
  return segments;
}

export function computeWordDiffForModifiedChunks(chunks: LineDiffChunk[]): WordDecorationSegment[] {
  const segments: WordDecorationSegment[] = [];
  for (const c of chunks) {
    if (c.type !== 'modified') continue;
    const max = Math.min(c.oldLines.length, c.newLines.length);
    for (let i = 0; i < max; i++) {
      const oldLine = c.oldLines[i];
      const newLine = c.newLines[i];
      if (oldLine === newLine) continue;
      const lineNumberNew = c.newStart + i; // highlight only on new side
      segments.push(...computeWordSegments(oldLine, newLine, lineNumberNew));
    }
  }
  return segments;
}

// Dual side word diff generation (added tokens on new side, removed tokens on old side)
export interface DualWordSegments {
  orig: WordDecorationSegment[];
  mod: WordDecorationSegment[];
}

function computeDualWordSegments(oldLine: string, newLine: string, oldLineNumber: number, newLineNumber: number): DualWordSegments {
  const diff = diffWords(oldLine, newLine);
  let origCol = 1;
  let modCol = 1;
  const origSegs: WordDecorationSegment[] = [];
  const modSegs: WordDecorationSegment[] = [];
  for (const part of diff) {
    const len = part.value.length;
    switch (part.type) {
      case 'equal':
        origCol += len; modCol += len; break;
      case 'removed':
        origSegs.push({ lineNumber: oldLineNumber, startColumn: origCol, endColumn: origCol + len, type: 'removed' });
        origCol += len; break;
      case 'added':
        modSegs.push({ lineNumber: newLineNumber, startColumn: modCol, endColumn: modCol + len, type: 'added' });
        modCol += len; break;
    }
  }
  return { orig: origSegs, mod: modSegs };
}

export function computeWordDiffForModifiedChunksDual(chunks: LineDiffChunk[]): DualWordSegments {
  const allOrig: WordDecorationSegment[] = [];
  const allMod: WordDecorationSegment[] = [];
  for (const c of chunks) {
    if (c.type !== 'modified') continue;
    const max = Math.min(c.oldLines.length, c.newLines.length);
    for (let i = 0; i < max; i++) {
      const oldLine = c.oldLines[i];
      const newLine = c.newLines[i];
      if (oldLine === newLine) continue;
      const oldLineNumber = c.oldStart + i;
      const newLineNumber = c.newStart + i;
      const { orig, mod } = computeDualWordSegments(oldLine, newLine, oldLineNumber, newLineNumber);
      allOrig.push(...orig);
      allMod.push(...mod);
    }
  }
  return { orig: allOrig, mod: allMod };
}

export default {
  diffLines,
  diffWords,
  computeWordDiffForModifiedChunks,
  computeWordDiffForModifiedChunksDual,
};
