import { ProfileInfo } from "@/components/profile-info";

export default function Profile() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and view your subscription details.
        </p>
      </div>

      <ProfileInfo />
    </div>
  );
}
