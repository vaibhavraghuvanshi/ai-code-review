import { useState } from "react";
import { Settings2, User, Bell, Palette, Shield, Plug, Check, X, Github, GitlabIcon as Gitlab, Key, Trash2, ExternalLink } from "lucide-react";
import { SiGithub, SiGitlab } from "react-icons/si";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useTheme } from "./theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState("english");
  
  // Account settings
  const [fullName, setFullName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  
  // Notification settings
  const [reviewComplete, setReviewComplete] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  // Appearance settings
  const [fontSize, setFontSize] = useState("medium");
  const [codeTheme, setCodeTheme] = useState("vs-dark");
  const [compactMode, setCompactMode] = useState(false);
  
  // Integration settings
  const [githubConnected, setGithubConnected] = useState(true);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: "Production API Key", key: "sk_live_••••••••••••4h3j", created: "2024-01-15" },
    { id: 2, name: "Development API Key", key: "sk_test_••••••••••••9k2p", created: "2024-02-20" },
  ]);

  const handleSaveChanges = () => {
    console.log("Settings saved");
  };

  const handleConnectGithub = () => {
    setGithubConnected(!githubConnected);
    console.log("GitHub connection toggled");
  };

  const handleConnectGitlab = () => {
    setGitlabConnected(!gitlabConnected);
    console.log("GitLab connection toggled");
  };

  const handleDeleteApiKey = (id: number) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    console.log("API key deleted:", id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application preferences and account settings.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2" data-testid="tab-account">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2" data-testid="tab-appearance">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2" data-testid="tab-integrations">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Configure your basic application settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Application Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    data-testid="button-theme-light"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    data-testid="button-theme-dark"
                  >
                    Dark
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your code reviews, new features, and important announcements.
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Code Reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your review progress as you type.
                  </p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                  data-testid="switch-auto-save"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger data-testid="select-default-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the primary language for the application interface.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-change-avatar">
                    Change Avatar
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-remove-avatar">
                    Remove
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  data-testid="input-full-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
                <p className="text-sm text-muted-foreground">
                  Your email is used for account recovery and notifications.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button data-testid="button-update-password">Update Password</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium mb-1">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button variant="destructive" data-testid="button-delete-account">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what email notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Review Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your code review is complete.
                  </p>
                </div>
                <Switch
                  checked={reviewComplete}
                  onCheckedChange={setReviewComplete}
                  data-testid="switch-review-complete"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Critical security vulnerabilities found in your code.
                  </p>
                </div>
                <Switch
                  checked={securityAlerts}
                  onCheckedChange={setSecurityAlerts}
                  data-testid="switch-security-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Summary of your activity and reviews from the past week.
                  </p>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                  data-testid="switch-weekly-digest"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    New features, improvements, and platform updates.
                  </p>
                </div>
                <Switch
                  checked={productUpdates}
                  onCheckedChange={setProductUpdates}
                  data-testid="switch-product-updates"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Promotional content, tips, and special offers.
                  </p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                  data-testid="switch-marketing-emails"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Manage browser push notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time notifications in your browser.
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  data-testid="switch-push-notifications"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Customize the visual appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    data-testid="button-appearance-light"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    data-testid="button-appearance-dark"
                  >
                    Dark
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger data-testid="select-font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for a more condensed layout.
                  </p>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                  data-testid="switch-compact-mode"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
              <CardDescription>
                Customize your code editor experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Editor Theme</Label>
                <Select value={codeTheme} onValueChange={setCodeTheme}>
                  <SelectTrigger data-testid="select-code-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vs-dark">VS Dark</SelectItem>
                    <SelectItem value="vs-light">VS Light</SelectItem>
                    <SelectItem value="monokai">Monokai</SelectItem>
                    <SelectItem value="github-dark">GitHub Dark</SelectItem>
                    <SelectItem value="dracula">Dracula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>
                Manage your integrations with external platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <SiGithub className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">GitHub</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect your GitHub repositories for seamless code reviews.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {githubConnected && (
                    <Badge variant="outline" className="gap-1">
                      <Check className="h-3 w-3" />
                      Connected
                    </Badge>
                  )}
                  <Button
                    variant={githubConnected ? "outline" : "default"}
                    onClick={handleConnectGithub}
                    data-testid="button-github-integration"
                  >
                    {githubConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <SiGitlab className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">GitLab</h4>
                    <p className="text-sm text-muted-foreground">
                      Integrate with GitLab for continuous code quality.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {gitlabConnected && (
                    <Badge variant="outline" className="gap-1">
                      <Check className="h-3 w-3" />
                      Connected
                    </Badge>
                  )}
                  <Button
                    variant={gitlabConnected ? "outline" : "default"}
                    onClick={handleConnectGitlab}
                    data-testid="button-gitlab-integration"
                  >
                    {gitlabConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CI/CD Integration</CardTitle>
              <CardDescription>
                Automate code reviews in your deployment pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Integrate AI Code Review with your CI/CD workflow for automated code quality checks.
              </p>
              <Button variant="outline" className="gap-2" data-testid="button-view-docs">
                View Documentation
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Secure your account with two-factor authentication.
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                  data-testid="switch-2fa"
                />
              </div>
              {twoFactorEnabled && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm mb-3">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="h-32 w-32 bg-card border rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">QR Code</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">{apiKey.key}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created on {apiKey.created}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                    data-testid={`button-delete-api-key-${apiKey.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" data-testid="button-create-api-key">
                Create New API Key
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Monitor and manage your active login sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">Chrome on MacOS</h4>
                    <Badge variant="outline">Current</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last active: Just now • San Francisco, CA
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Firefox on Windows</h4>
                  <p className="text-sm text-muted-foreground">
                    Last active: 2 hours ago • New York, NY
                  </p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-revoke-session">
                  Revoke
                </Button>
              </div>
              <Button variant="outline" className="w-full" data-testid="button-revoke-all-sessions">
                Revoke All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" data-testid="button-cancel-settings">Cancel</Button>
        <Button onClick={handleSaveChanges} data-testid="button-save-settings">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
