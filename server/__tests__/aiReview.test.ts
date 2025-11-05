import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../routes';

// Mock global fetch used in aiService
const mockFetch = vi.fn();
(global as any).fetch = mockFetch as any;

describe('AI Review API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json({ limit: '1mb' }));
    const server = await registerRoutes(app);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 without code', async () => {
    const res = await request(app).post('/api/ai/review').send({});
    expect(res.status).toBe(400);
  });

  it('returns issues and fixedCode on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'ok',
                fixedCode: 'const x=1;',
                issues: [
                  {
                    id: '1',
                    message: 'use const',
                    severity: 'info',
                    startLine: 1,
                    startColumn: 1,
                    endLine: 1,
                    endColumn: 10,
                  },
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    });

    const res = await request(app)
      .post('/api/ai/review')
      .send({ code: 'var x=1;', language: 'javascript', persist: false });
    expect(res.status).toBe(200);
    expect(res.body.fixedCode).toBeDefined();
    expect(Array.isArray(res.body.issues)).toBe(true);
    expect(res.body.tokens).toBe(30);
  });
});
