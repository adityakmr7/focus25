import TypographyText from '@/components/TypographyText';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, CardBody, HStack, SPACING, VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const TogglePill: React.FC<{
    leftLabel: string;
    rightLabel: string;
    value: 'monthly' | 'annual';
    onChange: (v: 'monthly' | 'annual') => void;
}> = ({ leftLabel, rightLabel, value, onChange }) => {
    const { theme } = useTheme();
    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            px="xs"
            py="xs"
            style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.colors['default-200'],
                width: 220,
            }}
        >
            {(
                [
                    { key: 'monthly', label: leftLabel },
                    { key: 'annual', label: rightLabel },
                ] as const
            ).map((opt) => {
                const selected = value === opt.key;
                return (
                    <Button
                        key={opt.key}
                        size="sm"
                        variant={selected ? 'solid' : 'outline'}
                        onPress={() => onChange(opt.key)}
                        style={{
                            flex: 1,
                            marginHorizontal: 4,
                        }}
                    >
                        <TypographyText
                            variant="body"
                            size="sm"
                            style={{
                                color: selected ? '#fff' : theme.colors.foreground,
                            }}
                        >
                            {opt.label}
                        </TypographyText>
                    </Button>
                );
            })}
        </HStack>
    );
};

const FeatureRow: React.FC<{ text: string }> = ({ text }) => {
    const { theme } = useTheme();
    return (
        <HStack alignItems="center" gap="unit-3">
            <View
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors.primary,
                    marginTop: 6,
                }}
            />
            <TypographyText variant="body">{text}</TypographyText>
        </HStack>
    );
};

const PlanScreen = () => {
    const { theme } = useTheme();
    const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

    const price = billing === 'monthly' ? 14.99 : 99.99;
    const cadence = billing === 'monthly' ? '/month' : '/year';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: SPACING['unit-16'],
                    paddingHorizontal: SPACING['unit-5'],
                }}
                style={{ flex: 1 }}
            >
                <VStack gap="unit-4" mt="sm">
                    <TypographyText variant="title" color="default">
                        Subscription Plans
                    </TypographyText>

                    <VStack gap="unit-2" mt="xs">
                        <HStack gap="unit-1">
                            <TypographyText variant="title" weight="bold">
                                Upgrade to
                            </TypographyText>
                            <TypographyText variant="title" weight="bold" color="primary">
                                Flowzy Premium
                            </TypographyText>
                        </HStack>
                        <TypographyText variant="body" size="sm">
                            Boost your productivity and creativity with a smarter, faster, and
                            limitless AI.
                        </TypographyText>
                    </VStack>

                    <VStack alignItems="center" mt="sm">
                        <TogglePill
                            leftLabel="Monthly"
                            rightLabel="Annual"
                            value={billing}
                            onChange={setBilling}
                        />
                    </VStack>

                    <Card variant="bordered" style={{ borderRadius: 20, overflow: 'hidden' }}>
                        <CardBody>
                            <VStack gap="unit-4">
                                <VStack gap="unit-1">
                                    <HStack gap="unit-1" alignItems="baseline">
                                        <TypographyText variant="title" weight="bold">
                                            ${price.toFixed(2)}
                                        </TypographyText>
                                        <TypographyText variant="body" size="sm">
                                            {cadence}
                                        </TypographyText>
                                    </HStack>
                                    <TypographyText variant="body" size="sm">
                                        AI-powered planning and tracking tools to manage ideas and
                                        reach your goals.
                                    </TypographyText>
                                </VStack>

                                <VStack gap="unit-2">
                                    <TypographyText variant="label">Features</TypographyText>
                                    <VStack gap="unit-3">
                                        <FeatureRow text="AI-Powered Idea Organization" />
                                        <FeatureRow text="Seamless Cloud Synchronization" />
                                        <FeatureRow text="Advanced AI-Driven Insights" />
                                        <FeatureRow text="Priority Customer Support" />
                                        <FeatureRow text="Real-Time Collaboration Tools" />
                                        <FeatureRow text="Fully Customizable Dashboards" />
                                    </VStack>
                                </VStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>
            </ScrollView>

            <View
                style={{
                    paddingHorizontal: SPACING['unit-5'],
                    paddingVertical: SPACING['unit-4'],
                }}
            >
                <Button size="lg" variant="solid">
                    <TypographyText variant="body" style={{ color: '#fff' }}>
                        Upgrade to Plus
                    </TypographyText>
                </Button>
            </View>
        </SafeAreaView>
    );
};

export default PlanScreen;
