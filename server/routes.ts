import express, { Request, Response, type Express } from 'express';
import { storage } from './storage';
import { createServer, type Server } from 'http';
import { z } from 'zod';
import {
  createSubscription,
  getUserSubscriptions,
  getPlans,
  updateSubscriptionAutoRenew,
  cancelSubscription,
  adminUpdateSubscription,
} from './services/subscriptionService';
import { reviewCodeWithGroq } from './services/aiService';
import type { AiIssue } from './services/aiService';

const router = express.Router();

/**
 * USERS ROUTES
 */

// Create a new user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' });
    }

    const user = await storage.createUser({ username, email });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New: Create a subscription
router.post('/subscriptions', async (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string().uuid(),
    planId: z.number().int().positive(),
    isTrial: z.boolean().optional(),
    paymentMethod: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }

  try {
    const subscription = await createSubscription(parsed.data);
    res.status(201).json(subscription);
  } catch (err: any) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New: Get subscriptions for a user
router.get('/users/:id/subscriptions', async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const subs = await getUserSubscriptions(userId);
    res.json(subs);
  } catch (err: any) {
    console.error('Error fetching user subscriptions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Plans listing
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await getPlans();
    res.json(plans);
  } catch (err: any) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription (toggle auto-renew or cancel)
router.patch('/subscriptions/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid subscription id' });
  }

  try {
    const action = req.body?.action as string | undefined;
    if (action === 'cancel') {
      const updated = await cancelSubscription(id);
      if (!updated) return res.status(404).json({ error: 'Subscription not found' });
      return res.json(updated);
    }

    if (typeof req.body?.isAutoRenew === 'boolean') {
      const updated = await updateSubscriptionAutoRenew(id, Boolean(req.body.isAutoRenew));
      if (!updated) return res.status(404).json({ error: 'Subscription not found' });
      return res.json(updated);
    }

    return res.status(400).json({ error: 'Specify action=cancel or isAutoRenew:boolean' });
  } catch (err: any) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin update endpoint (optional)
router.patch('/subscriptions/:id/admin', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid subscription id' });
  }
  const schema = z.object({
    status: z.enum(['active', 'canceled', 'expired', 'trial']).optional(),
    endDate: z
      .union([
        z
          .string()
          .datetime()
          .transform((s) => new Date(s)),
        z.null(),
      ])
      .optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
  try {
    const updated = await adminUpdateSubscription(id, parsed.data);
    if (!updated) return res.status(404).json({ error: 'Subscription not found' });
    res.json(updated);
  } catch (err: any) {
    console.error('Error admin-updating subscription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by username
router.get('/users/username/:username', async (req: Request, res: Response) => {
  try {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * REVIEWS ROUTES
 */

// Create a new review
router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const { userId, code, language, reviewText, status } = req.body;
    if (!userId || !code || !language) {
      return res.status(400).json({ error: 'userId, code and language are required' });
    }

    const review = await storage.createReview({
      userId,
      code,
      language,
      reviewText: reviewText || '',
      status: status || 'pending',
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all reviews
router.get('/reviews', async (_req: Request, res: Response) => {
  try {
    const reviews = await storage.getAllReviews();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get review by ID
router.get('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const review = await storage.getReviewById(Number(req.params.id));
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all reviews by a user
router.get('/users/:id/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await storage.getReviewsByUser(req.params.id);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * AI CODE REVIEW ROUTE
 */
// router.post("/ai/review", async (req: Request, res: Response) => {
//   try {
//     const { code, language, userId, persist } = req.body || {};
//     if (!code || typeof code !== "string") {
//       return res.status(400).json({ error: "code is required" });
//     }
//     const lang = typeof language === "string" ? language : "javascript";
//     const result = await reviewCodeWithGroq({ code, language: lang });

//     const shouldPersist = persist !== false; // default true
//     let reviewId: number | undefined;
//     if (shouldPersist) {
//       try {
//         const iss = Array.isArray(result.issues) ? result.issues : [];
//         const suggestions = iss.map((i: AiIssue) => `- ${i.message}`).join("\n");
//         const created = await storage.createReview({
//           userId: userId || null,
//           language: lang,
//           code,
//           reviewText: result.summary,
//           fixedCode: result.fixedCode,
//           suggestions,
//           // legacy fields left untouched: securityWarnings
//           issues: iss as any,
//           aiRaw: result.raw as any,
//           model: result.model,
//           temperature: result.temperature as any,
//           tokens: (result.tokens ?? null) as any,
//           cost: (result.cost ?? null) as any,
//           status: "completed",
//           completedAt: new Date(),
//         } as any);
//         reviewId = created.id as any;
//       } catch (e) {
//         console.error("Persist review failed:", e);
//       }
//     }

//     res.json({ reviewId, ...result });
//   } catch (error: any) {
//     console.error("AI review error:", error);
//     const status = error?.status || 500;
//     res.status(status).json({
//       error: error?.message || "AI review failed",
//       attemptedModels: error?.attemptedModels || undefined,
//     });
//   }
// });

router.post('/ai/review', async (req: Request, res: Response) => {
  try {
    const { code, language, persist } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required' });
    }
    const lang = typeof language === 'string' ? language : 'javascript';

    // Normalize user id from both userId and user_id
    const rawUserId =
      typeof req.body?.userId === 'string'
        ? req.body.userId
        : typeof req.body?.user_id === 'string'
          ? req.body.user_id
          : undefined;

    // Basic UUID v4 format check; if invalid, treat as undefined
    const userId =
      typeof rawUserId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawUserId)
        ? rawUserId
        : undefined;

    const result = await reviewCodeWithGroq({ code, language: lang });

    const shouldPersist = persist !== false; // default true
    let reviewId: number | undefined;
    if (shouldPersist) {
      try {
        const iss = Array.isArray(result.issues) ? result.issues : [];
        const suggestions = iss.map((i: AiIssue) => `- ${i.message}`).join('\n');
        const created = await storage.createReview({
          userId: userId || null,
          language: lang,
          code,
          reviewText: result.summary,
          fixedCode: result.fixedCode,
          suggestions,
          issues: iss as any,
          aiRaw: result.raw as any,
          model: result.model,
          temperature: result.temperature as any,
          tokens: (result.tokens ?? null) as any,
          cost: (result.cost ?? null) as any,
          status: 'completed',
          completedAt: new Date(),
        } as any);
        reviewId = created.id as any;
      } catch (e) {
        console.error('Persist review failed:', e);
      }
    }

    res.json({ reviewId, ...result });
  } catch (error: any) {
    console.error('AI review error:', error);
    const status = error?.status || 500;
    res.status(status).json({
      error: error?.message || 'AI review failed',
      attemptedModels: error?.attemptedModels || undefined,
    });
  }
});
// ...existing code...

// Simple in-memory rate limiting middleware for AI routes (per IP)
const aiRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxPerMinute = 30) {
  return (req: Request, res: Response, next: any) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    const bucket = aiRateLimitMap.get(ip);
    if (!bucket || bucket.resetAt < now) {
      aiRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    if (bucket.count >= maxPerMinute) {
      const retryIn = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ error: `Rate limit exceeded. Try again in ${retryIn}s.` });
    }
    bucket.count += 1;
    return next();
  };
}

// Async review queue (in-memory minimal demo)
type Job = {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
};
const jobs = new Map<string, Job>();
const queue: Array<{
  jobId: string;
  payload: { code: string; language: string; userId?: string; persist?: boolean };
}> = [];
let working = false;
async function processQueue() {
  if (working) return;
  working = true;
  while (queue.length) {
    const item = queue.shift()!;
    const job = jobs.get(item.jobId);
    if (!job) continue;
    job.status = 'processing';
    try {
      const { code, language, userId, persist } = item.payload;
      const result = await reviewCodeWithGroq({ code, language });
      // persist if needed
      if (persist !== false) {
        try {
          await storage.createReview({
            userId: userId || null,
            language,
            code,
            reviewText: result.summary,
            fixedCode: result.fixedCode,
            suggestions: (Array.isArray(result.issues) ? result.issues : [])
              .map((i: any) => `- ${i.message}`)
              .join('\n'),
            issues: result.issues as any,
            aiRaw: result.raw as any,
            model: result.model,
            temperature: result.temperature as any,
            tokens: (result.tokens ?? null) as any,
            cost: (result.cost ?? null) as any,
            status: 'completed',
            completedAt: new Date(),
          } as any);
        } catch (e) {
          console.error('Persist review (async) failed:', e);
        }
      }
      job.status = 'completed';
      job.result = result;
    } catch (err: any) {
      job.status = 'failed';
      job.error = err?.message || String(err);
    }
  }
  working = false;
}

router.post('/ai/review/async', rateLimit(20), async (req: Request, res: Response) => {
  const { code, language, userId, persist } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(jobId, { id: jobId, status: 'queued' });
  queue.push({
    jobId,
    payload: {
      code,
      language: typeof language === 'string' ? language : 'javascript',
      userId,
      persist,
    },
  });
  // process soon
  setTimeout(processQueue, 10);
  res.status(202).json({ jobId, status: 'queued' });
});

router.get('/ai/review/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(job);
});

// Reviews CRUD (basic)
router.get('/reviews', async (_req: Request, res: Response) => {
  try {
    const data = await storage.getAllReviews();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const review = await storage.getReviewById(Number(req.params.id));
    if (!review) return res.status(404).json({ error: 'Not found' });
    res.json(review);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

router.delete('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
    const ok = await storage.deleteReview(id);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * Mount routes on the provided Express app and return an http.Server instance.
 * index.ts expects to call `const server = await registerRoutes(app);`
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the router under /api so client calls to /api/* reach these handlers
  app.use('/api', router);

  // Create and return a Node http.Server without listening. The caller
  // (server/index.ts) will call server.listen(...) when ready.
  const server = createServer(app);
  return server;
}

export default router;
