import { useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
];

export function CodeEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  const handleReview = () => {
    setIsReviewing(true);
    console.log("Reviewing code:", code);
    setTimeout(() => {
      setIsReviewing(false);
      setHasReview(true);
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-48" data-testid="select-language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".js,.py,.ts,.tsx,.jsx,.c,.cpp,.php"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="gap-2"
            data-testid="button-upload-file"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <Button
            onClick={handleReview}
            disabled={!code || isReviewing}
            className="gap-2"
            data-testid="button-submit-review"
          >
            <Sparkles className="h-4 w-4" />
            {isReviewing ? "Reviewing..." : "Submit for Review"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here or upload a file..."
            className="w-full h-96 p-4 bg-muted/30 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="textarea-code-input"
          />
        </CardContent>
      </Card>

      {hasReview && (
        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="fixed" data-testid="tab-fixed-code">Fixed Code</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-medium mb-1">Use const instead of let</h4>
                  <p className="text-sm text-muted-foreground">
                    Variable is never reassigned, consider using const for immutability.
                  </p>
                  <Badge className="mt-2" variant="secondary">Line 12</Badge>
                </div>
                <div className="border-l-4 border-chart-3 pl-4 py-2">
                  <h4 className="font-medium mb-1">Optimize loop performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Consider using Array.map() for better readability and performance.
                  </p>
                  <Badge className="mt-2" variant="secondary">Line 24</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fixed Code</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted/30 rounded-md overflow-x-auto">
                  <code className="text-sm font-mono">{`const greeting = "Hello World";\n\nconst items = data.map(item => {\n  return item.value * 2;\n});`}</code>
                </pre>
                <Button className="mt-4" variant="outline" data-testid="button-copy-fixed-code">
                  Copy Fixed Code
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-destructive pl-4 py-2">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Badge variant="destructive">High</Badge>
                    SQL Injection vulnerability
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    User input is directly concatenated into SQL query. Use parameterized queries.
                  </p>
                  <Badge className="mt-2" variant="secondary">Line 45</Badge>
                </div>
                <div className="border-l-4 border-chart-4 pl-4 py-2">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="border-chart-4 text-chart-4">Medium</Badge>
                    XSS vulnerability
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Unsanitized user input rendered in DOM. Apply input sanitization.
                  </p>
                  <Badge className="mt-2" variant="secondary">Line 67</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
