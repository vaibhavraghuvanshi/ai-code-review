import { useState, useEffect } from 'react';
import {
  Settings2,
  User,
} from 'lucide-react';
// Removed integrations & other icons due to tab reduction
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { i18nTranslate } from '@/i18n';
import { useTheme } from './theme-provider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    try { const raw = localStorage.getItem('pref:emailNotifications'); return raw ? raw === 'true' : true; } catch { return true; }
  }); // Email notifications left for future implementation (UI only)
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('pref:autoSave');
      return raw ? raw === 'true' : true;
    } catch { return true; }
  });
  const [defaultLanguage, setDefaultLanguage] = useState<string>(() => {
    try { return localStorage.getItem('pref:language') || 'english'; } catch { return 'english'; }
  });
  const [locale, setLocale] = useState<'english'|'spanish'|'german'>(() => {
    const l = localStorage.getItem('pref:locale');
    if (l === 'spanish' || l === 'german') return l;
    return 'english';
  });
  const t = (key: string) => i18nTranslate(key, locale);

  // Account settings
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Removed notification settings (out of scope per request)

  // Removed other tab states

  const handleSaveChanges = () => {
    console.log('Settings saved');
  };

  useEffect(() => {
    // Persist prefs
    try { localStorage.setItem('pref:autoSave', String(autoSave)); } catch {}
  }, [autoSave]);
  useEffect(() => {
    try { localStorage.setItem('pref:language', defaultLanguage); } catch {}
  }, [defaultLanguage]);
  useEffect(() => {
    try { localStorage.setItem('pref:locale', locale); } catch {}
  }, [locale]);
  useEffect(() => {
    try { localStorage.setItem('pref:emailNotifications', String(emailNotifications)); } catch {}
  }, [emailNotifications]);

  useEffect(() => {
    // Fetch user details from localStorage currentUser -> id -> /api/users/:id
    let cancelled = false;
    async function fetchUser() {
      setLoadingUser(true); setUserError(null);
      try {
        const raw = localStorage.getItem('currentUser');
        const obj = raw ? JSON.parse(raw) : null;
        const userId = obj?.id;
        if (!userId) { setUserError('No user logged in'); return; }
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setFullName(data?.username || '');
        setEmail(data?.email || '');
      } catch (e: any) {
        if (!cancelled) setUserError(e?.message || 'Failed to load user');
      } finally { if (!cancelled) setLoadingUser(false); }
    }
    fetchUser();
    return () => { cancelled = true; };
  }, []);

  function handleDeleteAccount() {
    // Placeholder: just clear local user and show toast/log. Real deletion would call backend.
    try { localStorage.removeItem('currentUser'); } catch {}
    console.log('Account deleted (placeholder)');
    setShowDeleteConfirm(false);
  }

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
            {t('general')}
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2" data-testid="tab-account">
            <User className="h-4 w-4" />
            {t('account')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('generalPreferences')}</CardTitle>
              <CardDescription>{t('generalPreferencesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label>{t('applicationTheme')}</Label>
                <div className="flex gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    data-testid="button-theme-light"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    data-testid="button-theme-dark"
                  >
                    Dark
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('emailNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('autoSaveReviews')}</Label>
                  <p className="text-sm text-muted-foreground">{t('autoSaveReviewsDesc')}</p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                  data-testid="switch-auto-save"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t('defaultLanguage')}</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger data-testid="select-default-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="german">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">{t('defaultLanguageDesc')}</p>
                <div className="space-y-1">
                  <Label>{t('interfaceLocale')}</Label>
                  <Select value={locale} onValueChange={(v:any)=> setLocale(v)}>
                    <SelectTrigger data-testid="select-locale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Español</SelectItem>
                      <SelectItem value="german">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileInformation')}</CardTitle>
              <CardDescription>{t('profileInformationDesc')}</CardDescription>
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
                <Label htmlFor="full-name">{t('fullName')}</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  data-testid="input-full-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
                <p className="text-sm text-muted-foreground">{t('emailUsage')}</p>
                {loadingUser && <p className="text-xs text-muted-foreground">{t('loadingUser')}</p>}
                {userError && <p className="text-xs text-destructive">{userError}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('password')}</CardTitle>
              <CardDescription>{t('passwordDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('currentPassword')}</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">{t('newPassword')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('confirmNewPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button data-testid="button-update-password">{t('updatePassword')}</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
              <CardDescription>{t('dangerZoneDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium mb-1">{t('deleteAccount')}</h4>
                  <p className="text-sm text-muted-foreground">{t('deleteAccountDesc')}</p>
                </div>
                <Button variant="destructive" data-testid="button-delete-account" onClick={()=> setShowDeleteConfirm(true)}>
                  {t('deleteAccount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" data-testid="button-cancel-settings">
          {t('cancel')}
        </Button>
        <Button onClick={handleSaveChanges} data-testid="button-save-settings">
          {t('saveChanges')}
        </Button>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>{t('confirmDeleteDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> setShowDeleteConfirm(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>{t('confirmDelete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
