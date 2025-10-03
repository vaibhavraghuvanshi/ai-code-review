import { useState } from "react";
import { Settings2, User, Bell, Palette, Shield, Plug } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useTheme } from "./theme-provider";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState("english");

  const handleSaveChanges = () => {
    console.log("Settings saved:", {
      theme,
      emailNotifications,
      autoSave,
      defaultLanguage,
    });
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
        <TabsList>
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

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Choose your preferred visual theme for the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Account settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Appearance settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect with external services and tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Integration settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your security and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security settings coming soon...</p>
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
