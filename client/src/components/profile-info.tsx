import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold" data-testid="text-user-name">John Doe</h3>
              <p className="text-muted-foreground" data-testid="text-user-email">john.doe@example.com</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Plan</span>
              <Badge data-testid="badge-plan">Pro Plan</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm">January 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Reviews</span>
              <span className="text-sm font-medium">247</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Pro Plan</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Unlock advanced AI features, higher review limits, and priority support.
            </p>
            <ul className="space-y-2 text-sm mb-6">
              <li>• Unlimited Code Reviews</li>
              <li>• Advanced AI Suggestions</li>
              <li>• Cross-language Support</li>
              <li>• Dedicated Customer Support</li>
              <li>• Early Access to New Features</li>
              <li>• 5,000,000 AI Tokens/month</li>
            </ul>
            <Button variant="outline" data-testid="button-manage-subscription">
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
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
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
    </div>
  );
}
