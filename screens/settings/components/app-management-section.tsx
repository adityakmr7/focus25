import React from "react";
import ChevronRight from "./chevron-right";
import Divider from "./divider";
import SettingItem from "./setting-item";
import SettingsSection from "./settings-section";

const AppManagementSection: React.FC = () => {
  const handleCheckUpdates = () => {
    console.log("Check for updates");
  };

  const handleRateApp = () => {
    console.log("Open app store rating");
  };

  const handleSendFeedback = () => {
    console.log("Open feedback form");
  };

  return (
    <SettingsSection title="App Management">
      <SettingItem
        title="Check for Updates"
        rightElement={<ChevronRight />}
        onPress={handleCheckUpdates}
      />
      <Divider />
      <SettingItem
        title="Rate App"
        rightElement={<ChevronRight />}
        onPress={handleRateApp}
      />
      <Divider />
      <SettingItem
        title="Send Feedback"
        rightElement={<ChevronRight />}
        onPress={handleSendFeedback}
      />
    </SettingsSection>
  );
};

export default AppManagementSection;
