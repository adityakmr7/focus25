import TypographyText from '@/components/TypographyText';
import HugeIconView from '@/components/ui/huge-icon-view';
import { useSettingsStore } from '@/stores/local-settings-store';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Card, CardBody, HStack, SPACING, VStack, useTheme, Switch } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { router } from 'expo-router';
import { Host, ContextMenu, Slider, Button as SwiftButton, Picker } from '@expo/ui/swift-ui';
import Avatar from '@/components/ui/avatar';
import { LazyRequireImages } from '@/assets/images/lazy-require-image';
import { Image } from 'expo-image';
const Header = () => {
    const { theme } = useTheme();
    return (
        <HStack alignItems="center" justifyContent="space-between" px="md" py="sm">
            <TouchableOpacity
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: theme.borderRadius.lg,
                    backgroundColor: theme.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                disabled
            >
                <HugeIconView icon={ArrowLeft02Icon} />
            </TouchableOpacity>
            <TypographyText variant="title" color="default">
                Settings
            </TypographyText>
            <TouchableOpacity
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: theme.borderRadius.lg,
                    backgroundColor: theme.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                disabled
            >
                {/* Dots placeholder */}
                <HStack gap="unit-1">
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.foreground,
                        }}
                    />
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.foreground,
                        }}
                    />
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.foreground,
                        }}
                    />
                </HStack>
            </TouchableOpacity>
        </HStack>
    );
};

const SubscriptionCard = ({ handleSeePlanPress }: { handleSeePlanPress: () => void }) => {
    const { theme } = useTheme();

    return (
        <Card variant="bordered" style={{ borderRadius: 20 }}>
            <CardBody>
                <HStack alignItems="center" justifyContent="space-between" gap="unit-4">
                    <HStack alignItems="center" gap="unit-3">
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: theme.borderRadius.lg,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Image
                                source={LazyRequireImages.starImage()}
                                style={{ width: 40, height: 40 }}
                            />
                        </View>
                        <VStack>
                            <TypographyText variant="body" weight="semibold">
                                Upgrade to Premium
                            </TypographyText>
                            <TypographyText variant="caption">
                                Unlock advance feature
                            </TypographyText>
                        </VStack>
                    </HStack>
                    <TouchableOpacity
                        onPress={handleSeePlanPress}
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            backgroundColor: theme.colors.foreground,
                            borderRadius: theme.borderRadius.lg,
                        }}
                    >
                        <TypographyText
                            variant="body"
                            size="sm"
                            style={{ color: theme.colors.content1 }}
                        >
                            See Plan
                        </TypographyText>
                    </TouchableOpacity>
                </HStack>
            </CardBody>
        </Card>
    );
};

const DURATION_OPTIONS = [1, 5, 10, 15, 25];

const SettingsScreen = () => {
    const { theme } = useTheme();
    const {
        focusDuration,
        breakDuration,
        setFocusDuration,
        setBreakDuration,
        userName,
        metronome,
        userEmail,
        themeMode,
        setThemeMode,
        setMetronome,
        setMetronomeVolume,
        metronomeVolume,
    } = useSettingsStore();

    const handleSeePlanPress = () => {
        router.push({
            pathname: '/plan',
            params: {
                from: 'settings',
            },
        });
    };
    const [focusIndex, setFocusIndex] = useState(
        Math.max(0, DURATION_OPTIONS.indexOf(focusDuration)),
    );
    const [breakIndex, setBreakIndex] = useState(
        Math.max(0, DURATION_OPTIONS.indexOf(breakDuration)),
    );

    const handleMetronomeChange = (value: boolean) => {
        setMetronome(!metronome);
    };
    const handleMetronomeVolumeChange = (value: number) => {
        setMetronomeVolume(value);
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Header />
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: SPACING['unit-14'],
                    paddingHorizontal: SPACING['unit-4'],
                }}
                style={{ flex: 1 }}
            >
                {userName && (
                    <VStack alignItems="center" gap="unit-2" py="md">
                        <View
                            style={{
                                width: 86,
                                height: 86,
                                borderRadius: 43,
                                overflow: 'hidden',
                                backgroundColor: theme.colors.background,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Avatar size={86} label={userName} />
                        </View>
                        <TypographyText variant="title" color="default">
                            {userName}
                        </TypographyText>
                        <TypographyText variant="body" color="default" size="sm">
                            {userEmail}
                        </TypographyText>
                    </VStack>
                )}

                <SubscriptionCard handleSeePlanPress={handleSeePlanPress} />

                {/* Sessions */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" color="default">
                        Sessions
                    </TypographyText>
                    <Card variant="bordered" style={{ borderRadius: 16 }}>
                        <CardBody>
                            <VStack gap="unit-2">
                                {/* Flow Duration - dropdown */}
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Flow Duration</TypographyText>
                                    <Host style={{ width: 80, height: 36 }}>
                                        <ContextMenu>
                                            <ContextMenu.Items>
                                                <Picker
                                                    label="Flow Duration"
                                                    options={DURATION_OPTIONS.map(
                                                        (m) => `${m} min`,
                                                    )}
                                                    variant="inline"
                                                    selectedIndex={focusIndex}
                                                    onOptionSelected={({
                                                        nativeEvent: { index },
                                                    }) => {
                                                        setFocusIndex(index);
                                                        setFocusDuration(DURATION_OPTIONS[index]);
                                                    }}
                                                />
                                            </ContextMenu.Items>
                                            <ContextMenu.Trigger>
                                                <SwiftButton variant="bordered">
                                                    {`${DURATION_OPTIONS[focusIndex]} min`}
                                                </SwiftButton>
                                            </ContextMenu.Trigger>
                                        </ContextMenu>
                                    </Host>
                                </HStack>

                                {/* Break Duration - dropdown */}
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Break Duration</TypographyText>
                                    <Host style={{ width: 80, height: 36 }}>
                                        <ContextMenu activationMethod="singlePress">
                                            <ContextMenu.Items>
                                                <Picker
                                                    label="Break Duration"
                                                    options={DURATION_OPTIONS.map(
                                                        (m) => `${m} min`,
                                                    )}
                                                    variant="inline"
                                                    selectedIndex={breakIndex}
                                                    onOptionSelected={({
                                                        nativeEvent: { index },
                                                    }) => {
                                                        setBreakIndex(index);
                                                        setBreakDuration(DURATION_OPTIONS[index]);
                                                    }}
                                                />
                                            </ContextMenu.Items>
                                            <ContextMenu.Trigger>
                                                <SwiftButton variant="bordered">
                                                    {`${DURATION_OPTIONS[breakIndex]} min`}
                                                </SwiftButton>
                                            </ContextMenu.Trigger>
                                        </ContextMenu>
                                    </Host>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>

                {/* General */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" color="default">
                        General
                    </TypographyText>
                    <Card variant="bordered" style={{ borderRadius: 16 }}>
                        <CardBody>
                            <VStack gap="unit-2">
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Notifications</TypographyText>
                                    <View
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRightWidth: 2,
                                            borderTopWidth: 2,
                                            borderColor: theme.colors.foreground,
                                            transform: [{ rotate: '45deg' }],
                                        }}
                                    />
                                </HStack>
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Apple Health</TypographyText>
                                    <Switch size="md" value={false} isDisabled />
                                </HStack>
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Metronome</TypographyText>
                                    <Switch
                                        size="md"
                                        value={metronome}
                                        onChange={handleMetronomeChange}
                                    />
                                </HStack>
                                <Host style={{ minHeight: 60 }}>
                                    <Slider
                                        value={metronomeVolume}
                                        onValueChange={handleMetronomeVolumeChange}
                                    />
                                </Host>
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Appearance</TypographyText>
                                    <Host style={{ width: 90, height: 36 }}>
                                        <ContextMenu>
                                            <ContextMenu.Items>
                                                {(
                                                    [
                                                        {
                                                            label: 'System',
                                                            value: 'system' as const,
                                                        },
                                                        { label: 'Dark', value: 'dark' as const },
                                                        { label: 'Light', value: 'light' as const },
                                                    ] as const
                                                ).map((opt) => (
                                                    <SwiftButton
                                                        key={opt.value}
                                                        onPress={() => setThemeMode(opt.value)}
                                                    >
                                                        {opt.label}
                                                    </SwiftButton>
                                                ))}
                                            </ContextMenu.Items>
                                            <ContextMenu.Trigger>
                                                <SwiftButton variant="bordered">
                                                    {themeMode === 'system'
                                                        ? 'System'
                                                        : themeMode === 'dark'
                                                          ? 'Dark'
                                                          : 'Light'}
                                                </SwiftButton>
                                            </ContextMenu.Trigger>
                                        </ContextMenu>
                                    </Host>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>

                {/* About */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" color="default">
                        About
                    </TypographyText>
                    {[
                        'About Us',
                        'How It Works',
                        'Manage Subscription',
                        'Recommend',
                        'Rate the App',
                        'Feedback & Support',
                    ].map((label) => (
                        <Card key={label} variant="bordered" style={{ borderRadius: 16 }}>
                            <CardBody>
                                <HStack alignItems="center" justifyContent="space-between">
                                    <TypographyText variant="body">{label}</TypographyText>
                                    <View
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRightWidth: 2,
                                            borderTopWidth: 2,
                                            borderColor: theme.colors.foreground,
                                            transform: [{ rotate: '45deg' }],
                                        }}
                                    />
                                </HStack>
                            </CardBody>
                        </Card>
                    ))}
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
