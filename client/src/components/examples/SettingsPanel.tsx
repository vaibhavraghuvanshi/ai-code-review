import { SettingsPanel } from "../settings-panel";
import { ThemeProvider } from "../theme-provider";

export default function SettingsPanelExample() {
  return (
    <ThemeProvider>
      <div className="p-6">
        <SettingsPanel />
      </div>
    </ThemeProvider>
  );
}
