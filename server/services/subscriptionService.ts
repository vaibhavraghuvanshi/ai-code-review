import { db } from "../db";
import { eq, and, lt, or } from "drizzle-orm";
import { subscriptions, plans } from "@shared/schema";
import { addDays } from "date-fns";

// Helper: append an audit entry to a subscription inside a tx or the root db
async function appendAudit(
  client: any,
  subId: number,
  entry: { action: string; by?: string | null; changes?: Record<string, unknown> | null }
) {
  const now = new Date();
  const [existing] = await client
    .select({ auditLog: subscriptions.auditLog })
    .from(subscriptions)
    .where(eq(subscriptions.id, subId))
    .limit(1);

  const currentLog: any[] = Array.isArray(existing?.auditLog) ? (existing!.auditLog as any[]) : [];
  const next = [...currentLog, { action: entry.action, at: now.toISOString(), ...(entry.by ? { by: entry.by } : {}), ...(entry.changes ? { changes: entry.changes } : {}) }];

  // Be lenient about updatedAt not existing in older DBs
  await client
    .update(subscriptions)
    .set({ auditLog: next })
    .where(eq(subscriptions.id, subId));
}

// 1) Create subscription (change-plan safe): cancel active/trial then create new (transaction)
export async function createSubscription(data: {
  userId: string;
  planId: number;
  paymentMethod?: string;
  isTrial?: boolean;
}) {
  const planDurationDays = 30;
  const trialDurationDays = 7;

  const now = new Date();
  const endDate = addDays(now, data.isTrial ? trialDurationDays : planDurationDays);

  const trialEndsAt = data.isTrial ? addDays(now, trialDurationDays) : null;

  return await db.transaction(async (tx) => {
    // Cancel existing active/trial subs to avoid overlaps
    const existing = await tx
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, data.userId),
          or(eq(subscriptions.status, "active"), eq(subscriptions.status, "trial"))
        )
      );

    for (const sub of existing) {
      const [updated] = await tx
        .update(subscriptions)
        .set({
          status: "canceled",
          isAutoRenew: false,
          endDate: now,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id))
        .returning();

      await appendAudit(tx, updated.id, {
        action: "auto_cancel_on_change_plan",
        changes: { previousPlanId: sub.planId },
      });
    }

    // Create new subscription
    const [created] = await tx
      .insert(subscriptions)
      .values({
        userId: data.userId,
        planId: data.planId,
        status: data.isTrial ? "trial" : "active",
        startDate: now,
        endDate,
        trialEndsAt,
        paymentMethod: data.paymentMethod ?? (data.isTrial ? "trial" : "free"),
        paymentStatus: data.isTrial ? "paid" : "paid",
        isAutoRenew: !data.isTrial,
        auditLog: [],
      })
      .returning();

    await appendAudit(tx, created.id, {
      action: "created",
      changes: { planId: data.planId, isTrial: !!data.isTrial },
    });

    return created;
  });
}

// 2) Renew subscriptions automatically (unchanged)
export async function renewActiveSubscriptions() {
  const now = new Date();
  const nextDay = addDays(now, 1);
  const expiringSoon = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "active"), lt(subscriptions.endDate, nextDay)));

  for (const sub of expiringSoon) {
    if (!sub.isAutoRenew) {
      continue;
    }
  const newEndDate = addDays(sub.endDate ?? now, 30);
    const [updated] = await db
      .update(subscriptions)
      .set({ endDate: newEndDate, renewalDate: now })
      .where(eq(subscriptions.id, sub.id))
      .returning();

    await appendAudit(db, updated.id, {
      action: "auto_renew",
      changes: { endDate: newEndDate.toISOString() },
    });
  }
}

// 3) Expire old subscriptions (unchanged + audit)
export async function expireOldSubscriptions() {
  const now = new Date();
  const expired = await db
    .update(subscriptions)
    .set({ status: "expired" })
    .where(and(eq(subscriptions.status, "active"), lt(subscriptions.endDate, now)))
    .returning();

  for (const sub of expired) {
    await appendAudit(db, sub.id, { action: "expired" });
  }
  return expired;
}

// 4) Trial expiration checker (unchanged + audit)
export async function expireTrials() {
  const now = new Date();

  const expiredTrials = await db
    .update(subscriptions)
    .set({ status: "expired" })
    .where(and(eq(subscriptions.status, "trial"), lt(subscriptions.trialEndsAt, now)))
    .returning();

  for (const sub of expiredTrials) {
    await appendAudit(db, sub.id, { action: "trial_expired" });
  }
}

// Helper: list user subs
export async function getUserSubscriptions(userId: string) {
  return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
}

// 5) Get available plans
export async function getPlans() {
  return await db.select().from(plans);
}

// 6) Update auto-renew with audit
export async function updateSubscriptionAutoRenew(id: number, isAutoRenew: boolean) {
  const now = new Date();
  const [updated] = await db
    .update(subscriptions)
    .set({ isAutoRenew })
    .where(eq(subscriptions.id, id))
    .returning();

  if (updated) {
    await appendAudit(db, updated.id, { action: "toggle_auto_renew", changes: { isAutoRenew } });
  }
  return updated;
}

// 7) Cancel with audit
export async function cancelSubscription(id: number) {
  const now = new Date();
  const [updated] = await db
    .update(subscriptions)
    .set({ status: "canceled", isAutoRenew: false, endDate: now })
    .where(eq(subscriptions.id, id))
    .returning();

  if (updated) {
    await appendAudit(db, updated.id, { action: "cancel" });
  }
  return updated;
}

// 8) Admin update: status/endDate with audit
export async function adminUpdateSubscription(id: number, data: { status?: "active" | "canceled" | "expired" | "trial"; endDate?: Date | null }) {
  const patch: Partial<Pick<typeof subscriptions.$inferInsert, "status" | "endDate">> = {};
  if (typeof data.status === "string") patch.status = data.status;
  if (typeof data.endDate !== "undefined") patch.endDate = data.endDate;

  const [updated] = await db.update(subscriptions).set(patch).where(eq(subscriptions.id, id)).returning();
  if (updated) {
    await appendAudit(db, updated.id, {
      action: "admin_update",
      changes: {
        ...(typeof data.status === "string" ? { status: data.status } : {}),
        ...(typeof data.endDate !== "undefined" ? { endDate: data.endDate ? data.endDate.toISOString() : null } : {}),
      },
    });
  }
  return updated;
}
