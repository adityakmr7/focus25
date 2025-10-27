import { useSettingsStore } from '@/stores/local-settings-store';
import React from 'react';
import { Avatar, Badge, HStack } from 'react-native-heroui';
import ChevronRight from './chevron-right';
import Divider from './divider';
import SettingItem from './setting-item';
import SettingsSection from './settings-section';

const AccountSection: React.FC = () => {
    const { userName, userEmail, isAccountBackedUp } = useSettingsStore();

    return (
        <SettingsSection title="Account">
            <SettingItem
                title={userName || 'Guest User'}
                subtitle={userEmail || 'No email provided'}
                icon={<Avatar size="md" src="https://i.pravatar.cc/150?u=john" />}
                rightElement={<ChevronRight />}
            />
            <Divider />
            <SettingItem
                title={isAccountBackedUp ? 'Account Backed Up' : 'Account Not Backed Up'}
                rightElement={
                    !isAccountBackedUp ? (
                        <HStack alignItems="center" gap="xs">
                            <Badge
                                variant="solid"
                                content="1"
                                color="danger"
                                size="md"
                                isOneChar={true}
                            />
                            <ChevronRight />
                        </HStack>
                    ) : (
                        <ChevronRight />
                    )
                }
            />
        </SettingsSection>
    );
};

export default AccountSection;
