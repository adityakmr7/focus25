import React from 'react';
import { View, StyleSheet } from 'react-native';
import TypographyText from './TypographyText';
import { useTheme } from 'react-native-heroui';

interface PremiumBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline';
}

/**
 * PremiumBadge Component
 * Displays a badge indicating a premium feature
 * Can be used to mark premium features throughout the app
 */
const PremiumBadge: React.FC<PremiumBadgeProps> = ({
    size = 'sm',
    variant = 'default',
}) => {
    const { theme } = useTheme();

    const sizeStyles = {
        sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
        md: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
        lg: { paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
    };

    const currentSize = sizeStyles[size];

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor:
                        variant === 'default' ? theme.colors.primary : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                    borderColor: variant === 'outline' ? theme.colors.primary : 'transparent',
                    paddingHorizontal: currentSize.paddingHorizontal,
                    paddingVertical: currentSize.paddingVertical,
                },
            ]}
        >
            <TypographyText
                variant="caption"
                style={{
                    color: variant === 'default' ? '#fff' : theme.colors.primary,
                    fontSize: currentSize.fontSize,
                    fontWeight: '600',
                }}
            >
                PRO
            </TypographyText>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default PremiumBadge;

