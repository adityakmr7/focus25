import { useSettingsStore } from "@/stores/setting-store";
import React from "react";
import SettingItem from "./setting-item";
import SettingsSection from "./settings-section";

const DeviceSection: React.FC = () => {
  const { deviceName } = useSettingsStore();

  return (
    <SettingsSection title="Device">
      <SettingItem title={deviceName} />
    </SettingsSection>
  );
};

export default DeviceSection;
