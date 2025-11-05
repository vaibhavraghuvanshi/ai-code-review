import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import router from '../routes';

const runIfDb = !!process.env.DATABASE_URL;
const itIf = runIfDb ? it : it.skip;
const describeIf = runIfDb ? describe : describe.skip;

function appFactory() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

describeIf('Subscriptions API', () => {
  const app = appFactory();
  let userId: string;
  let planIdA: number | undefined;
  let planIdB: number | undefined;

  itIf('lists plans', async () => {
    const res = await request(app).get('/api/plans').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      planIdA = res.body[0]?.id;
      planIdB = res.body[1]?.id ?? res.body[0]?.id;
    }
  });

  itIf('creates a user', async () => {
    const uname = `user_${Math.random().toString(16).slice(2, 8)}`;
    const res = await request(app)
      .post('/api/users')
      .send({ username: uname, email: `${uname}@example.com` })
      .expect(201);
    expect(res.body?.id).toBeTruthy();
    userId = res.body.id;
  });

  itIf('creates subscription and cancels previous on change plan (transactional)', async () => {
    if (!planIdA || !planIdB) {
      console.warn('Skipping change-plan test: need at least one plan seeded.');
      return;
    }
    // First subscription
    const r1 = await request(app)
      .post('/api/subscriptions')
      .send({ userId, planId: planIdA })
      .expect(201);
    expect(r1.body?.id).toBeTruthy();

    // Change plan -> should auto-cancel previous and create new
    const r2 = await request(app)
      .post('/api/subscriptions')
      .send({ userId, planId: planIdB })
      .expect(201);
    expect(r2.body?.id).toBeTruthy();

    // Verify states
    const list = await request(app).get(`/api/users/${userId}/subscriptions`).expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    const active = list.body.find((s: any) => s.status === 'active' || s.status === 'trial');
    const canceled = list.body.filter((s: any) => s.status === 'canceled');
    expect(active?.planId).toBe(planIdB);
    expect(canceled.length).toBeGreaterThanOrEqual(1);
  });

  itIf('toggles auto-renew', async () => {
    const list = await request(app).get(`/api/users/${userId}/subscriptions`).expect(200);
    const active = list.body.find((s: any) => s.status === 'active' || s.status === 'trial');
    expect(active).toBeTruthy();

    const toggled = await request(app)
      .patch(`/api/subscriptions/${active.id}`)
      .send({ isAutoRenew: !active.isAutoRenew })
      .expect(200);
    expect(typeof toggled.body.isAutoRenew).toBe('boolean');
  });

  itIf('admin updates status and endDate', async () => {
    const list = await request(app).get(`/api/users/${userId}/subscriptions`).expect(200);
    const active = list.body.find((s: any) => s.status === 'active' || s.status === 'trial');
    expect(active).toBeTruthy();

    const endDate = new Date().toISOString();
    const admin = await request(app)
      .patch(`/api/subscriptions/${active.id}/admin`)
      .send({ status: 'expired', endDate })
      .expect(200);

    expect(admin.body.status).toBe('expired');
    expect(admin.body.endDate).toBeTruthy();
  });
});
