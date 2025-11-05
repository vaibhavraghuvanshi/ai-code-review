import React, { useEffect, useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
};

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const defaultPlans: Plan[] = [
    {
      id: 1,
      name: 'Free',
      description: 'Perfect for trying out AI code reviews',
      price: 0,
      currency: 'USD',
      features: [
        'Basic code analysis',
        'Up to 5 reviews/month',
        'Community support',
        'Limited AI suggestions',
      ],
      featured: false,
    },
    {
      id: 2,
      name: 'Pro',
      description: 'Unlock advanced AI features, higher review limits, and priority support.',
      price: 29,
      currency: 'USD',
      features: [
        'Advanced code analysis',
        'Unlimited reviews',
        'Priority email support',
        'Intelligent AI suggestions',
        'CI/CD integration',
        'Detailed reporting',
      ],
      featured: true,
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'Custom AI models and dedicated support for large teams.',
      price: 'Custom',
      currency: 'USD',
      features: [
        'All Pro features',
        'Dedicated account manager',
        'On-premise deployment',
        'Custom AI models',
        'Advanced security features',
        'SLA agreements',
      ],
      featured: false,
    },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem('currentUser');
        if (raw) {
          try {
            const u = JSON.parse(raw);
            if (u?.id) setUserId(u.id);
          } catch {}
        }

        const resPlans = await apiRequest('GET', '/api/plans');
        const planItems = await resPlans.json();
        const serverPlans = Array.isArray(planItems) ? (planItems as Plan[]) : [];
        if (mounted) setPlans(serverPlans.length > 0 ? serverPlans : defaultPlans);

        if (userId || (raw && JSON.parse(raw)?.id)) {
          const uid = userId ?? JSON.parse(raw!).id;
          const resSubs = await apiRequest('GET', `/api/users/${uid}/subscriptions`);
          const subsData = await resSubs.json();
          if (mounted) setSubs(Array.isArray(subsData) ? subsData : []);
        }
      } catch (e: any) {
        console.warn('Failed to load plans:', e?.message);
        if (mounted) setPlans(defaultPlans);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const currentPlanId = useMemo(() => {
    const active = subs.find((s) => s && (s.status === 'active' || s.status === 'trial'));
    return active?.planId ?? null;
  }, [subs]);

  function planPriceLabel(p: Plan) {
    if (typeof p.price === 'number') return `$${p.price.toFixed(2)}`;
    if (p.price == null) return '';
    return String(p.price);
  }

  function planFeatures(p: Plan): string[] {
    const raw = p.features;
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
  }

  async function handleSubscribe(planId: number, planName: string) {
    if (!userId) {
      toast({
        title: 'Please sign in',
        description: 'Log in to subscribe to a plan',
        variant: 'destructive',
      });
      return;
    }
    if (currentPlanId === planId) {
      toast({ title: 'Already on this plan', description: `You're already on ${planName}` });
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest('POST', '/api/subscriptions', { userId, planId });
      await res.json();
      toast({ title: 'Subscription updated', description: `You're now on ${planName}` });
      // Refresh subs
      try {
        const resSubs = await apiRequest('GET', `/api/users/${userId}/subscriptions`);
        const subsData = await resSubs.json();
        setSubs(Array.isArray(subsData) ? subsData : []);
      } catch {}
    } catch (err: any) {
      toast({
        title: 'Subscribe failed',
        description: err?.message ?? 'Server error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Choose Your Perfect Plan</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Find the right subscription tier for your code review needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {!loading && plans.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground">
            No plans available. Please try again later.
          </div>
        )}
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const features = planFeatures(plan);
          return (
            <Card
              key={plan.id}
              className={`relative hover-elevate transition-all duration-200 flex flex-col ${
                plan.featured ? 'border-2 border-primary shadow-lg' : ''
              }`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              <CardHeader className="pb-8 pt-6">
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{planPriceLabel(plan)}</span>
                  <span className="text-muted-foreground">{plan.price ? '/month' : ''}</span>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  variant={isCurrent ? 'secondary' : 'default'}
                  className="w-full"
                  data-testid={`button-${plan.name.toLowerCase()}-plan`}
                  disabled={saving || (isCurrent && !!userId)}
                  onClick={() => handleSubscribe(plan.id, plan.name)}
                >
                  {isCurrent ? 'Current Plan' : userId ? 'Choose Plan' : 'Sign in to Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-12">
        <CardHeader>
          <h3 className="text-2xl font-semibold">Frequently Asked Questions</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Can I switch plans at any time?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect
              immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards. Enterprise plans can be invoiced.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-muted-foreground">
              We offer a 30-day money-back guarantee for all paid plans.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
