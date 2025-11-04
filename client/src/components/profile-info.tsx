import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { ManageSubscription } from "./manage-subscription";
import { toast } from "@/hooks/use-toast";

const usageData = [
  { month: "Jan", tokens: 200000 },
  { month: "Feb", tokens: 250000 },
  { month: "Mar", tokens: 280000 },
  { month: "Apr", tokens: 320000 },
  { month: "May", tokens: 350000 },
  { month: "Jun", tokens: 300000 },
  { month: "Jul", tokens: 280000 },
  { month: "Aug", tokens: 310000 },
  { month: "Sep", tokens: 330000 },
  { month: "Oct", tokens: 290000 },
  { month: "Nov", tokens: 310000 },
  { month: "Dec", tokens: 320000 },
];

export function ProfileInfo() {
  const [openManage, setOpenManage] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; username: string; email: string; createdAt?: string | Date } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function reloadProfileData(uId?: string) {
    const id = uId ?? userId;
    if (!id) return;
    try {
      const [resPlans, resSubs, resUser, resReviews] = await Promise.allSettled([
        apiRequest("GET", "/api/plans"),
        apiRequest("GET", `/api/users/${id}/subscriptions`),
        apiRequest("GET", `/api/users/${id}`),
        apiRequest("GET", `/api/users/${id}/reviews`),
      ]);

      if (resPlans.status === "fulfilled") {
        const planItems = await resPlans.value.json();
        setPlans(Array.isArray(planItems) ? planItems : []);
      }
      if (resSubs.status === "fulfilled") {
        const list = await resSubs.value.json();
        setSubs(Array.isArray(list) ? list : []);
      }
      if (resUser.status === "fulfilled") {
        const usr = await resUser.value.json();
        setUser(usr);
      }
      if (resReviews.status === "fulfilled") {
        const list = await resReviews.value.json();
        setReviews(Array.isArray(list) ? list : []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem("currentUser");
        if (!raw) throw new Error("Not signed in");
        const u = JSON.parse(raw);
        if (!u?.id) throw new Error("Invalid session");
        if (!mounted) return;
        setUserId(u.id as string);

        // User
        try {
          const resUser = await apiRequest("GET", `/api/users/${u.id}`);
          const usr = await resUser.json();
          if (mounted) setUser(usr);
        } catch {}

        // Plans
        try {
          const resPlans = await apiRequest("GET", "/api/plans");
          const planItems = await resPlans.json();
          if (mounted) setPlans(Array.isArray(planItems) ? planItems : []);
        } catch {}

        // Subscriptions
        try {
          const resSubs = await apiRequest("GET", `/api/users/${u.id}/subscriptions`);
          const list = await resSubs.json();
          if (mounted) setSubs(Array.isArray(list) ? list : []);
        } catch {}

        // Reviews by user
        try {
          const resReviews = await apiRequest("GET", `/api/users/${u.id}/reviews`);
          const list = await resReviews.json();
          if (mounted) setReviews(Array.isArray(list) ? list : []);
        } catch {}
      } catch (err: any) {
        toast({ title: "Please sign in", description: err?.message ?? "No session", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeSub = useMemo(() => subs.find((s) => s && (s.status === "active" || s.status === "trial")) ?? null, [subs]);
  const currentPlan = useMemo(() => (activeSub?.planId ? plans.find((p) => p.id === activeSub.planId) : null), [activeSub, plans]);

  const avatarFallback = useMemo(() => {
    const name = user?.username || user?.email || "User";
    const parts = String(name).split(/[\s@._-]+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts.length > 1 ? parts[1]?.[0] ?? "" : "";
    return `${a}${b}`.toUpperCase();
  }, [user?.username, user?.email]);

  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold" data-testid="text-user-name">{user?.username ?? "—"}</h3>
              <p className="text-muted-foreground" data-testid="text-user-email">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Plan</span>
              <Badge data-testid="badge-plan">{currentPlan?.name ?? "Free"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Reviews</span>
              <span className="text-sm font-medium">{totalReviews}</span>
            </div>
          </div>

          <div>
            <Button variant="outline" data-testid="button-manage-subscription" onClick={() => setOpenManage(true)}>
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Token Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="tokens" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <ManageSubscription
        open={openManage}
        onOpenChange={setOpenManage}
        onChanged={() => {
          // Refresh profile data and ensure dialog is closed
          reloadProfileData();
          setOpenManage(false);
        }}
      />
    </div>
  );
}
