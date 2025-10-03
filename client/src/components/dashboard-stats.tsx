import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertTriangle, FileWarning } from "lucide-react";

const reviewData = [
  { month: "Jan", completed: 180, pending: 45 },
  { month: "Feb", completed: 210, pending: 38 },
  { month: "Mar", completed: 190, pending: 42 },
  { month: "Apr", completed: 220, pending: 35 },
  { month: "May", completed: 230, pending: 28 },
  { month: "Jun", completed: 240, pending: 32 },
];

const alerts = [
  {
    id: 1,
    type: "High-Complexity Function Detected",
    description: "The 'calculateMetrics' function exceeds cyclomatic complexity limits. Consider refactoring for maintainability.",
    severity: "warning",
    action: "View Details",
  },
  {
    id: 2,
    type: "Outdated Dependency Alert",
    description: "The 'lodash' package is running an older version with known vulnerabilities. Upgrade to the latest stable release.",
    severity: "error",
    action: "Resolve Issue",
  },
];

export function DashboardStats() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
          <p className="text-sm text-muted-foreground">
            Completed vs. Pending Reviews over the last 6 months.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewData}>
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
                <Legend />
                <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" />
                <Bar dataKey="pending" fill="hsl(var(--chart-2))" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.severity === "error"
                  ? "border-l-destructive bg-destructive/5"
                  : "border-l-chart-4 bg-chart-4/5"
              }`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.severity === "error" ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileWarning className="h-5 w-5 text-chart-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{alert.type}</h4>
                    <Badge variant={alert.severity === "error" ? "destructive" : "outline"}>
                      {alert.severity === "error" ? "High" : "Medium"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {alert.description}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-alert-${alert.id}`}
                  >
                    {alert.action}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
