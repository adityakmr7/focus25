import React from "react";
import ChevronRight from "./chevron-right";
import Divider from "./divider";
import SettingItem from "./setting-item";
import SettingsSection from "./settings-section";

const LegalSection: React.FC = () => {
  const handlePrivacyPolicy = () => {
    console.log("Open privacy policy");
  };

  const handleTermsAndConditions = () => {
    console.log("Open terms and conditions");
  };

  return (
    <SettingsSection title="Legal">
      <SettingItem
        title="Privacy Policy"
        rightElement={<ChevronRight />}
        onPress={handlePrivacyPolicy}
      />
      <Divider />
      <SettingItem
        title="Terms and Conditions"
        rightElement={<ChevronRight />}
        onPress={handleTermsAndConditions}
      />
    </SettingsSection>
  );
};

export default LegalSection;
