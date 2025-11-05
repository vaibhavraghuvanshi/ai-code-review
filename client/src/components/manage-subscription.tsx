import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Check, RefreshCw, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Switch } from './ui/switch';

export type ManageSubscriptionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void; // notify parent to refresh profile data
};

type Plan = {
  id: number;
  name: string;
  description?: string | null;
  price?: number | string | null;
  currency?: string | null;
  features?: string | string[] | null;
  featured?: boolean | null;
};

type Subscription = {
  id: number;
  userId: string;
  planId: number | null;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  renewalDate?: string | Date | null;
  createdAt?: string | Date | null;
  isAutoRenew?: boolean | null;
};

export function ManageSubscription({ open, onOpenChange, onChanged }: ManageSubscriptionProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) throw new Error('No signed-in user');
        const u = JSON.parse(raw);
        if (!u?.id) throw new Error('Invalid user session');
        if (!mounted) return;
        setUserId(u.id as string);

        // Plans
        try {
          const resPlans = await apiRequest('GET', '/api/plans');
          const planItems = await resPlans.json();
          if (mounted) setPlans(Array.isArray(planItems) ? planItems : []);
        } catch (e: any) {
          console.warn('Failed to fetch plans:', e?.message);
          if (mounted) setPlans([]);
        }

        // Subscriptions
        try {
          const resSubs = await apiRequest('GET', `/api/users/${u.id}/subscriptions`);
          const subsData = await resSubs.json();
          const list = Array.isArray(subsData) ? subsData : [];
          if (mounted) {
            setSubs(list);
            // Preselect current plan if available
            const active = list.find((s) => s && (s.status === 'active' || s.status === 'trial'));
            if (active?.planId) setSelectedPlanId(active.planId);
          }
        } catch (e: any) {
          console.warn('Failed to fetch subscriptions:', e?.message);
          if (mounted) setSubs([]);
        }
      } catch (err: any) {
        toast({
          title: 'Not signed in',
          description: err?.message ?? 'Please sign in',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open]);

  const currentSub = useMemo(() => {
    return subs.find((s) => s && (s.status === 'active' || s.status === 'trial')) ?? null;
  }, [subs]);

  const currentPlan = useMemo(() => {
    if (!currentSub?.planId) return null as Plan | null;
    return plans.find((p) => p.id === currentSub.planId) ?? null;
  }, [currentSub, plans]);

  const currentFeatures: string[] = useMemo(() => {
    const raw = currentPlan?.features;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    try {
      const arr = JSON.parse(String(raw));
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return String(raw)
        .split(/\s*,\s*/)
        .filter(Boolean);
    }
  }, [currentPlan?.features]);

  async function handleChangePlan() {
    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please sign in', variant: 'destructive' });
      return;
    }
    if (!selectedPlanId) {
      toast({
        title: 'Select a plan',
        description: 'Choose a plan to continue',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest('POST', '/api/subscriptions', {
        userId,
        planId: Number(selectedPlanId),
      });
      await res.json();
      toast({
        title: 'Subscription updated',
        description: `You're now on the ${plans.find((p) => p.id === selectedPlanId)?.name ?? 'selected'} plan`,
      });
      // Refresh subs
      try {
        const resSubs = await apiRequest('GET', `/api/users/${userId}/subscriptions`);
        const subsData = await resSubs.json();
        setSubs(Array.isArray(subsData) ? subsData : []);
      } catch {
        // ignore
      }
      // Inform parent and close dialog
      try {
        onChanged && onChanged();
      } catch {}
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message ?? 'Server error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAutoRenew() {
    if (!currentSub) {
      toast({
        title: 'No subscription',
        description: 'You have no active subscription to update.',
        variant: 'destructive',
      });
      return;
    }

    const id = currentSub.id;
    const newVal = !Boolean(currentSub.isAutoRenew);
    setSaving(true);
    try {
      const res = await apiRequest('PATCH', `/api/subscriptions/${id}`, { isAutoRenew: newVal });
      const updated = await res.json();
      setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast({ title: 'Updated', description: `Auto-renew ${newVal ? 'enabled' : 'disabled'}` });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message ?? 'Server error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSubscription() {
    if (!currentSub) {
      toast({
        title: 'No subscription',
        description: 'You have no active subscription to cancel.',
        variant: 'destructive',
      });
      return;
    }
    const id = currentSub.id;
    setSaving(true);
    try {
      const res = await apiRequest('PATCH', `/api/subscriptions/${id}`, { action: 'cancel' });
      const updated = await res.json();
      setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast({ title: 'Canceled', description: 'Subscription canceled' });
      try {
        onChanged && onChanged();
      } catch {}
      // Optional: Close after cancel as well
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Cancel failed',
        description: err?.message ?? 'Server error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function priceLabel(p: Plan) {
    if (typeof p.price === 'number') return `$${p.price.toFixed(2)}`;
    return String(p.price ?? '');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
          <DialogDescription>View your current plan and make changes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {currentSub?.status && (
                  <Badge variant={currentSub.status === 'active' ? 'default' : 'outline'}>
                    {currentSub.status}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading subscription…</div>
              ) : currentPlan ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-semibold">{currentPlan.name}</div>
                    <div className="text-muted-foreground">{priceLabel(currentPlan)}/month</div>
                  </div>
                  {currentPlan.description && (
                    <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                  )}

                  {currentFeatures.length > 0 && (
                    <ul className="space-y-2">
                      {currentFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-chart-2 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelSubscription}
                      data-testid="button-cancel-plan"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No active plan. You’re on the free tier.
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Change Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <span className="text-sm font-medium">Select a plan</span>
                <Select
                  value={selectedPlanId ? String(selectedPlanId) : undefined}
                  onValueChange={(v) => setSelectedPlanId(Number(v))}
                  disabled={loading}
                >
                  <SelectTrigger data-testid="select-change-plan">
                    <SelectValue placeholder={loading ? 'Loading…' : 'Choose a plan'} />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} {priceLabel(p) && `— ${priceLabel(p)}/mo`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleChangePlan}
                  disabled={saving || loading}
                  data-testid="button-update-plan"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating…
                    </>
                  ) : (
                    'Update Plan'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  data-testid="button-cancel-plan"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-renew</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Auto renew</div>
                  <div className="text-xs text-muted-foreground">
                    Toggle to enable or disable automatic renewals
                  </div>
                </div>
                <div>
                  <Switch
                    checked={Boolean(currentSub?.isAutoRenew)}
                    onCheckedChange={() => handleToggleAutoRenew()}
                    disabled={!currentSub || loading || saving}
                    data-testid="switch-auto-renew"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
