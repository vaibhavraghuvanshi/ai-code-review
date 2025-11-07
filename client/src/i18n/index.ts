import es from './es.json';
import de from './de.json';

export type Locale = 'english' | 'spanish' | 'german';

const en: Record<string, string> = {
  general: 'General',
  account: 'Account',
  generalPreferences: 'General Preferences',
  generalPreferencesDesc: 'Configure your basic application settings.',
  applicationTheme: 'Application Theme',
  emailNotifications: 'Email Notifications',
  emailNotificationsDesc: 'Receive email updates about your code reviews, new features, and important announcements.',
  autoSaveReviews: 'Auto-save Code Reviews',
  autoSaveReviewsDesc: 'Automatically save your review progress as you type.',
  defaultLanguage: 'Default Language',
  defaultLanguageDesc: 'Select the primary language for the application interface.',
  interfaceLocale: 'Interface Locale',

  profileInformation: 'Profile Information',
  profileInformationDesc: 'Update your account profile and personal details.',
  fullName: 'Full Name',
  emailAddress: 'Email Address',
  emailUsage: 'Your email is used for account recovery and notifications.',
  loadingUser: 'Loading user...',

  password: 'Password',
  passwordDesc: 'Change your password to keep your account secure.',
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmNewPassword: 'Confirm New Password',
  updatePassword: 'Update Password',

  dangerZone: 'Danger Zone',
  dangerZoneDesc: 'Irreversible and destructive actions.',
  deleteAccount: 'Delete Account',
  deleteAccountDesc: 'Permanently delete your account and all associated data.',
  confirmDeleteTitle: 'Delete account?',
  confirmDeleteDesc: 'This action cannot be undone. Confirm to delete your account.',
  confirmDelete: 'Delete permanently',

  cancel: 'Cancel',
  saveChanges: 'Save Changes',
  settingsSavedTitle: 'Settings saved',
  settingsSavedDesc: 'Your preferences have been updated.',
  login: 'Login',
  signup: 'Sign Up',
  logout: 'Logout',
};

const locales: Record<Locale, Record<string, string>> = {
  english: en,
  spanish: es as any,
  german: de as any,
};

export function i18nTranslate(key: string, locale: Locale = 'english'): string {
  const dict = locales[locale] || en;
  return dict[key] || en[key] || key;
}
