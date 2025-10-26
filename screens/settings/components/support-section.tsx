import React from "react";
import ChevronRight from "./chevron-right";
import SettingItem from "./setting-item";
import SettingsSection from "./settings-section";

const SupportSection: React.FC = () => {
  const handleHelpAndSupport = () => {
    console.log("Open help center");
  };

  return (
    <SettingsSection title="Support">
      <SettingItem
        title="Help and Support"
        rightElement={<ChevronRight />}
        onPress={handleHelpAndSupport}
      />
    </SettingsSection>
  );
};

export default SupportSection;
