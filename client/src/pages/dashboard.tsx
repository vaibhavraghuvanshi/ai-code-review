import { CodeEditor } from "@/components/code-editor";
import { DashboardStats } from "@/components/dashboard-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Submit your code for AI-powered review and get instant insights.
        </p>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor" data-testid="tab-editor">Code Editor</TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-6">
          <CodeEditor />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <DashboardStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
