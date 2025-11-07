import { usePreferences } from '@/components/preferences-provider';
import { i18nTranslate } from '@/i18n';

/**
 * useT - translation hook bound to current locale
 * Usage:
 *   const t = useT();
 *   <span>{t('dashboard')}</span>
 */
export function useT() {
  const { locale } = usePreferences();
  return (key: string) => i18nTranslate(key, locale);
}
