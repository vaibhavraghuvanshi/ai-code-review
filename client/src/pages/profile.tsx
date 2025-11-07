import { ProfileInfo } from '@/components/profile-info';
import { useT } from '@/hooks/useI18n';

export default function Profile() {
    const t = useT();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('profileInformation')}</h1>
        <p className="text-muted-foreground">
          {t('profileInformationDesc')}
        </p>
      </div>
      <ProfileInfo />
    </div>
  );
}
